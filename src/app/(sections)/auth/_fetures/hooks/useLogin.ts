"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import type { ResAuthMe } from "@/app/(sections)/auth/_fetures/action";

type MeResponse = {
  success: boolean;
  user?: unknown;
  message?: string;
};

type LoginState = {
  isLoading: boolean;
  data: MeResponse | null;
  message: string;
  error: boolean;
};

/** Toggle de debug via ENV (por defecto encendido si NEXT_PUBLIC_AUTH_DEBUG === "1") */
const DEBUG = (process.env.NEXT_PUBLIC_AUTH_DEBUG ?? "1") === "1";
const tag = "[useLogin]";
const log = (...args: unknown[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(tag, ...args);
};
const warn = (...args: unknown[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.warn(tag, ...args);
};
const errlog = (...args: unknown[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.error(tag, ...args);
};

/**
 * Lee NEXT_PUBLIC_ALLOWED_ORIGINS (CSV).
 * - En DEV: si está vacío o incluye "*", permite todo.
 * - En PROD: exige lista explícita, pero SIEMPRE aceptamos same-origin.
 */
function readAllowedOriginsFromEnv() {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === "production";
  const hasStar = list.includes("*");
  const allowAll = hasStar || (!isProd && list.length === 0);

  if (DEBUG) {
    log("readAllowedOriginsFromEnv()", {
      NODE_ENV: process.env.NODE_ENV,
      raw,
      list,
      hasStar,
      allowAll,
    });
  }

  return { list, allowAll };
}

// ───────── Type guards (sin any)
type CtxDispatch = Dispatch<SetStateAction<ResAuthMe>>;
type CtxKeySetter = (key: string, value: unknown) => void;

function isDispatch(fn: unknown): fn is CtxDispatch {
  return typeof fn === "function" && fn.length === 1;
}
function isKeySetter(fn: unknown): fn is CtxKeySetter {
  return typeof fn === "function" && fn.length >= 2;
}

// Aceptamos tanto AUTH_SUCCESS (legacy) como session-context-update (host real)
function isAcceptedMessage(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object") return false;
  const t = (data as Record<string, unknown>)["type"];
  return t === "AUTH_SUCCESS" || t === "session-context-update";
}

export default function useLogin(): LoginState & {
  setData: Dispatch<SetStateAction<LoginState>>;
} {
  const router = useRouter();

  const ctx = useAuthContext?.();
  const setValue = (ctx as { setValue?: unknown } | undefined)?.setValue;

  const [state, setState] = useState<LoginState>({
    isLoading: false,
    data: null,
    message: "",
    error: false,
  });

  // Evita doble ejecución si llegan dos postMessage casi simultáneos
  const inFlightRef = useRef(false);
  const seqRef = useRef(0); // correlación de eventos

  useEffect(() => {
    const { list, allowAll } = readAllowedOriginsFromEnv();

    log("Efecto montado. Agregando listeners de 'message' y 'messageerror'.", {
      locationOrigin: typeof window !== "undefined" ? window.location.origin : "(no-window)",
    });

    const handleMessageError = (event: MessageEvent) => {
      warn("messageerror recibido", event);
    };

    const handleMessage = async (event: MessageEvent<unknown>) => {
      const seq = ++seqRef.current;
      const startedAt = performance.now();

      // Grupo plegable por evento
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(`${tag} postMessage #${seq} @ ${new Date().toISOString()} (origin: ${event.origin})`);
        log("Evento bruto:", event);
      }

      try {
        // ✅ Permite siempre same-origin aunque la lista esté vacía
        const sameOrigin = event.origin === window.location.origin;
        const originOk =
          sameOrigin || allowAll || (event.origin && list.some((o) => o === event.origin));

        log(`#${seq} Origen`, { sameOrigin, allowAll, eventOrigin: event.origin, list, originOk });
        if (!originOk) {
          warn(`#${seq} Origen NO permitido. Ignorando mensaje.`);
          return;
        }

        // Verifica tipo de mensaje
        const accepted = isAcceptedMessage(event.data);
        log(`#${seq} Tipo de mensaje`, {
          dataType: typeof event.data,
          data: event.data,
          accepted,
        });
        if (!accepted) {
          warn(`#${seq} Tipo de mensaje no aceptado. Ignorando.`);
          return;
        }

        // Evitar carrera si ya hay uno en vuelo
        if (inFlightRef.current) {
          warn(`#${seq} Ya hay una autenticación en vuelo. Ignorando este mensaje.`);
          return;
        }
        inFlightRef.current = true;

        setState((s) => ({ ...s, isLoading: true, error: false, message: "" }));

        // 1) Login: JSON + credentials:"include" para persistir cookie
        log(`#${seq} → POST /api/auth/login`, { payload: event.data });
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          // Enviamos el payload tal cual (session-context-update o AUTH_SUCCESS)
          body: JSON.stringify(event.data),
        });

        log(`#${seq} ← /api/auth/login`, {
          ok: loginRes.ok,
          status: loginRes.status,
          // Nota: por seguridad, los navegadores NO exponen 'set-cookie' al JS del cliente.
          setCookieHeaderOnClient: loginRes.headers.get("set-cookie") ?? null,
        });

        if (!loginRes.ok) {
          const txt = await loginRes.text().catch(() => "");
          throw new Error(`Login HTTP ${loginRes.status} ${txt}`);
        }

        // 2) auth/me DESPUÉS del Set-Cookie
        log(`#${seq} → GET /api/auth/me`);
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: { "cache-control": "no-store" },
        });

        const meJson = (await meRes.json().catch(() => ({}))) as MeResponse;

        log(`#${seq} ← /api/auth/me`, {
          ok: meRes.ok,
          status: meRes.status,
          body: meJson,
        });

        if (!meRes.ok || meJson?.success !== true) {
          throw new Error(meJson?.message || "No autorizado – token no encontrado");
        }

        // Actualizar AuthContext sea cual sea su firma
        if (isDispatch(setValue)) {
          log(`#${seq} Actualizando AuthContext (dispatch)`);
          setValue((prev) => ({
            ...(prev ?? { isLoggedIn: false, user: null }),
            isLoggedIn: true,
            user: meJson.user ?? null,
          }));
        } else if (isKeySetter(setValue)) {
          log(`#${seq} Actualizando AuthContext (key setter)`);
          setValue("user", meJson.user ?? null);
          setValue("isLoggedIn", true);
        } else {
          warn(
            `#${seq} No se reconoció la firma de setValue en AuthContext. ` +
              "El contexto no fue actualizado automáticamente."
          );
        }

        setState({
          isLoading: false,
          data: meJson,
          message: "¡Login exitoso!",
          error: false,
        });

        log(`#${seq} ✅ Autenticado. Redirigiendo a /home`);
        router.replace("/home");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de autenticación";
        errlog("✖ Error en autenticación:", msg, err);
        setState({
          isLoading: false,
          data: null,
          message: msg,
          error: true,
        });
      } finally {
        inFlightRef.current = false;
        const elapsed = Math.round(performance.now() - startedAt);
        log(`Finalizado evento postMessage #${seq} en ${elapsed}ms`);
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.groupEnd();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("messageerror", handleMessageError);

    return () => {
      log("Desmontando efecto. Removiendo listeners.");
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("messageerror", handleMessageError);
    };
  }, [router, setValue]);

  // Compatibilidad: devuelve campos en la raíz (como los espera AuthPage)
  return { ...state, setData: setState };
}
