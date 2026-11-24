import { db } from './db/index.js';
import { main } from './indexer/sync.js';

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

    try {
        const result = await main()
        if (result?.isCatchUp) {
            await sleep(POLL_INTERVAL_MS)
        }
        consecutiveError = 0
    } catch (error) {
        errorTasks.push(error)
        consecutiveError += 1
        if (consecutiveError >= 3) {
            isRunning = false
            console.error("Indexer stopped after 3 failures")
        }
    }
    
}