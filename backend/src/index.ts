import { timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from "drizzle-orm/node-postgres"
import { createPublicClient, http, parseAbiItem } from 'viem'
import env from "./config/env.js"
import { blocks, swaps, syncState } from "./db/schemas.js"
import { uuidv7 } from "uuidv7";
import { eq } from "drizzle-orm";
import { Pool } from 'pg';

export const db = drizzle(env.DATABASE_URL)


async function main() {
    const client = createPublicClient({
        // quitamos el mainnet porque en anvil estamos utilizando 31337
        transport: http(env.RPC_URL),
    })
    const currentBlock = await client.getBlockNumber()

    const [existingBlock] = await db.select().from(syncState).where(eq(syncState.id, "swapapp_indexer")) || env.START_BLOCK

    const lastBlock = existingBlock ? existingBlock.lastIndexedBlock : env.START_BLOCK - 1n

    //const swapTokenItem = parseAbiItem("function swapToken(uint256 amountIn_, uint256 amountOutMin_, address[] calldata path_, uint256 deadline_)")
    // tenemos todas las transacciones pero hay que recordar que en un bloque dentro puende haber varias transacciones
    const logs = await client.getLogs({
        address: '0x7701BA3ac760842318BC6c925c38aD762DDc2E41', //contrato que vamos a estar observando
        event: parseAbiItem('event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)'), // evento que vamos a observer
        fromBlock: lastBlock + 1n,
        toBlock: currentBlock
    })

    // importante regla: cada transaccion puede estar un un bloque es decir si 10 transaccione eestan en un nbloque
    // la promesa siguiente lo que va hacer es 10 peticiones.

    const uniqueBlocks = [...new Set(logs.map((nBlock) => nBlock.blockNumber))] // vamos a investigarlo a nivel profundo 

    /// con esto se supone que esta listo 

    const arrayBlocks = await Promise.all(uniqueBlocks.map(async (val) => {
        const block = await client.getBlock({ blockNumber: val })  // esto consulta los bloques
        return {
            blockNumber: val,
            blockHash: block.hash,
            parentHash: block.parentHash,
            timestamp: block.timestamp
        }
    }))

    // hacemos un mapa para una busqueda mas rapida
    const mapTimestapBlock = new Map(arrayBlocks.map((val => [val.blockNumber, val])))

    const transactions = logs.map((val) => {

        const block = mapTimestapBlock.get(val.blockNumber)

        return {
            id: uuidv7(),
            txHash: val.transactionHash,
            logIndex: val.logIndex,
            blockNumber: val.blockNumber,
            fromUser: val.args.fromUser!,
            tokenIn: val.args.tokenIn!,
            tokenOut: val.args.tokenOut!,
            amountIn: val.args.amountIn!.toString(),
            amountOut: val.args.amountOut!.toString(),
            timestamp: new Date(Number(block!.timestamp!) * 1000)
        }
    })



    const cleanTransactions = transactions.filter((t): t is NonNullable<typeof t> => t !== undefined); // sagrada para quitar undefined


    const maxNumberBlock = arrayBlocks.reduce((max, block) => block.blockNumber > max ? block.blockNumber : max, currentBlock)
    // esta va a ser la transaccion atomica
    await db.transaction(async (tx) => {

        if (logs.length === 0 || !transactions) {
            await tx
                .update(syncState)
                .set({ updatedAt: new Date(), lastIndexedBlock: currentBlock })
                .where(eq(syncState.id, "swapapp_indexer"))
            return
        };

        const block = tx
            .insert(blocks)
            .values(arrayBlocks.map(block => ({ ...block, timestamp: new Date(Number(block.timestamp) * 1000) })))
            .onConflictDoNothing()
            .returning()

        const swap = tx
            .insert(swaps)
            .values(cleanTransactions)
            .onConflictDoNothing() // idempotente
            .returning()

        const sync = tx
            .insert(syncState)
            .values({
                id: "swapapp_indexer",
                lastIndexedBlock: maxNumberBlock,
                updatedAt: new Date()
            })
            .onConflictDoUpdate({
                target: syncState.id,
                set: {
                    lastIndexedBlock: maxNumberBlock,
                    updatedAt: new Date()
                }
            })

        return Promise.all([block, swap, sync])
    })


}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const errorTasks: unknown[] = []


const POLL_INTERVAL_MS = 5000
let isRunning = true



process.on("SIGINT", async () => {
    isRunning = false
    await db.$client.end()
    process.exit(0)
})

let consecutiveError = 0

// esta parte me genera dudas pero vamos a intentar resolverlo.
while (isRunning) {
    await sleep(POLL_INTERVAL_MS)
    try {
        await main()
        consecutiveError = 0
    } catch (error) {
        errorTasks.push(error)
        consecutiveError+= 1
        if (consecutiveError>= 3) {
            isRunning = false
            console.error("Indexer stopped after 3 failures")
        }
    }
}