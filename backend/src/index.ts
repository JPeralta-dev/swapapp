import { drizzle } from "drizzle-orm/neon-http"
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
 

import env from "./config/env.js"
import {swaps} from '../src/db/schemas.js'

export const db = drizzle(env.DATABASE_URL)

async function main() {
    const client = createPublicClient({
        chain: mainnet,
        transport: http()
    })
    const result = await db.select().from(swaps)
    console.log(result);

    const blockNumber = await client.getBlockNumber()
    console.log(blockNumber);
    
}

await main()