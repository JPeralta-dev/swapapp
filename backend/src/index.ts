import { drizzle } from "drizzle-orm/node-postgres"
import { createPublicClient, http, parseAbiItem } from 'viem'
import env from "./config/env.js"
import { swaps } from "./db/schemas.js"
import z from "zod"
import { uuidv7 } from "uuidv7";

export const db = drizzle(env.DATABASE_URL)


const block = z.object({
    blockNumber: z.coerce.bigint(),
    blockHash: z.string(),
    parentHash: z.string(),
    timestamp: z.date()
})

const swap = z.object({
    id: z.string(),
    txHash: z.string(),
    logIndex: z.number(),
    blockNumber: z.coerce.bigint(),
    fromUser: z.string(),
    tokenIn: z.string(),
    tokenOut: z.string(),
    amountIn: z.number(),
    amountOut: z.number(),
    timestamp: z.date(),
    createdAt: z.date()
})


async function main() {
    const client = createPublicClient({
        // quitamos el mainnet porque en anvil estamos utilizando 31337
        transport: http(env.RPC_URL),
    })

    //const swapTokenItem = parseAbiItem("function swapToken(uint256 amountIn_, uint256 amountOutMin_, address[] calldata path_, uint256 deadline_)")

    const logs = await client.getLogs({
        address: '0x40ec018CDa28e11c3BfF23487dcE6102459A25B9', //contrato que vamos a estar observando
        event: parseAbiItem('event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)'), // evento que vamos a observer
        fromBlock: env.START_BLOCK
    })

    console.log(logs);
    // importante regla: cada transaccion puede estar un un bloque es decir si 10 transaccione eestan en un nbloque
    // la promesa siguiente lo que va hacer es 10 peticiones.
    
    const uniqueBlocks = [...new Set(logs.map((nBlock) => nBlock))]

    /// con esto se supone que esta listo 

    const getBlock =await  Promise.all(uniqueBlocks.map(async (val) => {
        const block = await client.getBlock({ blockNumber: val.blockNumber })  // esto consulta los bloques
        return {
            blockNumber: val.blockNumber,
            blockHash: val.blockHash,
            parentHash: block.parentHash,
            timestamp: block.timestamp
        }
    }))

    // hacemos un mapa para una busqueda mas rapida
    const mapTimestapBlock = new Map(getBlock.map((val => [val.timestamp, val])))

    console.log(getBlock);

    const getTransactions = logs.map((val) => {

        if (!val.blockTimestamp) { 
            return
        }
        const block = mapTimestapBlock.get(val.blockTimestamp)
        
        return {
            id: uuidv7(),
            txHash: val.transactionHash,
            logIndex: val.logIndex,
            blockNumber: val.blockNumber,
            fromUser: val.args.fromUser,
            tokenIn: val.args.tokenIn,
            tokenOut: val.args.tokenOut,
            amountIn: val.args.amountIn,
            amountOut: val.args.amountOut,
            timestamp: val.blockTimestamp ?? block?.timestamp
        }
    })

    console.log(getTransactions);
    

    // esta va a ser la transaccion atomica
    const resultTransaction = await db.transaction(async (tx) => {

        // ya puedo utilizar getBlock con values 
    })
}

await main()    