import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local from apps/web root
const envPath = path.resolve(__dirname, '../.env.local')
console.log(`Loading env from: ${envPath}`)
dotenv.config({ path: envPath })

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!dbUrl) {
    console.error('DATABASE_URL or POSTGRES_URL not found in .env.local')
    console.log('Please ensure you have .env.local with DATABASE_URL or POSTGRES_URL')
    process.exit(1)
}

console.log('Connecting to database...')
const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
})

async function run() {
    try {
        const migrationFile = path.resolve(__dirname, 'migrations/20251223000000_fix_payment_methods_constraints.sql')
        console.log(`Applying migration: ${migrationFile}`)
        
        if (!fs.existsSync(migrationFile)) {
            throw new Error(`Migration file not found: ${migrationFile}`)
        }

        await sql.file(migrationFile)
        
        console.log('Migration applied successfully!')
    } catch (err) {
        console.error('Error applying migration:', err)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

run()
