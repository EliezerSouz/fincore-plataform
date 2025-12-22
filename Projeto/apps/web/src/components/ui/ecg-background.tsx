"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Configuração simplificada para o Background (focado em visual)
// Usando 'STABLE' como base (Azul/Wealth) que combina com a tela de login
const DEFAULT_CONFIG = {
    color: 'text-rose-600', // Vermelho/Rose
    ecgColor: 'text-rose-500', // Vermelho para ECG
    bg: 'bg-rose-600',
    ecgAnimation: 'animate-ecg-pulse-normal', // 6s loop
    heartbeatDuration: '2s' // 75 bpm
}

interface EcgBackgroundProps {
    className?: string
    opacity?: number
}

export function EcgBackground({ className, opacity = 0.2 }: EcgBackgroundProps) {
    // Estado para controlar a altura do pulso atual
    const [pulseHeight, setPulseHeight] = React.useState(100);

    // A cada batimento, muda a altura do pulso para dar "vida"
    React.useEffect(() => {
        const heartbeatDurationMs = parseFloat(DEFAULT_CONFIG.heartbeatDuration) * 1000;

        const interval = setInterval(() => {
            // Sorteia nova altura entre 10px (quase não bate) e 200px (pico muito alto)
            // Mas para login, vamos manter mais sutil: 50px a 150px
            const newHeight = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
            setPulseHeight(newHeight);
        }, heartbeatDurationMs);

        return () => clearInterval(interval);
    }, []);

    // Caminho SVG: Linha reta → Pulso → Linha reta
    // 0-40: linha reta | 40-60: pulso | 60-100: linha reta
    const ecgPath = `M0,50 L40,50 L42,48 L44,30 L46,70 L48,52 L50,50 L100,50`;

    return (
        <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none", className)}>
             {/* Grid de fundo estilo monitor hospitalar - Opcional, removido para login ficar mais limpo */}
            
            {/* LINHA HORIZONTAL COM PULSO */}
            <div className="absolute inset-0 flex items-center" style={{ opacity, transform: 'translateY(10px)' }}>
                <div className={cn("flex w-[100%] absolute", DEFAULT_CONFIG.ecgAnimation)}>
                    <svg
                        viewBox="0 0 100 100"
                        className={cn("w-full", DEFAULT_CONFIG.ecgColor)}
                        preserveAspectRatio="none"
                        style={{
                            height: `${pulseHeight}px`,
                            transition: 'height 0.3s ease-out'
                        }}
                    >
                        {/* Linha principal */}
                        <path d={ecgPath} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Efeito Glow/Blur */}
                        <path d={ecgPath} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" filter="blur(2px)" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
