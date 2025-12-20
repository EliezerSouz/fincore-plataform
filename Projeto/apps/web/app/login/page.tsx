import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import Link from 'next/link'
import { Logo } from "@/components/ui/logo"

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const error = searchParams.error as string | undefined

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
                <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
                    <CardTitle className="flex justify-center mb-2">
                        <Logo size="xl" />
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        O coração da sua vida financeira.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-pulse">
                            <span className="font-bold">Erro:</span>
                            {error}
                        </div>
                    )}

                    <form className="space-y-4">
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Button variant="link" className="p-0 h-auto text-xs text-blue-600 hover:text-blue-500">
                                    Esqueceu a senha?
                                </Button>
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="pt-2 flex flex-col gap-2">
                            <Button formAction={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/20">
                                Entrar
                            </Button>

                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Ou</span>
                                </div>
                            </div>

                            <Link href="/signup" className="w-full">
                                <Button type="button" variant="outline" className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    Criar nova conta
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                    <p className="text-xs text-center text-slate-500">
                        Protegido por criptografia de ponta a ponta.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
