import { drizzle } from "drizzle-orm/neon-http"
import { createPublicClient, http, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'
 

import env from "./config/env.js"
import {swaps} from '../src/db/schemas.js'

export const db = drizzle(env.DATABASE_URL)

async function main() {
    const client = createPublicClient({
        // quitamos el mainnet porque en anvil estamos utilizando 31337
        transport: http(env.RPC_URL),
    })
    
    // const result = await db.select().from(swaps)
    // const blockNumber = await client.getBlockNumber()



    const swapTokenItem = parseAbiItem("function swapToken(uint256 amountIn_, uint256 amountOutMin_, address[] calldata path_, uint256 deadline_)")
    
    
    
}

await main()