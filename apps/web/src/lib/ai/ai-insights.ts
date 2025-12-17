/**
 * Server Actions para Insights com IA (Groq)
 * Estas funções rodam no servidor para proteger a API key
 */

'use server'

import Groq from "groq-sdk"
import type { AIInsight } from "./insights-rules"

// Debug: verifica se a chave está configurada
const apiKey = process.env.GROQ_API_KEY
console.log('🔑 GROQ_API_KEY configurada?', apiKey ? `Sim (${apiKey.substring(0, 10)}...)` : 'Não')

const groq = new Groq({
    apiKey: apiKey
})

/**
 * Gera insight personalizado para uma conta específica
 */
export async function generateAccountInsight(
    accountName: string,
    balance: number,
    accountType: string
): Promise<AIInsight | null> {
    // Se não tiver token, retorna null (fallback para regras)
    if (!process.env.GROQ_API_KEY) {
        console.log('❌ GROQ_API_KEY não configurada')
        return null
    }

    console.log('🤖 Tentando gerar insight com IA para:', accountName)

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Você é um consultor financeiro brasileiro. Responda APENAS com a dica, sem introduções ou explicações extras. Máximo 15 palavras."
                },
                {
                    role: "user",
                    content: `Analise esta conta e dê UMA dica curta:
Conta: ${accountName}
Tipo: ${accountType}
Saldo: R$ ${balance.toFixed(2)}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 50
        })

        const text = completion.choices[0]?.message?.content?.trim() || ''
        console.log('✅ IA respondeu:', text)

        // Determina o tipo baseado no saldo
        let type: AIInsight['type'] = 'tip'
        if (balance < 0) type = 'warning'
        else if (balance > 10000) type = 'success'

        return { text, type }
    } catch (error: any) {
        console.error('❌ Groq API error:', error.message || error)
        return null
    }
}

/**
 * Gera insight para o saldo consolidado
 */
export async function generateConsolidatedInsight(
    totalBalance: number,
    accountCount: number
): Promise<AIInsight | null> {
    if (!process.env.GROQ_API_KEY) {
        console.log('❌ GROQ_API_KEY não configurada (consolidado)')
        return null
    }

    console.log('🤖 Tentando gerar insight consolidado com IA')

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Você é um consultor financeiro brasileiro. Responda APENAS com o conselho, sem introduções. Máximo 20 palavras."
                },
                {
                    role: "user",
                    content: `Analise e dê UMA dica sobre esta situação financeira:
Saldo total: R$ ${totalBalance.toFixed(2)}
Contas ativas: ${accountCount}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 60
        })

        const text = completion.choices[0]?.message?.content?.trim() || ''
        console.log('✅ IA respondeu (consolidado):', text)

        let type: AIInsight['type'] = 'tip'
        if (totalBalance < 0) type = 'warning'
        else if (totalBalance > 50000) type = 'success'

        return { text, type }
    } catch (error: any) {
        console.error('❌ Groq API error (consolidado):', error.message || error)
        return null
    }
}

/**
 * Gera insight personalizado para um cartão de crédito
 */
export async function generateCreditCardInsight(
    cardName: string,
    limitAmount: number,
    availableLimit: number,
    usedPercentage: number
): Promise<AIInsight | null> {
    if (!process.env.GROQ_API_KEY) {
        console.log('❌ GROQ_API_KEY não configurada (cartão)')
        return null
    }

    console.log('🤖 Tentando gerar insight com IA para cartão:', cardName)

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Você é um consultor financeiro brasileiro especializado em crédito. Responda APENAS com a dica, sem introduções. Máximo 15 palavras."
                },
                {
                    role: "user",
                    content: `Analise este cartão de crédito e dê UMA dica curta:
Cartão: ${cardName}
Limite total: R$ ${limitAmount.toFixed(2)}
Limite disponível: R$ ${availableLimit.toFixed(2)}
Uso: ${usedPercentage.toFixed(0)}%`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 50
        })

        const text = completion.choices[0]?.message?.content?.trim() || ''
        console.log('✅ IA respondeu (cartão):', text)

        // Determina o tipo baseado no uso
        let type: AIInsight['type'] = 'tip'
        if (usedPercentage >= 80) type = 'warning'
        else if (usedPercentage < 30) type = 'success'

        return { text, type }
    } catch (error: any) {
        console.error('❌ Groq API error (cartão):', error.message || error)
        return null
    }
}
