import { createPublicClient, http } from "viem";
import { env } from "./env.js";

// Cliente público de Viem para comunicarse con el nodo RPC (Anvil o red de pruebas)
export const publicClient = createPublicClient({
  transport: http(env.RPC_URL),
});
