"use client"

import * as React from "react"
import { Activity, Heart, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Mapeamento dos estados do backend para o modelo mental do HeartbeatCore
// EXCELLENT: 800-1000 (Coração Forte) - 60-70 bpm
// STABLE: 600-799 (Ritmo Estável) - 70-80 bpm
// ATTENTION: 400-599 (Atenção) - 90-110 bpm
// ARRHYTHMIA: 200-399 (Arritmia Financeira) - 40-50 bpm (irregular)
// CRITICAL: 0-199 (Estado Crítico) - 30-40 bpm (quase parando)

type HeartbeatStatus = 'EXCELLENT' | 'STABLE' | 'ATTENTION' | 'ARRHYTHMIA' | 'CRITICAL';

export interface HeartbeatState {
    totalBalance: number        // saldo total real (não fluxo mensal)
    commitments: number         // compromissos totais (ex: faturas, contas)
    available: number           // saldo após compromissos
    status: string              // Status original do backend ('Coração Forte', 'Ritmo Estável', 'Atenção', 'Arritmia Financeira', 'Estado Crítico')
    score: number               // FinCore Score (0-1000)
    runwayMonths: number        // runway real
    overdueCount?: number       // Opcional: contagem de itens vencidos para contexto
}

interface HeartbeatCoreProps {
    state: HeartbeatState
    insight: {
        title: string
        subtitle: string
    }
    isLoading: boolean
    className?: string
}

// Helper para converter status do backend para status visual/lógico
const mapStatusToHeartbeat = (status: string, score: number): HeartbeatStatus => {
    // Priorizar Score sobre status textual
    if (score >= 800) return 'EXCELLENT';  // 800-1000: Coração Forte
    if (score >= 600) return 'STABLE';     // 600-799: Ritmo Estável
    if (score >= 400) return 'ATTENTION';  // 400-599: Atenção
    if (score >= 200) return 'ARRHYTHMIA'; // 200-399: Arritmia Financeira
    return 'CRITICAL';                     // 0-199: Estado Crítico
}

// Configurações visuais por estado - PADRÃO FINCORE OFICIAL
const STATUS_CONFIG = {
    EXCELLENT: {
        color: 'text-emerald-600',
        ecgColor: 'text-emerald-500', // Verde vibrante para ECG
        heartColor: 'text-emerald-600',
        bg: 'bg-emerald-600',
        border: 'border-emerald-500/20',
        shadow: 'shadow-[0_0_40px_-10px_rgba(5,150,105,0.2)]',
        gradient: 'from-emerald-500/20 via-transparent to-transparent',
        animation: 'animate-heartbeat-excellent', // 60-70 bpm (coração forte)
        ecgAnimation: 'animate-ecg-pulse-excellent', // ECG sincronizado
        heartbeatDuration: '1.8s', // Duração do batimento (1.8s = 67 bpm)
        ecgDuration: '3.6s',
        heartOpacity: '0.08' // 8% opacidade
    },
    STABLE: {
        color: 'text-wealth',
        ecgColor: 'text-blue-500', // Azul para ECG
        heartColor: 'text-wealth',
        bg: 'bg-wealth',
        border: 'border-wealth/20',
        shadow: 'shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]',
        gradient: 'from-blue-500/20 via-transparent to-transparent',
        animation: 'animate-heartbeat-normal', // 70-80 bpm (ritmo estável)
        ecgAnimation: 'animate-ecg-pulse-normal', // ECG sincronizado com batimento
        heartbeatDuration: '2s', // Duração do batimento (2s = 75 bpm)
        ecgDuration: '4s',
        heartOpacity: '0.08' // 8% opacidade
    },
    ATTENTION: {
        color: 'text-risk',
        ecgColor: 'text-risk', // Laranja para ECG (mesma cor do coração)
        heartColor: 'text-risk',
        bg: 'bg-risk',
        border: 'border-risk/20',
        shadow: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.15)]',
        gradient: 'from-risk/20 via-transparent to-transparent',
        animation: 'animate-heartbeat-tachycardia', // 90-110 bpm (alerta/estresse)
        ecgAnimation: 'animate-ecg-pulse-tachycardia', // ECG sincronizado com batimento
        heartbeatDuration: '1.3s', // Duração do batimento (1.3s = 92 bpm)
        ecgDuration: '3s',
        heartOpacity: '0.10' // 10% opacidade
    },
    ARRHYTHMIA: {
        color: 'text-orange-500',
        ecgColor: 'text-orange-500', // Laranja escuro para arritmia
        heartColor: 'text-orange-500',
        bg: 'bg-orange-500',
        border: 'border-orange-500/20',
        shadow: 'shadow-[0_0_40px_-10px_rgba(249,115,22,0.15)]',
        gradient: 'from-orange-500/20 via-transparent to-transparent',
        animation: 'animate-heartbeat-bradycardia', // 40-50 bpm (irregular)
        ecgAnimation: 'animate-ecg-pulse-bradycardia', // ECG sincronizado com batimento
        heartbeatDuration: '3s', // Duração do batimento (3s = 40 bpm)
        ecgDuration: '6s',
        heartOpacity: '0.12' // 12% opacidade
    },
    CRITICAL: {
        color: 'text-danger',
        ecgColor: 'text-red-500', // Vermelho para pico crítico
        heartColor: 'text-danger',
        bg: 'bg-danger',
        border: 'border-danger/30',
        shadow: 'shadow-[0_0_50px_-10px_rgba(239,68,68,0.25)]',
        gradient: 'from-danger/30 via-danger/5 to-transparent',
        animation: 'animate-heartbeat-critical', // 30-40 bpm (crítico - quase parando)
        ecgAnimation: 'animate-ecg-pulse-critical', // ECG sincronizado com batimento
        heartbeatDuration: '4s', // Duração do batimento (4s = 30 bpm)
        ecgDuration: '8s', // ECG MUITO lento
        heartOpacity: '0.12' // 12% opacidade
    }
}

// Componente de ECG Animado (Background) - Estilo Hospital
const EcgBackground = ({ visualStatus }: { visualStatus: HeartbeatStatus }) => {
    const config = STATUS_CONFIG[visualStatus];

    // Estado para controlar a altura do pulso atual
    const [pulseHeight, setPulseHeight] = React.useState(100);

    // A cada batimento, muda a altura do pulso
    React.useEffect(() => {
        const heartbeatDurationMs = parseFloat(config.heartbeatDuration) * 1000;

        const interval = setInterval(() => {
            // Sorteia nova altura entre 10px (quase não bate) e 200px (pico muito alto)
            const newHeight = Math.floor(Math.random() * (200 - 10 + 1)) + 10;
            setPulseHeight(newHeight);
        }, heartbeatDurationMs);

        return () => clearInterval(interval);
    }, [config.heartbeatDuration]);

    // Caminho SVG: Linha reta → Pulso → Linha reta
    // 0-40: linha reta | 40-60: pulso | 60-100: linha reta
    const ecgPath = `M0,50 L40,50 L42,48 L44,30 L46,70 L48,52 L50,50 L100,50`;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.35] overflow-hidden flex items-center">
            {/* Grid de fundo estilo monitor hospitalar */}
            <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full" style={{
                    backgroundImage: `
                        linear-gradient(${config.color.replace('text-', 'rgb(var(--color-')}20 1px, transparent 1px),
                        linear-gradient(90deg, ${config.color.replace('text-', 'rgb(var(--color-')}20 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                }} />
            </div>

            {/* LINHA HORIZONTAL COM PULSO - Sincronizado com batimento do coração */}
            <div className="absolute inset-0 flex items-center" style={{ top: '-5%' }}>
                <div className={cn("flex w-[100%] absolute", config.ecgAnimation)}>
                    <svg
                        viewBox="0 0 100 100"
                        className={cn("w-full", config.ecgColor)}
                        preserveAspectRatio="none"
                        style={{
                            height: `${pulseHeight}px`,
                            transition: 'height 0.3s ease-out'
                        }}
                    >
                        <path d={ecgPath} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={ecgPath} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" filter="blur(2px)" />
                    </svg>
                </div>
            </div>

            {/* Fade nas bordas para suavizar */}
            <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-card" />
        </div>
    )
}

export function HeartbeatCore({
    state,
    insight,
    isLoading,
    className
}: HeartbeatCoreProps) {
    const visualStatus = mapStatusToHeartbeat(state.status, state.score);
    const config = STATUS_CONFIG[visualStatus];
    const [soundEnabled, setSoundEnabled] = React.useState(false);

    // Função para tocar som (precisa de interação do usuário)
    const playHeartbeatSound = React.useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Frequência baseada no status
            oscillator.frequency.value = visualStatus === 'STABLE' ? 80 :
                visualStatus === 'ATTENTION' ? 100 : 60;
            oscillator.type = 'sine';

            // Volume baixo para não incomodar
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);

            setSoundEnabled(true);
        } catch (e) {
            console.error('Erro ao tocar som:', e);
        }
    }, [visualStatus]);

    // Hook para sons e vibração
    React.useEffect(() => {
        // Tocar som de batimento cardíaco
        const playHeartbeatSound = () => {
            try {
                // Criar som sintético de batimento
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Frequência baseada no status
                oscillator.frequency.value = visualStatus === 'STABLE' ? 80 :
                    visualStatus === 'ATTENTION' ? 100 : 60;
                oscillator.type = 'sine';

                // Volume baixo para não incomodar
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                // Silenciosamente falhar se áudio não for suportado
            }
        };

        // Vibração no mobile
        const vibratePattern = () => {
            if (navigator.vibrate) {
                if (visualStatus === 'CRITICAL') {
                    // Padrão irregular: vibra, pausa longa, vibra, pausa longa
                    navigator.vibrate([100, 2000, 100, 2000]);
                } else if (visualStatus === 'ATTENTION') {
                    // Padrão rápido
                    navigator.vibrate([50, 400, 50, 400]);
                } else {
                    // Padrão normal
                    navigator.vibrate([80, 1000, 80, 1000]);
                }
            }
        };

        // Executar som e vibração apenas uma vez ao montar
        const timer = setTimeout(() => {
            playHeartbeatSound();
            vibratePattern();
        }, 500);

        return () => clearTimeout(timer);
    }, [visualStatus]);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[300px] border border-l-4 transition-all duration-300 hover:shadow-lg",
            "bg-card",
            // Borda e gradiente conforme saldo total (padrão FINCORE - igual aos outros cards)
            state.totalBalance > 0
                ? "border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"
                : state.totalBalance < 0
                    ? "border-l-red-500 bg-gradient-to-br from-red-500/5 via-transparent to-transparent"
                    : "border-l-border",
            className
        )}>
            {/* 0. ECG Background (Monitor Hospitalar) */}
            <EcgBackground visualStatus={visualStatus} />

            {/* Top Row: Status + Metrics */}
            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="grid grid-cols-3 items-center w-full">
                    {/* Left: Status Badge */}
                    <div className="justify-self-start">
                        <div className={cn("px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors duration-300 backdrop-blur-md shadow-sm",
                            visualStatus === 'EXCELLENT' ? "bg-emerald-600/10 text-foreground border-emerald-500/20" :
                                visualStatus === 'STABLE' ? "bg-blue-500/10 text-foreground border-blue-500/20" :
                                    visualStatus === 'ATTENTION' ? "bg-risk/10 text-foreground border-risk/20" :
                                        visualStatus === 'ARRHYTHMIA' ? "bg-orange-500/10 text-foreground border-orange-500/20" :
                                            "bg-danger/20 text-foreground border-danger/40"
                        )}>
                            <Activity className={cn("w-3.5 h-3.5",
                                visualStatus === 'EXCELLENT' ? "text-emerald-600" :
                                    visualStatus === 'STABLE' ? "text-blue-500" :
                                        visualStatus === 'ATTENTION' ? "text-risk" :
                                            visualStatus === 'ARRHYTHMIA' ? "text-orange-500" :
                                                "text-danger"
                            )} />
                            {isLoading ? "..." : state.status}
                        </div>
                    </div>

                    {/* Center: Status Indicator (sem coração) */}
                    <div className="justify-self-center flex items-center justify-center">
                        {/* <Activity className={cn("w-8 h-8", config.color)} /> */}
                    </div>

                    {/* Right: Score + Runway */}
                    <div className="justify-self-end flex items-center gap-2">
                        {/* Score Chip */}
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-black/30 transition-colors backdrop-blur-sm">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Score</span>
                                    <span className={cn("font-mono font-bold text-sm leading-none",
                                        state.score >= 700 ? "text-emerald-500" :
                                            state.score >= 400 ? "text-amber-500" :
                                                "text-red-500"
                                    )}>{isLoading ? "..." : state.score}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[380px] bg-background/95 backdrop-blur-sm border-border">
                                <p className="text-sm font-semibold text-foreground mb-2">
                                    Avalia a vitalidade do seu pulso financeiro baseado em múltiplos fatores:
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mb-3">
                                    <li><span className="text-emerald-500 font-semibold">800-1000:</span> 🟢 Coração Forte</li>
                                    <li><span className="text-blue-500 font-semibold">600-799:</span> 🔵 Ritmo Estável</li>
                                    <li><span className="text-amber-500 font-semibold">400-599:</span> 🟠 Atenção</li>
                                    <li><span className="text-orange-500 font-semibold">200-399:</span> 🔴 Arritmia Financeira</li>
                                    <li><span className="text-red-500 font-semibold">0-199:</span> 🚨 Estado Crítico</li>
                                </ul>
                                <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-2">
                                    <p className="font-semibold text-foreground">Cálculo do Score (4 Pilares):</p>
                                    <div className="space-y-1 font-mono text-[10px] bg-muted/30 p-2 rounded">
                                        <p>• Liquidez (35%): PULSO ÷ Gastos Médios</p>
                                        <p>• Runway (30%): Meses de sobrevivência</p>
                                        <p>• Comportamento (20%): Receitas vs Despesas</p>
                                        <p>• Organização (15%): Categorias e contas</p>
                                    </div>
                                    <p className="text-[10px] italic">Score Final = Soma ponderada × 10</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>

                        {/* Runway Chip */}
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-black/30 transition-colors backdrop-blur-sm">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Runway</span>
                                    <div className="flex items-baseline gap-1 leading-none">
                                        <span className={cn("font-mono font-bold text-sm",
                                            state.runwayMonths >= 6 ? "text-emerald-500" :
                                                state.runwayMonths >= 3 ? "text-amber-500" :
                                                    "text-red-500"
                                        )}>
                                            {isLoading ? "..." : (typeof state.runwayMonths === 'number' ? state.runwayMonths.toFixed(1) : state.runwayMonths)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">meses</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[380px] bg-background/95 backdrop-blur-sm border-border">
                                <p className="text-sm font-semibold text-foreground mb-2">
                                    Indica por quantos meses você consegue manter seu padrão de vida atual:
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mb-3">
                                    <li><span className="text-emerald-500 font-semibold">≥6 meses:</span> Reserva saudável - Batimento estável</li>
                                    <li><span className="text-amber-500 font-semibold">3-5 meses:</span> Atenção - Taquicardia por estresse</li>
                                    <li><span className="text-red-500 font-semibold">&lt;3 meses:</span> Crítico - Coração quase parando</li>
                                </ul>
                                <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-2">
                                    <p className="font-semibold text-foreground">Cálculo do Runway:</p>
                                    <div className="font-mono text-[10px] bg-muted/30 p-2 rounded space-y-1">
                                        <p>Runway = PULSO ÷ Média de Gastos</p>
                                        <p className="text-[9px] opacity-70">PULSO = Liquidez - Compromissos</p>
                                        <p className="text-[9px] opacity-70">Média = Últimos 6 meses</p>
                                    </div>
                                    <p className="text-[10px] italic">⚠️ Investimentos NÃO entram no cálculo</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* MAIN HERO METRIC: PULSO */}
                <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="flex flex-col items-center gap-1 mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            Pulso Financeiro
                        </h3>
                        <p className="text-muted-foreground/60 text-xs font-medium">
                            Saldo total disponível após compromissos
                        </p>
                    </div>

                    <div className="relative">
                        {/* Coração Gigante ATRÁS do Saldo - Pulsação Sutil */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-50%', bottom: '-50%' }}>
                            <Heart className={cn(
                                "w-[440px] h-[440px] fill-current transform-gpu origin-center",
                                config.heartColor,
                                config.animation
                            )} style={{ opacity: config.heartOpacity }} />
                        </div>

                        {/* Decorative dash above amount */}
                        <div className="w-8 h-1 rounded-full mx-auto mb-4 relative z-10 bg-muted"></div>

                        <span className={cn("font-mono font-bold tracking-tighter leading-none transition-all duration-500 relative z-10",
                            state.totalBalance < 0 ? "!text-danger" : "!text-wealth",
                            // Responsive Typography
                            "text-4xl md:text-6xl lg:text-7xl"
                        )}>
                            {isLoading ? "..." : formatCurrency(state.totalBalance)}
                        </span>
                    </div>

                    <div className="mt-8 max-w-lg text-center mx-auto">
                        <h4 className="text-foreground/90 text-sm md:text-base font-bold mb-1 leading-tight">
                            {insight.title}
                        </h4>
                        <p className="text-muted-foreground text-xs md:text-sm font-medium leading-relaxed opacity-80">
                            {insight.subtitle}
                        </p>
                    </div>
                </div>

                {/* CONTEXT METRICS (Bottom Row) */}
                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-5 mt-2 bg-black/20 -mx-6 -mb-6 p-6 backdrop-blur-md">
                    {/* Metric 1: Vencidos */}
                    <div className="flex flex-col items-center justify-center gap-1 border-r border-white/5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                            Vencidos
                        </span>
                        <div className="flex items-center gap-2">
                            {(state.overdueCount ?? 0) > 0 ? (
                                <>
                                    <AlertCircle className="w-4 h-4 text-danger" />
                                    <span className="font-mono font-bold text-lg leading-none text-danger">
                                        {state.overdueCount}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-wealth/50" />
                                    <span className="font-mono font-bold text-lg leading-none text-muted-foreground">
                                        0
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metric 2: Faturas / Commitments Detail */}
                    <div className="flex flex-col items-center justify-center gap-1 border-r border-white/5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Compromissos</span>
                        <span className="font-mono font-bold text-lg leading-none text-foreground">
                            {formatCurrency(state.commitments)}
                        </span>
                    </div>

                    {/* Metric 3: Fôlego Financeiro (Margem após vencidos) */}
                    <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Fôlego Financeiro</span>
                        <span className={cn("font-mono font-bold text-lg leading-none",
                            state.available < 0 ? "text-danger" :
                                state.available > 0 ? "text-wealth" : "text-foreground"
                        )}>
                            {formatCurrency(state.available)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
