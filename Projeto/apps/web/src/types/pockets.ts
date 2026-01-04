// Enum para tipos de Pocket
export type PocketType = 'CAIXA' | 'RESERVA_CDI' | 'INVESTIMENTO'

// Enum para tipos de Instituição
export type InstitutionType = 'digital_bank' | 'traditional_bank' | 'fintech' | 'broker'

// Interface para Pocket (Subconta)
export interface Pocket {
    id: string
    parent_account_id: string
    user_id: string
    name: string
    pocket_type: PocketType
    description?: string
    balance: number

    // Yield (Rendimento)
    yield_enabled: boolean
    yield_source?: string
    yield_cdi_rate?: number
    last_yield_date?: string
    yield_today?: number
    yield_month?: number

    // Investimento
    investment_type?: string

    // Visual
    color?: string
    icon?: string

    // Metadata
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

// Interface para Parent Account (Instituição)
export interface ParentAccount {
    id: string
    user_id: string
    institution_name: string
    institution_type: InstitutionType
    color?: string
    logo_url?: string
    is_active: boolean
    created_at: string
    updated_at: string

    // Campos virtuais
    total_balance: number
    caixa_balance: number
    reserva_balance: number
    investimento_balance: number

    // Pockets incluídos
    pockets?: Pocket[]
}

// Inputs para criação/edição
export interface CreateParentAccountInput {
    institution_name: string
    institution_type?: InstitutionType
    color?: string
    logo_url?: string
    initial_balance?: number
}

export interface CreatePocketInput {
    parent_account_id: string
    name: string
    pocket_type: PocketType
    description?: string
    yield_enabled?: boolean
    yield_source?: string
    yield_cdi_rate?: number
    investment_type?: string
    color?: string
    icon?: string
}
