"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
    avatarUrl: string | null
    initials: string
    onAvatarUpdate: (newUrl: string) => Promise<void>
}

export function AvatarUpload({ avatarUrl, initials, onAvatarUpdate }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validação: máximo 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5MB.")
            return
        }

        setIsUploading(true)

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update User Profile via Parent
            await onAvatarUpdate(publicUrl)

            // 4. Update Preview
            setPreviewUrl(publicUrl)

        } catch (error) {
            console.error("Erro no upload:", error)
            alert("Erro ao enviar a imagem. Tente novamente.")
        } finally {
            setIsUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-slate-100 dark:border-slate-800 shadow-xl">
                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold">
                        {initials || <User className="w-8 h-8" />}
                    </AvatarFallback>
                </Avatar>

                <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "absolute bottom-0 right-0 p-2 rounded-full shadow-md transition-all",
                        "bg-blue-600 text-white hover:bg-blue-700 border-2 border-white dark:border-slate-900",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Alterar foto de perfil"
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
            />

            <p className="text-xs text-muted-foreground">
                Clique na câmera para alterar <br /> (Max 5MB)
            </p>
        </div>
    )
}
