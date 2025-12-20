# 🏗️ Arquitetura de Transações Financeiras - FINCORE

## 📋 Visão Geral

Este documento descreve a arquitetura padronizada para criação e edição de transações financeiras, garantindo **100% de consistência visual e funcional** em todo o sistema.

---

## 🎯 Objetivos Alcançados

✅ **Componente Base Reutilizável** - `FinancialTransactionForm`  
✅ **Zero Divergência Visual** - Criar e Editar são visualmente idênticos  
✅ **Modalidades Dinâmicas** - Filtradas automaticamente por tipo de transação  
✅ **Regras de Negócio Centralizadas** - Lógica única, sem duplicação  
✅ **Manutenibilidade** - Mudanças em um lugar afetam todas as telas  

---

## 📁 Estrutura de Arquivos

```
apps/web/src/features/transactions/components/
├── financial-transaction-form.tsx       ← COMPONENTE BASE (CORE)
├── create-transaction-dialog.tsx        ← Wrapper para CRIAR
└── edit-transaction-dialog.tsx          ← Wrapper para EDITAR
```

---

## 🧩 Componente Base: `FinancialTransactionForm`

### Responsabilidades

1. **Layout Visual Único**
   - Seletor de tipo (Despesa/Receita/Transferência)
   - Campos de entrada padronizados
   - Estilos consistentes (cores, espaçamentos, animações)

2. **Lógica de Modalidades de Pagamento**
   ```typescript
   const filteredMethods = methods.filter(m => {
       if (type === 'receita') return !!m.allows_income
       if (type === 'despesa') return !!m.allows_expense
       if (type === 'transferencia') return !!m.allows_expense
       return true
   })
   ```

3. **Campos Condicionais**
   - Categoria/Subcategoria → Oculto em transferências
   - Forma de Pagamento → Substituído por "Conta Destino" em transferências
   - Seletor de Cartão → Aparece apenas se método = `credit_card`
   - Parcelas → Aparece apenas se método = `credit_card`

### Props Interface

```typescript
interface FinancialTransactionFormProps {
    mode: 'create' | 'edit'                          // Modo de operação
    initialData?: Partial<FinancialTransactionFormData> // Dados iniciais (edit)
    onSubmit: (data: FinancialTransactionFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    showTypeSelector?: boolean                       // Mostrar tabs de tipo
}
```

---

## 🔄 Fluxo de Dados

### Criar Transação

```
CreateTransactionDialog
    ↓
FinancialTransactionForm (mode: 'create')
    ↓
onSubmit → createTransaction() ou createTransfer()
    ↓
Reload da página
```

### Editar Transação

```
EditTransactionDialog (recebe Transaction)
    ↓
FinancialTransactionForm (mode: 'edit', initialData)
    ↓
onSubmit → updateTransaction(id, formData)
    ↓
Reload da página
```

---

## 🎨 Padrão Visual

### Cores por Tipo

| Tipo           | Cor Principal | Classe CSS                                      |
|----------------|---------------|-------------------------------------------------|
| **Despesa**    | Vermelho      | `bg-red-600 hover:bg-red-700 text-white`       |
| **Receita**    | Verde         | `bg-emerald-600 hover:bg-emerald-700 text-white` |
| **Transferência** | Azul       | `bg-blue-600 hover:bg-blue-700 text-white`     |

### Componentes Visuais

- **Labels**: `text-xs font-semibold uppercase text-slate-500`
- **Inputs**: `shadow-sm` + classes padrão do shadcn
- **Selects**: Mesmas classes dos inputs
- **Botões**: Cores dinâmicas conforme tipo
- **Animações**: `animate-in fade-in slide-in-from-top-1` (cartão de crédito)

---

## 🔐 Regras de Negócio

### Validações

1. **Valor** → Deve ser maior que zero
2. **Transferência** → Contas origem e destino devem ser diferentes
3. **Despesa/Receita** → Categoria é obrigatória
4. **Cartão de Crédito** → Cartão deve ser selecionado

### Permissões

- **Transferências** → Requer `transfer_between_accounts`
- **Múltiplos Cartões** → Requer `unlimited_cards`

### Filtros de Modalidades

```typescript
// Tabela payment_methods
allows_income: boolean      // Aparece em RECEITAS
allows_expense: boolean     // Aparece em DESPESAS
allows_transfer: boolean    // Aparece em TRANSFERÊNCIAS (usa allows_expense)
is_active: boolean          // Deve estar ativo
```

---

## 🚀 Como Usar

### Criar Nova Tela de Edição

```typescript
import { FinancialTransactionForm } from "./financial-transaction-form"

export function MyEditDialog({ transaction, open, onOpenChange }) {
    const [isLoading, setIsLoading] = useState(false)

    const initialData = {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        // ... outros campos
    }

    async function handleSubmit(data) {
        setIsLoading(true)
        try {
            // Sua lógica de update
            await updateMyTransaction(data)
            onOpenChange(false)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Transação</DialogTitle>
                </DialogHeader>
                
                <FinancialTransactionForm
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    )
}
```

---

## 📊 Benefícios da Arquitetura

### 1. **Consistência Garantida**
- Usuário vê a mesma interface em criar e editar
- Reduz curva de aprendizado
- Aumenta confiança no sistema

### 2. **Manutenibilidade**
- Mudança visual? Edita 1 arquivo
- Nova regra de negócio? Edita 1 arquivo
- Bug? Corrige 1 vez, funciona em todos os lugares

### 3. **Escalabilidade**
- Adicionar nova tela? Cria wrapper em 20 linhas
- Novo tipo de transação? Adiciona no enum
- Nova modalidade? Cadastra no banco, aparece automaticamente

### 4. **Testabilidade**
- Testa o componente base = testa todas as telas
- Mocks centralizados
- Menos duplicação de testes

---

## 🔮 Próximos Passos

### Curto Prazo
- [ ] Migrar `EditPayableDialog` para usar o form base
- [ ] Migrar `EditCardTransactionDialog` para usar o form base
- [ ] Adicionar testes unitários no form base

### Médio Prazo
- [ ] Implementar validação em tempo real
- [ ] Adicionar tooltips explicativos nas modalidades
- [ ] Criar preview de impacto (ex: "Esta transação afetará seu saldo em...")

### Longo Prazo
- [ ] Integrar IA para sugestões de categoria
- [ ] Histórico de edições
- [ ] Undo/Redo de transações

---

## 📝 Notas Importantes

### ⚠️ NÃO FAZER

❌ Criar variações visuais do form base  
❌ Duplicar lógica de modalidades  
❌ Hardcode de opções de pagamento  
❌ Ignorar flags do banco de dados  

### ✅ SEMPRE FAZER

✅ Usar o componente base para novas telas  
✅ Respeitar as flags de `payment_methods`  
✅ Manter consistência visual absoluta  
✅ Documentar mudanças neste arquivo  

---

## 🤝 Contribuindo

Ao modificar o `FinancialTransactionForm`:

1. **Teste em TODAS as telas** que o usam
2. **Valide visualmente** criar e editar
3. **Confirme as modalidades** aparecem corretamente
4. **Atualize este documento** se necessário

---

## 📞 Contato

Dúvidas sobre a arquitetura? Consulte:
- `financial-transaction-form.tsx` - Código fonte comentado
- `MIGRATION_STATUS.md` - Status da migração
- Este documento - Visão arquitetural

---

**Última atualização:** 2025-12-18  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e Funcional
