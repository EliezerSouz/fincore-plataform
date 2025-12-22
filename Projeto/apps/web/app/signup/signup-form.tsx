'use client'

import { useState } from 'react'
import { signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Logo } from "@/components/ui/logo"
import { EcgBackground } from "@/components/ui/ecg-background"
import { siteConfig } from "@/config/site"

export function SignupForm() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState('')

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 11) {
            return numbers
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d)(\d{4})$/, '$1-$2')
        }
        return numbers.slice(0, 11)
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value))
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        // Ensure the formatted/uppercased values are what's sent (state takes precedence if we controlled them)
        // Since we are setting name attribute, FormData pulls from the input. 
        // If we control value, Input reflects state. FormData pulls that value. Correct.

        try {
            const result = await signup(formData)
            if (result && result.error) {
                setError(result.error)
                setLoading(false)
            }
            // If strictly successful, the server action redirects, so we don't strictly need to handle it here
            // but we can keep loading true.
        } catch (e) {
            // Next.js redirects throws an error, so we need to catch it if it's not a standard error
            // But usually redirect() works fine. If it throws, it might be handled by Next.js router.
            // Let's assume valid redirect doesn't land here or is effectively a navigation.
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
            <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2 relative overflow-hidden">
                <EcgBackground opacity={0.25} className="scale-[1.2] -mt-2" />
                <CardTitle className="flex justify-center mb-2 relative z-10">
                    <Logo size="xl" />
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 relative z-10">
                    {siteConfig.slogan}
                </CardDescription>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mt-4 relative z-10">
                    Criar Nova Conta
                </h3>
            </CardHeader>
            <CardContent className="pt-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-pulse">
                        <span className="font-bold">Erro:</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            type="text"
                            placeholder="Seu nome completo"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Celular / WhatsApp</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(11) 9 xxxx-xxxx"
                            required
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength={15}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirmar Senha</Label>
                        <PasswordInput
                            id="confirm_password"
                            name="confirm_password"
                            required
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/20 mt-2">
                        {loading ? 'Criando conta...' : 'Cadastrar-se'}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 gap-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    Já tem uma conta?{' '}
                    <Link href="/login" className="text-blue-600 font-medium hover:underline">
                        Entrar
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
