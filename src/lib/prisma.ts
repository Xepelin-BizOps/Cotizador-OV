import { PrismaClient } from "@prisma/client";
import { config } from "./config";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL || config.DATABASE_URL; 

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;