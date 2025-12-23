import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
    console.error('❌ Missing DATABASE_URL')
    process.exit(1)
}

const sql = postgres(dbUrl, { ssl: 'require', max: 1 })

async function run() {
    const file = process.argv[2]
    if (!file) {
        console.error('Please provide migration file name')
        process.exit(1)
    }

    const filePath = join(process.cwd(), 'supabase', 'migrations', file)
    console.log(`Running ${file}...`)
    
    try {
        const query = readFileSync(filePath, 'utf-8')
        await sql.unsafe(query)
        console.log('✅ Done!')
    } catch (err) {
        console.error('❌ Error:', err.message)
    } finally {
        await sql.end()
    }
}

run()
