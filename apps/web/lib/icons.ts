import {
    Tag, ShoppingCart, Home, Car, Star, Heart, GraduationCap,
    Smartphone, Gift, Plane, Coffee, Zap, PawPrint, Wrench,
    Briefcase, Dumbbell, Wallet, TrendingUp, Utensils, Gamepad2,
    ArrowRightLeft, Scissors, Flower2, Droplets, Baby, Bus,
    Building, BookOpen, Music, Clapperboard, Monitor, DollarSign,
    PiggyBank, CreditCard, Landmark, ShieldCheck, HeartPulse
} from "lucide-react"

export const CATEGORY_ICONS: Record<string, { icon: any, label: string }> = {
    // Básicos
    'tag': { icon: Tag, label: 'Geral' },
    'shopping-cart': { icon: ShoppingCart, label: 'Compras' },
    'home': { icon: Home, label: 'Casa' },
    'car': { icon: Car, label: 'Transporte' },
    'bus': { icon: Bus, label: 'Transporte Público' },
    'star': { icon: Star, label: 'Importante' },

    // Financeiro & Serviços
    'arrow-right-left': { icon: ArrowRightLeft, label: 'Transferência' },
    'wallet': { icon: Wallet, label: 'Carteira' },
    'dollar-sign': { icon: DollarSign, label: 'Dinheiro' },
    'credit-card': { icon: CreditCard, label: 'Cartão' },
    'landmark': { icon: Landmark, label: 'Banco' },
    'piggy-bank': { icon: PiggyBank, label: 'Economia' },
    'trending-up': { icon: TrendingUp, label: 'Investimentos' },
    'zap': { icon: Zap, label: 'Contas (Luz/Água)' },
    'droplets': { icon: Droplets, label: 'Água/Saneamento' },
    'shield-check': { icon: ShieldCheck, label: 'Seguros' },

    // Vida e Saúde
    'heart': { icon: Heart, label: 'Saúde' },
    'heart-pulse': { icon: HeartPulse, label: 'Médico' },
    'dumbbell': { icon: Dumbbell, label: 'Esportes/Academia' },
    'utensils': { icon: Utensils, label: 'Alimentação' },
    'baby': { icon: Baby, label: 'Filhos/Crianças' },
    'scissors': { icon: Scissors, label: 'Beleza/Corte' },
    'flower-2': { icon: Flower2, label: 'Estética/Bem-estar' },

    // Educação e Trabalho
    'graduation-cap': { icon: GraduationCap, label: 'Educação' },
    'book-open': { icon: BookOpen, label: 'Livros/Estudos' },
    'briefcase': { icon: Briefcase, label: 'Trabalho' },
    'building': { icon: Building, label: 'Escritório' },

    // Lazer e Outros
    'plane': { icon: Plane, label: 'Viagem' },
    'coffee': { icon: Coffee, label: 'Lazer' },
    'gamepad-2': { icon: Gamepad2, label: 'Games' },
    'music': { icon: Music, label: 'Música' },
    'clapperboard': { icon: Clapperboard, label: 'Cinema/Streaming' },
    'gift': { icon: Gift, label: 'Presentes' },
    'smartphone': { icon: Smartphone, label: 'Celular' },
    'monitor': { icon: Monitor, label: 'Eletrônicos/Software' },
    'paw-print': { icon: PawPrint, label: 'Pets' },
    'wrench': { icon: Wrench, label: 'Manutenção' },
}
