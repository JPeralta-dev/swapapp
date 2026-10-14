import { drizzle } from "drizzle-orm/neon-http"
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
 

import env from "./config/env.js"
import {swaps} from '../src/db/schemas.js'

export const db = drizzle(env.DATABASE_URL)

async function main() {
    const client = createPublicClient({
        chain: mainnet,
        transport: http(env.RPC_URL),
        
    })
    const result = await db.select().from(swaps)
    const blockNumber = await client.getBlockNumber()
    
    
}

await main()