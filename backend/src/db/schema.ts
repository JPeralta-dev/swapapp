import { pgTable, serial, varchar, bigint, timestamp, numeric, integer, uniqueIndex, index } from "drizzle-orm/pg-core";

// 1. Tabla de Estado de Sincronización (Checkpoint / Idempotencia)
export const syncState = pgTable("sync_state", {
  id: varchar("id", { length: 50 }).primaryKey(), // ej. 'swapapp_worker'
  lastIndexedBlock: bigint("last_indexed_block", { mode: "bigint" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Tabla de Bloques Indexados (Manejo de Reorgs y consistencia histórica)
export const blocks = pgTable("blocks", {
  blockNumber: bigint("block_number", { mode: "bigint" }).primaryKey(),
  blockHash: varchar("block_hash", { length: 66 }).notNull().unique(),
  parentHash: varchar("parent_hash", { length: 66 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

// 3. Tabla de Swaps (Eventos SwapToken normalizados y listos para consulta)
export const swaps = pgTable("swaps", {
  id: serial("id").primaryKey(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  logIndex: integer("log_index").notNull(),
  blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
  fromUser: varchar("from_user", { length: 42 }).notNull(),
  tokenIn: varchar("token_in", { length: 42 }).notNull(),
  tokenOut: varchar("token_out", { length: 42 }).notNull(),
  amountIn: numeric("amount_in", { precision: 78, scale: 0 }).notNull(),   // Soporta uint256 completo
  amountOut: numeric("amount_out", { precision: 78, scale: 0 }).notNull(), // Soporta uint256 completo
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Clave única compuesta para garantizar que ninguna transacción se duplique jamás (idempotencia)
  uniqueIndex("swaps_tx_hash_log_index_unique").on(table.txHash, table.logIndex),
  // Índices para consultas ultra rápidas por usuario y tokens
  index("swaps_from_user_idx").on(table.fromUser),
  index("swaps_token_in_idx").on(table.tokenIn),
  index("swaps_token_out_idx").on(table.tokenOut),
  index("swaps_block_number_idx").on(table.blockNumber),
]);
