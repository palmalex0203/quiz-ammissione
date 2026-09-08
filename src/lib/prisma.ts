import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prismaClient: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL non impostata.");

  // Una sola pool riusata: in sviluppo il ricaricamento a caldo rieseguirebbe
  // questo modulo a ogni modifica, aprendo connessioni che nessuno chiude.
  const pool = globalThis.prismaPool ?? new Pool({ connectionString });
  if (process.env.NODE_ENV !== "production") globalThis.prismaPool = pool;

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalThis.prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma;
}
