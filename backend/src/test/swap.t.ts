import { createPublicClient, http, parseAbiItem, isAddress, type Address } from 'viem';
import env from "../config/env.js";
import z from "zod"

// ============================================================
// 1. TIPOS Y CONTRATOS (Practicando TypeScript y Tipado)
// ============================================================

type RawSwapEvent = z.infer<typeof RawSwapEventSchema>


const RawSwapEventSchema = z.object({
  txHash: z.string(),
  blockNumber: z.coerce.bigint(),
  fromUser: z.templateLiteral(["0x", z.string()]),
  tokenIn: z.templateLiteral(["0x", z.string()]),
  tokenOut: z.templateLiteral(["0x", z.string()]),
  amountIn: z.coerce.bigint(),
  amountOut: z.coerce.bigint(),
})

export interface UserStats {
  userAddress: Address;
  totalSwaps: number;
  totalAmountIn: bigint;
  totalAmountOut: bigint;
  tokensUsed: Set<Address>;
}

export interface BatchMetrics {
  fromBlock: bigint;
  toBlock: bigint;
  totalEventsProcessed: number;
  uniqueUsersCount: number;
  largestSwap: RawSwapEvent | null;
  topUsers: UserStats[];
}

// ============================================================
// 2. FUNCIONES DE PROCESAMIENTO (Practicando Arrays & Maps)
// ============================================================

/**
 * TODO #1: Type Guard
 * Crea una función que verifique si un objeto tiene la estructura válida de RawSwapEvent
 * usando un Type Predicate (val is RawSwapEvent).
 */
export function isValidSwap(val: any): val is RawSwapEvent {
  try {
    RawSwapEventSchema.parse(val)
    return true
  } catch (error) {
    return false
  }
}
 
/**
 * TODO #2: Agregación con Maps y Sets
 * Recibe una lista de RawSwapEvent y genera un mapa agrupado por usuario (Address).
 * Cada usuario debe acumular su totalSwaps, totalAmountIn, totalAmountOut y los tokens que usó.
 */
function aggregateByUser(swaps: RawSwapEvent[]): Map<Address, UserStats> {
  const userMap = new Map<Address, UserStats>();

  swaps.forEach((val, index) => {
    userMap.set(val.fromUser, {
      
    })
  })
  // Pistas:
  // - Itera sobre swaps usando .forEach() o for..of
  // - Si el usuario ya existe en el Map, actualiza sus totales (¡ojo con bigint: a + b!).
  // - Agrega val.tokenIn y val.tokenOut al Set de tokens del usuario.
  // - Si no existe, créalo con valores iniciales.

  return userMap; // <-- Completa aquí
}

/**
 * TODO #3: Encontrar el Swap más grande con .reduce()
 * Encuentra el swap con mayor 'amountIn' dentro de la lista. Si está vacía, retorna null.
 */
function findLargestSwap(swaps: RawSwapEvent[]): RawSwapEvent | null {
  if (swaps.length === 0) return null;

  // Pistas:
  // - Usa swaps.reduce((max, current) => ...)
  return null; // <-- Completa aquí
}

// ============================================================
// 3. INDEXADOR Y SINCRONIZACIÓN (Practicando RPC y Flujo)
// ============================================================

async function runIndexerExercise() {
  const client = createPublicClient({
    transport: http(env.RPC_URL),
  });

  console.log("🚀 Iniciando ejercicio de indexación y métricas...");

  // 1. Obtener el bloque actual de la red
  const currentBlock = await client.getBlockNumber();
  const startBlock = currentBlock > 50n ? currentBlock - 50n : 0n;

  console.log(`📡 Consultando RPC desde el bloque ${startBlock} hasta ${currentBlock}...`);

  // TODO #4: Consulta de logs vía RPC
  // Obtén los logs del evento SwapToken usando client.getLogs({...})
  // Contrato de prueba: '0x7701BA3ac760842318BC6c925c38aD762DDc2E41'
  // Evento: 'event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)'
  
  // const logs = await client.getLogs({...});

  // TODO #5: Mapear, Limpiar y Procesar
  // 1. Mapea los logs al formato RawSwapEvent
  // 2. Filtra con tu type guard: .filter(isValidSwap)
  // 3. Si no hay swaps, muestra un mensaje descriptivo y termina limpiamente.
  // 4. Si hay swaps:
  //    - Calcula los usuarios agregados usando aggregateByUser()
  //    - Convierte el Map en un Array ordenado de mayor a menor volumen: [...map.values()].sort(...)
  //    - Encuentra el swap más grande con findLargestSwap()
  //    - Imprime un resumen de métricas con console.table()

  console.log("✅ Proceso completado exitosamente.");
}

runIndexerExercise().catch(console.error);