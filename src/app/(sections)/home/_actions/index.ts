"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";

// Tipos de salida para selects
export type SelectOption = { label: string; value: number };

// ==============================
// Catálogo: Monedas
// ==============================
export async function getCurrenciesCatalog(): Promise<SelectOption[]> {
  const currencies = await prisma.currency.findMany({
    orderBy: { value: "asc" },
    select: { id: true, value: true },
  });

  return currencies.map((c) => ({
    value: c.id,
    label: c.value,
  }));
}

// ==============================
// Catálogo: Categorías
// ==============================
export async function getCategories(): Promise<SelectOption[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
}

// ==============================
// Catálogo: Productos por compañía (de la sesión)
// label: "Nombre - SKU - precio"
// ==============================
export async function getCompanyProductCatalog(): Promise<SelectOption[]> {
  const { companyId } = await verifyToken();

  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, price: true },
  });

  return products.map((p) => ({
    value: p.id,
    label: `${p.name} - ${p.sku} - ${p.price.toNumber()}`,
  }));
}

// ==============================
// Catálogo: Clientes por compañía (de la sesión)
// label: Empresa/Persona + RFC
// ==============================
export async function getCompanyClientCatalog(): Promise<SelectOption[]> {
  const { companyId } = await verifyToken();

  const clients = await prisma.client.findMany({
    where: { companyId },
    orderBy: [{ companyName: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      companyName: true,
      fullName: true,
      rfc: true,
    },
  });

  return clients.map((c) => ({
    value: c.id,
    label: `${c.companyName ?? c.fullName ?? "Sin nombre"} - ${c.rfc}`,
  }));
}

// ==============================
// KPIs del dashboard (tenant actual) — shape para SectionTop
// ==============================
type DashboardCard = {
  label: string;
  value: string | number;
  change: string;     // porcentaje o delta mostrado en la "pill"
  currency: string;   // leyenda inferior (p. ej. "MXN")
};

type StatsResponse = {
  success: boolean;
  message: string;
  data: DashboardCard[];
};

function formatMXN(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(n);
}

export async function getStats(): Promise<StatsResponse> {
  try {
    const { companyId } = await verifyToken();

    const [_productsCount, _clientsCount, _quotesCount] = await Promise.all([
      prisma.product.count({ where: { companyId } }),
      prisma.client.count({ where: { companyId } }),
      prisma.quotation.count({ where: { companyId } }),
    ]);

    // Valores dummy razonables para el dashboard (se pueden refinar después)
    // Manteniendo el shape exacto que SectionTop espera:
    const cards: DashboardCard[] = [
      {
        label: "Total Cotizaciones",
        value: formatMXN(_quotesCount * 1000), // monto mostrado como string
        change: "+5",
        currency: "MXN",
      },
      {
        label: "Total Vendido",
        value: formatMXN(Math.max(0, _quotesCount - 1) * 800),
        change: "+3",
        currency: "MXN",
      },
      {
        label: "Por Cobrar",
        value: formatMXN(Math.max(0, _quotesCount - 2) * 600),
        change: "-1",
        currency: "MXN",
      },
      {
        label: "Tasa Conversión",
        value: Math.min(100, _quotesCount > 0 ? Math.round((_quotesCount / (_quotesCount + 3)) * 100) : 0), // número (SectionTop hace .toString())
        change: "+2",
        currency: "MXN",
      },
      {
        label: "Cliente activos",
        value: _clientsCount, // número (SectionTop hace .toString())
        change: "+1",
        currency: "",
      },
    ];

    return { success: true, message: "OK", data: cards };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "No autorizado o error obteniendo KPIs",
      data: [],
    };
  }
}
