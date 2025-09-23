import 'server-only';
import { PrismaClient } from '@prisma/client';

let prismaSingleton: PrismaClient | undefined;

function createClient(): PrismaClient {
  return new PrismaClient();
}

export function getPrisma(): PrismaClient {
  if (prismaSingleton) return prismaSingleton;

  if (process.env.NODE_ENV !== 'production') {
    const g = globalThis as unknown as { __PRISMA__?: PrismaClient };
    prismaSingleton = g.__PRISMA__ ?? createClient();
    g.__PRISMA__ = prismaSingleton;
    return prismaSingleton;
  }

  prismaSingleton = createClient();
  return prismaSingleton;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    const client = getPrisma();
    const record = client as Record<keyof PrismaClient, unknown>;
    const value = record[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
}) as PrismaClient;

export default prisma;
