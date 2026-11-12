import { drizzle } from "drizzle-orm/neon-http"
import { createPublicClient, http, parseAbiItem } from 'viem'
import env from "./config/env.js"

export const db = drizzle(env.DATABASE_URL)

async function main() {
    const client = createPublicClient({
        // quitamos el mainnet porque en anvil estamos utilizando 31337
        transport: http(env.RPC_URL),
    })

    const swapTokenItem = parseAbiItem("function swapToken(uint256 amountIn_, uint256 amountOutMin_, address[] calldata path_, uint256 deadline_)")

    const logs = await  client.getLogs({
        address: '0x40ec018CDa28e11c3BfF23487dcE6102459A25B9', //contrato que vamos a estar observando
        event: parseAbiItem('event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)'), // evento que vamos a observer
        fromBlock: env.START_BLOCK
    })
    console.log(logs);

}

await main()