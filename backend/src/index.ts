import { drizzle } from "drizzle-orm/neon-http"
import env from "./config/env.js"
import {swaps} from '../src/db/schemas.js'

export const db = drizzle(env.DATABASE_URL)

async function  main () {
    const result = await db.select().from(swaps)
    console.log(result);
}

await main()