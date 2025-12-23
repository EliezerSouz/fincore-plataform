import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
dotenv.config({ path: envPath })

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!dbUrl) {
    console.error('❌ DATABASE_URL ou POSTGRES_URL não encontrado em .env.local')
    process.exit(1)
}

console.log('🔌 Conectando ao banco de dados...\n')
const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
})

async function testPaymentMethodsConstraints() {
    try {
        console.log('📊 TESTE: Verificando constraints da tabela payment_methods\n')

        // 1. Verificar se a constraint UNIQUE existe
        console.log('1️⃣ Verificando constraint UNIQUE (user_id, slug)...')
        const constraints = await sql`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'payment_methods'
            AND constraint_type = 'UNIQUE'
        `

        if (constraints.length > 0) {
            console.log('✅ Constraint UNIQUE encontrada:')
            constraints.forEach(c => console.log(`   - ${c.constraint_name} (${c.constraint_type})`))
        } else {
            console.log('❌ Nenhuma constraint UNIQUE encontrada!')
        }

        console.log()

        // 2. Verificar se a função create_default_payment_methods existe
        console.log('2️⃣ Verificando função create_default_payment_methods...')
        const functions = await sql`
            SELECT routine_name, routine_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'create_default_payment_methods'
        `

        if (functions.length > 0) {
            console.log('✅ Função create_default_payment_methods encontrada')
        } else {
            console.log('❌ Função create_default_payment_methods NÃO encontrada!')
        }

        console.log()

        // 3. Verificar triggers
        console.log('3️⃣ Verificando triggers relacionados...')
        const triggers = await sql`
            SELECT trigger_name, event_manipulation, event_object_table
            FROM information_schema.triggers
            WHERE trigger_name LIKE '%payment%' OR trigger_name LIKE '%user%'
            ORDER BY event_object_table, trigger_name
        `

        if (triggers.length > 0) {
            console.log('✅ Triggers encontrados:')
            triggers.forEach(t => console.log(`   - ${t.trigger_name} (${t.event_manipulation} on ${t.event_object_table})`))
        } else {
            console.log('⚠️  Nenhum trigger relacionado encontrado')
        }

        console.log()

        // 4. Verificar policies RLS
        console.log('4️⃣ Verificando policies RLS em payment_methods...')
        const policies = await sql`
            SELECT policyname, cmd, qual
            FROM pg_policies
            WHERE tablename = 'payment_methods'
            ORDER BY policyname
        `

        if (policies.length > 0) {
            console.log('✅ Policies RLS encontradas:')
            policies.forEach(p => console.log(`   - ${p.policyname} (${p.cmd})`))
        } else {
            console.log('❌ Nenhuma policy RLS encontrada!')
        }

        console.log()

        // 5. Verificar se RLS está habilitado
        console.log('5️⃣ Verificando status do RLS...')
        const rlsStatus = await sql`
            SELECT relname, relrowsecurity
            FROM pg_class
            WHERE relname = 'payment_methods'
        `

        if (rlsStatus.length > 0 && rlsStatus[0].relrowsecurity) {
            console.log('✅ RLS está HABILITADO na tabela payment_methods')
        } else {
            console.log('⚠️  RLS está DESABILITADO na tabela payment_methods')
        }

        console.log()

        // 6. Contar payment_methods existentes
        console.log('6️⃣ Contando métodos de pagamento no banco...')
        const count = await sql`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT user_id) as users_with_methods
            FROM payment_methods
        `

        console.log(`✅ Total de métodos de pagamento: ${count[0].total}`)
        console.log(`✅ Usuários com métodos: ${count[0].users_with_methods}`)

        console.log()
        console.log('='.repeat(60))
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!')
        console.log('='.repeat(60))

    } catch (err) {
        console.error('❌ Erro durante o teste:', err)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

testPaymentMethodsConstraints()
