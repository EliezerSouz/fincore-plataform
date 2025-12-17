"use client"

import { useState, useEffect } from "react"
import { getPrimaryCard, setPrimaryCard } from "@/app/(protected)/compromissos/cards/primary-card-actions"

export function usePrimaryCard() {
    const [primaryCardId, setPrimaryCardId] = useState<string | null>(null)
    const [isLocked, setIsLocked] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Carregar do banco de dados
    useEffect(() => {
        async function loadFromDatabase() {
            try {
                const data = await getPrimaryCard()
                if (data) {
                    setPrimaryCardId(data.primaryCardId)
                    setIsLocked(data.isLocked)
                }
            } catch (error) {
                console.error("Error loading primary card:", error)
            } finally {
                setIsLoaded(true)
            }
        }

        loadFromDatabase()
    }, [])

    const setPrimary = async (id: string, lockAfterSet: boolean = false) => {
        // Se já está locked, não permite trocar
        if (isLocked) {
            console.warn('Primary card is locked and cannot be changed')
            return false
        }

        try {
            const result = await setPrimaryCard(id, lockAfterSet)
            setPrimaryCardId(result.primaryCardId)
            setIsLocked(result.isLocked)
            return true
        } catch (error: any) {
            console.error("Error setting primary card:", error)
            alert(error.message || "Erro ao definir cartão principal")
            return false
        }
    }

    return {
        primaryCardId,
        setPrimary,
        isLocked,
        isLoaded
    }
}
