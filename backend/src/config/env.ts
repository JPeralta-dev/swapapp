import dotenv from "dotenv"
import z from "zod"

dotenv.config()

const schemaEnv = z.object({
    DATABASE_URL: z.string()
})

let env: z.infer<typeof schemaEnv>

try {
    env = schemaEnv.parse(process.env)
} catch (error) {
    if (error instanceof z.ZodError) {
        console.log('Invalid environment configuration', { error });
        
    }
    process.exit(1)
}

export default env