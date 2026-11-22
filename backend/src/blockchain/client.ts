import { createPublicClient, http } from "viem";
import env from "../config/env.js";

export const client = createPublicClient({
    // quitamos el mainnet porque en anvil estamos utilizando 31337
    transport: http(env.RPC_URL),
})