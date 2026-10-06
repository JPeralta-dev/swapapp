import { pgTable, serial, varchar, bigint, timestamp, numeric, integer, uniqueIndex, index } from "drizzle-orm/pg-core";

// 1. Tabla de Control / Checkpoint
export const syncState = pgTable("sync_state", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ej: 'swapapp_worker'
  lastIndexedBlock: bigint("last_indexed_block", { mode: "bigint" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Tabla de Bloques (Para consistencia y trazabilidad de hashes)
export const blocks = pgTable("blocks", {
  blockNumber: bigint("block_number", { mode: "bigint" }).primaryKey(),
  blockHash: varchar("block_hash", { length: 66 }).notNull().unique(),
  parentHash: varchar("parent_hash", { length: 66 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

// 3. Tabla de Swaps (Los eventos normalizados)
export const swaps = pgTable("swaps", {
  id: serial("id").primaryKey(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  logIndex: integer("log_index").notNull(),
  blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
  fromUser: varchar("from_user", { length: 42 }).notNull(),
  tokenIn: varchar("token_in", { length: 42 }).notNull(),
  tokenOut: varchar("token_out", { length: 42 }).notNull(),
  amountIn: numeric("amount_in", { precision: 78, scale: 0 }).notNull(),
  amountOut: numeric("amount_out", { precision: 78, scale: 0 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Clave única compuesta: Impide registrar el mismo evento dos veces
  uniqueIndex("swaps_tx_hash_log_index_unique").on(table.txHash, table.logIndex),
  // Índices para que las consultas del frontend vuelen en milisegundos
  index("swaps_from_user_idx").on(table.fromUser),
  index("swaps_token_in_idx").on(table.tokenIn),
  index("swaps_token_out_idx").on(table.tokenOut),
]);