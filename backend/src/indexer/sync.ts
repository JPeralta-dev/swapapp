import { parseAbiItem } from "viem";
import { client } from "../blockchain/client.js";
import env from "../config/env.js";
import { eq } from "drizzle-orm";
import { blocks, swaps, syncState } from "../db/schemas.js";
import { db } from "../db/index.js";
import { uuidv7 } from "uuidv7"

export async function main() {

    const currentBlock = await client.getBlockNumber()

    const [existingBlock] = await db.select().from(syncState).where(eq(syncState.id, "swapapp_indexer")) || env.START_BLOCK



    const lastBlock = existingBlock ? existingBlock.lastIndexedBlock : env.START_BLOCK - 1n

    if (currentBlock <= lastBlock) {
        console.log(`Al día con la blockchain (Bloque ${currentBlock}). Esperando...`);
        return;
    }

    const toBlock = lastBlock - currentBlock > env.MAX_BLOCK_RANGE ? lastBlock + env.MAX_BLOCK_RANGE - 1n : currentBlock

    // 200 - 300 = 100 > 50, si es true entonces 250 no es mayor a el rango es decir cumple
    //const swapTokenItem = parseAbiItem("function swapToken(uint256 amountIn_, uint256 amountOutMin_, address[] calldata path_, uint256 deadline_)")
    // tenemos todas las transacciones pero hay que recordar que en un bloque dentro puende haber varias transacciones
    const logs = await client.getLogs({
        address: env.SWAPAPP_CONTRACT_ADDRESS, //contrato que vamos a estar observando
        event: parseAbiItem('event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)'), // evento que vamos a observer
        fromBlock: lastBlock + 1n,
        toBlock
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