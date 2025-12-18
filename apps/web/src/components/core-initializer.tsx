'use client'

import { useEffect } from 'react'
import { apiClient } from '@financeiro/core'
import { createClient } from '@/utils/supabase/client'

export function CoreInitializer() {
    useEffect(() => {
        apiClient.setTokenProvider(async () => {
            const supabase = createClient()
            const { data } = await supabase.auth.getSession()
            return data.session?.access_token || null
        })
    }, [])

    return null
}
