import { parseEther, type Address } from 'viem';
import {
  isValidSwap,
  aggregateByUser,
  findLargestSwap,
  type RawSwapEvent
} from './swap.t.js';

console.log("🧪 =====================================================");
console.log("🧪 INICIANDO PRUEBAS CON MOCKS (Sin requerir Anvil)");
console.log("🧪 =====================================================\n");

// Direcciones simuladas
const ALICE: Address = '0x1111111111111111111111111111111111111111';
const BOB: Address = '0x2222222222222222222222222222222222222222';
const WETH: Address = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const USDC: Address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const DAI: Address = '0x6b175474e89094c44da98b954eedeac495271d0f';

// 1. Simulación de eventos recibidos (incluyendo uno corrupto para validar el Type Guard)
const mockRawData = [
  {
    txHash: '0xabc1',
    blockNumber: 100n,
    fromUser: ALICE,
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: parseEther('1.5'), // 1.5 WETH
    amountOut: 4500000000n,      // 4500 USDC (6 decimals)
  },
  {
    txHash: '0xabc2',
    blockNumber: 101n,
    fromUser: BOB,
    tokenIn: USDC,
    tokenOut: DAI,
    amountIn: 2000000000n,       // 2000 USDC
    amountOut: parseEther('2000'), // 2000 DAI
  },
  {
    txHash: '0xabc3',
    blockNumber: 102n,
    fromUser: ALICE,
    tokenIn: USDC,
    tokenOut: DAI,
    amountIn: 1000000000n,       // 1000 USDC
    amountOut: parseEther('1000'),
  },
  {
    txHash: '0xabc4',
    blockNumber: 103n,
    fromUser: BOB,
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: parseEther('5.0'), // 5.0 WETH (El swap más grande)
    amountOut: 15000000000n,     // 15000 USDC
  },
  // ❌ Evento corrupto intencional: no tiene amountIn y fromUser no tiene '0x'
  {
    txHash: '0xcorrupto',
    blockNumber: 104n,
    fromUser: 'direccion_invalida_sin_0x',
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: null,
    amountOut: 100n,
  }
];

// -------------------------------------------------------------
// PRUEBA 1: Validación con isValidSwap (Type Guard)
// -------------------------------------------------------------
console.log("▶ [PRUEBA 1] Filtrando eventos válidos con isValidSwap...");
const validSwaps: RawSwapEvent[] = mockRawData.filter(isValidSwap);

console.log(`  - Total recibidos: ${mockRawData.length}`);
console.log(`  - Total válidos: ${validSwaps.length}`);

if (validSwaps.length === 4) {
  console.log("  ✅ PASS: Se filtró con éxito el evento corrupto.\n");
} else {
  console.error("  ❌ FAIL: No se filtró correctamente el evento inválido.\n");
  process.exit(1);
}

// -------------------------------------------------------------
// PRUEBA 2: Agregación con aggregateByUser
// -------------------------------------------------------------
console.log("▶ [PRUEBA 2] Agregando métricas por usuario (Map & Set)...");
const userMetrics = aggregateByUser(validSwaps);

const aliceStats = userMetrics.get(ALICE);
const bobStats = userMetrics.get(BOB);

if (!aliceStats || !bobStats) {
  console.error("  ❌ FAIL: No se encontraron los usuarios agregados en el Map.");
  process.exit(1);
}

console.log(`  - Usuarios únicos detectados: ${userMetrics.size}`);
console.log(`  - Alice: ${aliceStats.totalSwaps} swaps, ${aliceStats.tokensUsed.size} tokens únicos utilizados.`);
console.log(`  - Bob: ${bobStats.totalSwaps} swaps, ${bobStats.tokensUsed.size} tokens únicos utilizados.`);

// Verificaciones
const aliceExpectedTokens = 3; // WETH, USDC, DAI
if (aliceStats.totalSwaps === 2 && aliceStats.tokensUsed.size === aliceExpectedTokens) {
  console.log("  ✅ PASS: Agregación de Alice correcta (Swaps y Set de tokens).\n");
} else {
  console.error(`  ❌ FAIL: Alice esperaba ${aliceExpectedTokens} tokens, obtuvo ${aliceStats.tokensUsed.size}.\n`);
  process.exit(1);
}

// -------------------------------------------------------------
// PRUEBA 3: Encontrar el Swap más grande con findLargestSwap
// -------------------------------------------------------------
console.log("▶ [PRUEBA 3] Encontrando el Swap más grande con .reduce()...");
const largest = findLargestSwap(validSwaps);

if (largest && largest.txHash === '0xabc4' && largest.amountIn === parseEther('5.0')) {
  console.log(`  ✅ PASS: Swap más grande identificado correctamente (${largest.txHash} con 5.0 WETH).\n`);
} else {
  console.error("  ❌ FAIL: No identificó el swap más grande.", largest);
  process.exit(1);
}

// -------------------------------------------------------------
// VISUALIZACIÓN DE RESULTADOS
// -------------------------------------------------------------
console.log("📊 ================= TABLA DE USUARIOS ================= 📊");
const printableUserStats = [...userMetrics.values()].map(u => ({
  Usuario: `${u.userAddress.slice(0, 8)}...${u.userAddress.slice(-6)}`,
  'Total Swaps': u.totalSwaps,
  'Tokens Distintos': u.tokensUsed.size,
  'Total AmountIn (raw)': u.totalAmountIn.toString(),
  'Total AmountOut (raw)': u.totalAmountOut.toString()
}));
console.table(printableUserStats);

console.log("\n💎 ================= SWAP MÁS GRANDE ================= 💎");
console.table([{
  TxHash: largest?.txHash,
  Bloque: largest?.blockNumber.toString(),
  Usuario: `${largest?.fromUser.slice(0, 8)}...`,
  'Amount In': largest?.amountIn.toString(),
  'Amount Out': largest?.amountOut.toString()
}]);

console.log("\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE! 🎉\n");
