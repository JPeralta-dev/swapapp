import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerida"),
  RPC_URL: z.string().url("RPC_URL debe ser una URL válida").default("http://127.0.0.1:8545"),
  SWAPAPP_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección inválida de contrato"),
  START_BLOCK: z.coerce.bigint().default(0n),
  POLL_INTERVAL_MS: z.coerce.number().default(2000),
});

export const env = envSchema.parse(process.env);
