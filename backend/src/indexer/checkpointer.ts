import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { syncState } from "../db/schema.js";
import { env } from "../config/env.js";

const SYNC_ID = "swapapp_worker";

export class Checkpointer {
  /**
   * Obtiene el último bloque indexado desde PostgreSQL.
   * Si es la primera vez que se ejecuta, inicializa el registro con START_BLOCK - 1.
   */
  static async getLastIndexedBlock(): Promise<bigint> {
    const existing = await db
      .select()
      .from(syncState)
      .where(eq(syncState.id, SYNC_ID))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].lastIndexedBlock;
    }

    // Inicializar el estado si es la primera ejecución
    const initialBlock = env.START_BLOCK > 0n ? env.START_BLOCK - 1n : 0n;
    await db.insert(syncState).values({
      id: SYNC_ID,
      lastIndexedBlock: initialBlock,
      updatedAt: new Date(),
    });

    return initialBlock;
  }

  /**
   * Actualiza el último bloque indexado (debe ejecutarse dentro de la transacción del batch).
   */
  static async updateLastIndexedBlock(blockNumber: bigint, txInstance = db): Promise<void> {
    await txInstance
      .insert(syncState)
      .values({
        id: SYNC_ID,
        lastIndexedBlock: blockNumber,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: syncState.id,
        set: {
          lastIndexedBlock: blockNumber,
          updatedAt: new Date(),
        },
      });
  }
}
