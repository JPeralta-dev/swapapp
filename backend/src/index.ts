import { drizzle } from "drizzle-orm/node-postgres"
import { createPublicClient, http, parseAbiItem } from 'viem'
import env from "./config/env.js"
import { blocks, swaps, syncState } from "./db/schemas.js"
import { uuidv7 } from "uuidv7";

export const db = drizzle(env.DATABASE_URL)


async function main() {
    const client = createPublicClient({
        // quitamos el mainnet porque en anvil estamos utilizando 31337
        transport: http(env.RPC_URL),
    })

    //const swapTokenItem = parseAbiItem("function swapToken(uint256 amountIn_, uint256 amountOutMin_, address[] calldata path_, uint256 deadline_)")
    // tenemos todas las transacciones pero hay que recordar que en un bloque dentro puende haber varias transacciones
    const logs = await client.getLogs({
        address: '0x40ec018CDa28e11c3BfF23487dcE6102459A25B9', //contrato que vamos a estar observando
        event: parseAbiItem('event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)'), // evento que vamos a observer
        fromBlock: env.START_BLOCK
    })

    // importante regla: cada transaccion puede estar un un bloque es decir si 10 transaccione eestan en un nbloque
    // la promesa siguiente lo que va hacer es 10 peticiones.
    
    const uniqueBlocks = [...new Set(logs.map((nBlock) => nBlock))] // vamos a investigarlo a nivel profundo 

    /// con esto se supone que esta listo 

    const arrayBlocks =await  Promise.all(uniqueBlocks.map(async (val) => {
        const block = await client.getBlock({ blockNumber: val.blockNumber })  // esto consulta los bloques
        return {
            blockNumber: val.blockNumber,
            blockHash: val.blockHash,
            parentHash: block.parentHash,
            timestamp: new Date(Number(block.timestamp) * 1000)
        }
    }))

    // hacemos un mapa para una busqueda mas rapida
    //const mapTimestapBlock = new Map(arrayBlocks.map((val => [val.timestamp, val])))

    const transactions = logs.map((val) => {

        if (!val.blockTimestamp) { 
            return
        }
        //const block = mapTimestapBlock.get(val.blockTimestamp)
        
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
            timestamp: new Date(Number(val.blockTimestamp) * 1000)
        }
    })

    console.log(transactions);
    
    const cleanTransactions = transactions.filter((t): t is NonNullable<typeof t> => t !== undefined); // sagrada para quitar undedined
    
    // esta va a ser la transaccion atomica
    const resultTransaction = await db.transaction(async (tx) => {

        if (transactions.length === 0 || !transactions) return;
        // en mi opinion el worker primero sincroniza el estado y luego si actualiza
        const sync = tx 

        const swap = await tx
            .insert(swaps)
            .values(cleanTransactions)
            .returning()
            .onConflictDoNothing() // idempotente
        
        const block =  await tx
            .insert(blocks)
            .values(arrayBlocks)
            .returning()
            .onConflictDoNothing()
    })

}

await main()    