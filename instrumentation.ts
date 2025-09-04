// instrumentation.ts
/**
 * Se ejecuta al iniciar el servidor (Next App Router).
 * Parsea APP_SECRETS (JSON) y mapea cada key -> process.env[key]
 * sin sobreescribir si ya existe.
 *
 * Ejemplo de APP_SECRETS:
 * {
 *   "JWT_SECRET": "super-secret",
 *   "ANOTHER_SECRET": "value"
 * }
 */
export async function register() {
  const raw = process.env.APP_SECRETS;
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === "string" && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.warn("APP_SECRETS no es JSON válido:", (e as Error).message);
  }
}
