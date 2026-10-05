import { parseAbiItem } from "viem";

// Definición tipada con Viem del evento emitido por Swapapp.sol
export const swapTokenEvent = parseAbiItem(
  "event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)"
);
