"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import { ManageParentAccountModal } from "./manage-parent-account-modal"

export function PocketsPageHeader() {
    const [showNewInstitutionModal, setShowNewInstitutionModal] = useState(false)

    return (
        <>
            <ManageParentAccountModal
                open={showNewInstitutionModal}
                onOpenChange={setShowNewInstitutionModal}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Minhas Contas
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Gerencie suas instuições financeiras e pockets (bolsos).
                    </p>
                </div>
                <Button onClick={() => setShowNewInstitutionModal(true)} className="gap-2">
                    <Building2 className="w-4 h-4" />
                    Nova Instituição
                </Button>
            </div>
        </>
    )
}
