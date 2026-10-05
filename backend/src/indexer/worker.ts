import { publicClient } from "../config/client.js";
import { env } from "../config/env.js";
import { swapTokenEvent } from "../config/abi.js";
import { db } from "../db/index.js";
import { swaps, blocks } from "../db/schema.js";
import { Checkpointer } from "./checkpointer.js";

const MAX_BLOCKS_PER_QUERY = 1000n;

export class IndexerWorker {
  private isRunning = false;

  async start(): Promise<void> {
    this.isRunning = true;
    console.log("==================================================");
    console.log("🚀 Indexer Worker iniciado...");
    console.log(`📡 Conectado a RPC: ${env.RPC_URL}`);
    console.log(`📄 Contrato Swapapp: ${env.SWAPAPP_CONTRACT_ADDRESS}`);
    console.log(`⏱️ Intervalo de sondeo: ${env.POLL_INTERVAL_MS}ms`);
    console.log("==================================================");

    while (this.isRunning) {
      try {
        await this.syncNextBatch();
      } catch (error) {
        console.error("❌ Error en ciclo del indexador:", error);
      }

      // Esperar antes del siguiente sondeo
      await new Promise((resolve) => setTimeout(resolve, env.POLL_INTERVAL_MS));
    }
  }

  stop(): void {
    console.log("🛑 Deteniendo Indexer Worker...");
    this.isRunning = false;
  }

  private async syncNextBatch(): Promise<void> {
    const lastIndexedBlock = await Checkpointer.getLastIndexedBlock();
    const currentBlock = await publicClient.getBlockNumber();

    if (currentBlock <= lastIndexedBlock) {
      // Estamos al día con la blockchain
      return;
    }

    const fromBlock = lastIndexedBlock + 1n;
    const toBlock =
      fromBlock + MAX_BLOCKS_PER_QUERY - 1n > currentBlock
        ? currentBlock
        : fromBlock + MAX_BLOCKS_PER_QUERY - 1n;

    console.log(`🔍 Sincronizando bloques [${fromBlock} -> ${toBlock}] (Actual: ${currentBlock})...`);

    // 1. Obtener eventos SwapToken en este rango de bloques
    const logs = await publicClient.getLogs({
      address: env.SWAPAPP_CONTRACT_ADDRESS as `0x${string}`,
      event: swapTokenEvent,
      fromBlock,
      toBlock,
    });

    if (logs.length > 0) {
      console.log(`✨ Se encontraron ${logs.length} evento(s) de swap en este lote.`);
    }

    // 2. Procesar y guardar en PostgreSQL con transacción atómica
    await db.transaction(async (tx) => {
      // Guardar cada swap decodificado
      for (const log of logs) {
        const { fromUser, tokenIn, tokenOut, amountIn, amountOut } = log.args;

        if (!fromUser || !tokenIn || !tokenOut || amountIn === undefined || amountOut === undefined) {
          continue;
        }

        // Obtener detalles del bloque para el timestamp real
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        const blockTime = new Date(Number(block.timestamp) * 1000);

        // Guardar metadata del bloque si no existe
        await tx
          .insert(blocks)
          .values({
            blockNumber: log.blockNumber,
            blockHash: block.hash,
            parentHash: block.parentHash,
            timestamp: blockTime,
          })
          .onConflictDoNothing();

        // Guardar el swap
        await tx
          .insert(swaps)
          .values({
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            fromUser: fromUser.toLowerCase(),
            tokenIn: tokenIn.toLowerCase(),
            tokenOut: tokenOut.toLowerCase(),
            amountIn: amountIn.toString(),
            amountOut: amountOut.toString(),
            timestamp: blockTime,
          })
          .onConflictDoNothing();

        console.log(
          `  💾 Swap indexado: TX ${log.transactionHash.slice(0, 10)}... | Usuario: ${fromUser.slice(0, 8)}... | ${amountIn} in -> ${amountOut} out`
        );
      }

      // 3. Actualizar checkpoint al bloque toBlock
      await Checkpointer.updateLastIndexedBlock(toBlock, tx as any);
    });
  }
}
