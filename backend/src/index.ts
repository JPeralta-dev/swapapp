import { IndexerWorker } from "./indexer/worker.js";
import { pool } from "./db/index.js";

const worker = new IndexerWorker();

async function main() {
  // Manejo de señales de apagado limpio (Graceful Shutdown)
  const shutdown = async () => {
    console.log("\n🛑 Señal de terminación recibida. Cerrando conexiones...");
    worker.stop();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await worker.start();
}

main().catch((err) => {
  console.error("💥 Error fatal al arrancar el backend:", err);
  process.exit(1);
});
