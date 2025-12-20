import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Buscar contas para calcular liquidez
        const { data: accounts, error } = await supabase
            .from('accounts')
            .select('balance, type')
            .eq('user_id', user.id)

        if (error) throw error

        // Calcular Totais
        let liquidez = 0
        let patrimonio = 0

        accounts?.forEach(acc => {
            if (acc.type === 'investimento') {
                patrimonio += Number(acc.balance)
            } else {
                // Corrente, Poupança, Dinheiro, Digital -> Entram na Liquidez imediata
                liquidez += Number(acc.balance)
            }
        })

        // Patrimônio Total = Liquidez + Investimentos
        // (A sidebar separa visualmente, mas conceitualmente patrimonio é tudo. 
        //  Pelo design atual da sidebar, parece separar "Caixa" de "Patrimônio/Investimentos")

        return NextResponse.json({
            liquidez,
            patrimonio,
            compromissos: 0 // Implementar depois com tabela de payables
        })

    } catch (error) {
        console.error('Erro ao calcular sumário:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
