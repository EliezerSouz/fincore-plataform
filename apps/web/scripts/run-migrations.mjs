import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nAdd these to your .env.local file:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
    console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    process.exit(1)
}

async function runMigrations() {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

    console.log('📂 Reading migrations from:', migrationsDir)

    const files = readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort()

    console.log(`\n📋 Found ${files.length} migration files\n`)

    for (const file of files) {
        console.log(`⏳ Running: ${file}`)

        const filePath = join(migrationsDir, file)
        const sql = readFileSync(filePath, 'utf-8')

        try {
            // Execute SQL using Supabase REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({ query: sql })
            })

            if (!response.ok) {
                const error = await response.text()
                console.error(`❌ Error in ${file}:`, error)
                console.log('💡 Tip: Execute this migration manually in Supabase SQL Editor\n')
                continue
            }

            console.log(`✅ Success: ${file}\n`)
        } catch (err) {
            console.error(`❌ Failed: ${file}`, err.message)
            console.log('💡 Tip: Execute this migration manually in Supabase SQL Editor\n')
        }
    }

    console.log('\n✨ Migration process completed!')
    console.log('\n⚠️  Note: This script may not work with all Supabase projects.')
    console.log('If you see errors, please run the migrations manually in the Supabase Dashboard.')
    console.log('See: docs/RUNNING_MIGRATIONS.md for instructions.\n')
}

runMigrations().catch(console.error)
