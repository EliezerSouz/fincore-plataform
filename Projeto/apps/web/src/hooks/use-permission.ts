"use client"

import { useUser } from "@/providers/user-provider"

export function usePermission() {
  const { user } = useUser()
  
  const isPremium = user?.plan === 'premium' || user?.plan === 'premium_ia' || user?.plan === 'enterprise'
  const isPremiumIA = user?.plan === 'premium_ia' || user?.plan === 'enterprise'
  const isFree = !isPremium

  const can = (permission: string) => {
    switch (permission) {
      case 'edit_categories':
      case 'manage_categories':
        // Premium users can edit categories
        return isPremium
      case 'access_premium_categories':
        // Premium users can access premium categories (Health, Education, Shopping)
        return isPremium
      case 'unlimited_categories':
        // Premium users can have unlimited categories/archive
        return isPremium
      case 'unlimited_cards':
        // Premium users can have unlimited credit cards
        return isPremium
      case 'edit_card':
        // Premium users can edit card details (limit, dates)
        return isPremium
      case 'unlimited_accounts':
        // Premium users can have unlimited accounts
        return isPremium
      case 'manage_recurrence':
        // Premium users can manage recurring transactions
        return isPremium
      case 'ai_insights':
        return isPremiumIA
      default:
        return false
    }
  }

  return { can, isPremium, isPremiumIA, isFree, plan: user?.plan }
}
