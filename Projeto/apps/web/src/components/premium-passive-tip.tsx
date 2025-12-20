"use client"

import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PremiumPassiveTip() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Regra de Periodicidade: Mostrar 1 vez a cada 15 dias
        const LAST_SEEN_KEY = 'financeiro_premium_tip_last_seen'
        const INTERVAL_MS = 1000 * 60 * 60 * 24 * 15 // 15 dias

        const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
        const now = Date.now()

        // Se nunca viu OU se viu há mais de 15 dias
        if (!lastSeen || (now - parseInt(lastSeen) > INTERVAL_MS)) {
            // Pequeno delay para não competir com o carregamento inicial da dashboard
            const timeOut = setTimeout(() => {
                setVisible(true)
            }, 5000) // 5 segundos após carregar a página

            return () => clearTimeout(timeOut)
        }
    }, [])

    const handleClose = () => {
        setVisible(false)
        localStorage.setItem('financeiro_premium_tip_last_seen', Date.now().toString())
    }

    if (!visible) return null

    return (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-1 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="rounded-lg bg-slate-950/50 p-3 sm:px-4 sm:py-3 flex items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
                <div className="flex gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shrink-0 shadow-lg shadow-orange-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-white">Dica do seu Assistente Financeiro</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed hidden sm:block">
                            Você está indo bem com o plano Free! Sabia que o Premium pode conectar seus bancos automaticamente e economizar horas de digitação?
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed sm:hidden">
                            O Premium conecta seus bancos automaticamente e economiza horas.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        className="h-11 text-xs bg-transparent border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 hidden sm:flex"
                        onClick={() => window.open('/premium', '_blank')}
                    >
                        Saber mais
                    </Button>
                    <button
                        onClick={handleClose}
                        className="h-11 w-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors rounded-md hover:bg-white/5"
                    >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
