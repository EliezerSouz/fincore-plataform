'use client'

import { useEffect, useState } from 'react'
import { getCategories, getSubcategories } from '@/app/(protected)/caixa/transactions/actions'
import { getAccounts } from '@/app/(protected)/caixa/accounts/actions'
import { getPaymentMethods } from '@/app/(protected)/sistema/payment-methods/actions'

// Cache global para evitar múltiplas requisições
const cache = {
    categoriesReceita: null as any[] | null,
    categoriesDespesa: null as any[] | null,
    subcategories: {} as Record<string, any[]>,
    accounts: null as any[] | null,
    paymentMethods: null as any[] | null,
    promises: {
        categoriesReceita: null as Promise<any[]> | null,
        categoriesDespesa: null as Promise<any[]> | null,
        accounts: null as Promise<any[]> | null,
        paymentMethods: null as Promise<any[]> | null,
    }
}

interface UseFormDataOptions {
    transactionType?: 'receita' | 'despesa' | 'transferencia' | 'compra'
    initialData?: {
        categories?: { receita: any[], despesa: any[] }
        paymentMethods?: any[]
        accounts?: any[]
    }
}

export function useFormData(options: UseFormDataOptions = {}) {
    const { transactionType = 'despesa' } = options

    const [categories, setCategories] = useState<any[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [loading, setLoading] = useState(true)

    // Determinar qual tipo de categoria carregar
    const categoryType = transactionType === 'receita' ? 'receita' : 'despesa'
    const cacheKey = categoryType === 'receita' ? 'categoriesReceita' : 'categoriesDespesa'

    // Carregar categorias (com cache e filtro por tipo)
    useEffect(() => {
        async function loadCategories() {
            // Transferências não têm categorias
            if (transactionType === 'transferencia') {
                setCategories([])
                return
            }

            if (cache[cacheKey]) {
                setCategories(cache[cacheKey]!)
                return
            }

            // Hydrate from Initial Data
            if (options.initialData?.categories) {
                const initCats = categoryType === 'receita' ? options.initialData.categories.receita : options.initialData.categories.despesa
                if (initCats && initCats.length > 0) {
                    setCategories(initCats)
                    cache[cacheKey] = initCats
                    return
                }
            }

            if (cache.promises[cacheKey]) {
                const data = await cache.promises[cacheKey]
                setCategories(data!)
                return
            }

            cache.promises[cacheKey] = getCategories(categoryType, true)
            const data = await cache.promises[cacheKey]
            cache[cacheKey] = data!
            cache.promises[cacheKey] = null
            setCategories(data!)
        }

        loadCategories()
    }, [transactionType, categoryType, cacheKey, options.initialData?.categories])

    // Carregar contas (com cache)
    useEffect(() => {
        async function loadAccounts() {
            if (cache.accounts) {
                setAccounts(cache.accounts)
                return
            }

            // Hydrate from Initial Data
            if (options.initialData?.accounts && options.initialData.accounts.length > 0) {
                setAccounts(options.initialData.accounts)
                cache.accounts = options.initialData.accounts
                return
            }

            if (cache.promises.accounts) {
                const data = await cache.promises.accounts
                setAccounts(data)
                return
            }

            cache.promises.accounts = getAccounts()
            const data = await cache.promises.accounts
            cache.accounts = data
            cache.promises.accounts = null
            setAccounts(data)
        }

        loadAccounts()
    }, [options.initialData?.accounts])

    // Carregar formas de pagamento (com cache)
    useEffect(() => {
        async function loadPaymentMethods() {
            if (cache.paymentMethods) {
                setPaymentMethods(cache.paymentMethods)
                setLoading(false)
                return
            }

            // Hydrate from Initial Data
            if (options.initialData?.paymentMethods && options.initialData.paymentMethods.length > 0) {
                setPaymentMethods(options.initialData.paymentMethods)
                cache.paymentMethods = options.initialData.paymentMethods
                setLoading(false)
                return
            }

            if (cache.promises.paymentMethods) {
                const data = await cache.promises.paymentMethods
                setPaymentMethods(data)
                setLoading(false)
                return
            }

            cache.promises.paymentMethods = getPaymentMethods()
            const data = await cache.promises.paymentMethods
            cache.paymentMethods = data
            cache.promises.paymentMethods = null
            setPaymentMethods(data)
            setLoading(false)
        }

        loadPaymentMethods()
    }, [options.initialData?.paymentMethods])

    // Carregar subcategorias quando categoria muda (com cache por categoria)
    useEffect(() => {
        async function loadSubcategories() {
            if (!selectedCategory) {
                setSubcategories([])
                return
            }

            if (cache.subcategories[selectedCategory]) {
                setSubcategories(cache.subcategories[selectedCategory])
                return
            }

            const data = await getSubcategories(selectedCategory, true)
            cache.subcategories[selectedCategory] = data
            setSubcategories(data)
        }

        loadSubcategories()
    }, [selectedCategory])

    return {
        categories,
        subcategories,
        accounts,
        paymentMethods,
        selectedCategory,
        setSelectedCategory,
        loading
    }
}

// Função para limpar cache (útil após criar/editar/deletar)
export function clearFormDataCache() {
    cache.categoriesReceita = null
    cache.categoriesDespesa = null
    cache.subcategories = {}
    cache.accounts = null
    cache.paymentMethods = null
    cache.promises.categoriesReceita = null
    cache.promises.categoriesDespesa = null
    cache.promises.accounts = null
    cache.promises.paymentMethods = null
}
