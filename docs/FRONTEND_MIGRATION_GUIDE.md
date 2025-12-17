# 🔄 Guia de Migração - Frontend para Backend API

**Data:** 14/12/2025  
**Objetivo:** Migrar frontend de Supabase direto para Backend Golang

---

## 📋 O QUE FOI CRIADO

### 1. API Client
- ✅ `src/lib/api-client.ts` - Cliente HTTP configurado
- ✅ Autenticação automática com JWT
- ✅ Tratamento de erros

### 2. Services
- ✅ `src/services/account-service.ts` - CRUD de contas
- ✅ `src/services/transaction-service.ts` - CRUD de transações
- ✅ `src/services/index.ts` - Exports centralizados

### 3. Hooks
- ✅ `src/hooks/use-accounts.ts` - Hook para contas
- ✅ `src/hooks/use-transactions.ts` - Hook para transações

---

## 🔄 COMO MIGRAR COMPONENTES

### ANTES (Supabase Direto):

```typescript
// ❌ Código antigo
import { createClient } from '@/utils/supabase/client'

export function AccountList() {
  const [accounts, setAccounts] = useState([])
  
  useEffect(() => {
    const fetchAccounts = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
      
      setAccounts(data)
    }
    
    fetchAccounts()
  }, [])
  
  return (
    // JSX
  )
}
```

### DEPOIS (Backend API):

```typescript
// ✅ Código novo
import { useAccounts } from '@/hooks/use-accounts'

export function AccountList() {
  const { accounts, loading, error, createAccount, deleteAccount } = useAccounts()
  
  // Pronto! Dados já carregados automaticamente
  
  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  
  return (
    <div>
      {accounts.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  )
}
```

---

## 📝 EXEMPLOS PRÁTICOS

### 1. Listar Contas

```typescript
'use client'

import { useAccounts } from '@/hooks/use-accounts'

export function AccountsPage() {
  const { accounts, loading, error } = useAccounts()
  
  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  
  return (
    <div>
      <h1>Minhas Contas</h1>
      {accounts.map(account => (
        <div key={account.id}>
          <h3>{account.name}</h3>
          <p>Saldo: R$ {account.balance.toFixed(2)}</p>
        </div>
      ))}
    </div>
  )
}
```

### 2. Criar Conta

```typescript
'use client'

import { useAccounts } from '@/hooks/use-accounts'
import { useState } from 'react'

export function CreateAccountForm() {
  const { createAccount } = useAccounts()
  const [name, setName] = useState('')
  const [type, setType] = useState('conta_corrente')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createAccount({
        name,
        type,
        balance: 0
      })
      
      alert('Conta criada com sucesso!')
      setName('')
    } catch (error) {
      alert('Erro ao criar conta')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name} 
        onChange={e => setName(e.target.value)}
        placeholder="Nome da conta"
      />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="conta_corrente">Conta Corrente</option>
        <option value="poupanca">Poupança</option>
      </select>
      <button type="submit">Criar</button>
    </form>
  )
}
```

### 3. Listar Transações com Paginação

```typescript
'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { useState } from 'react'

export function TransactionsPage() {
  const [page, setPage] = useState(0)
  const limit = 20
  
  const { transactions, loading, error } = useTransactions({
    limit,
    offset: page * limit
  })
  
  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  
  return (
    <div>
      <h1>Transações</h1>
      
      {transactions.map(tx => (
        <div key={tx.id}>
          <p>{tx.description}</p>
          <p>R$ {tx.amount.toFixed(2)}</p>
          <p>{tx.type === 'receita' ? '↑' : '↓'}</p>
        </div>
      ))}
      
      <div>
        <button onClick={() => setPage(p => Math.max(0, p - 1))}>
          Anterior
        </button>
        <span>Página {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)}>
          Próxima
        </button>
      </div>
    </div>
  )
}
```

### 4. Criar Transação

```typescript
'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'

export function CreateTransactionForm() {
  const { createTransaction } = useTransactions()
  const { accounts } = useAccounts()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.target as HTMLFormElement)
    
    try {
      await createTransaction({
        account_id: formData.get('account_id') as string,
        description: formData.get('description') as string,
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('type') as 'receita' | 'despesa',
        date: new Date().toISOString()
      })
      
      alert('Transação criada! Saldo atualizado automaticamente.')
    } catch (error) {
      alert('Erro ao criar transação')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <select name="account_id">
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>{acc.name}</option>
        ))}
      </select>
      
      <input name="description" placeholder="Descrição" />
      <input name="amount" type="number" step="0.01" placeholder="Valor" />
      
      <select name="type">
        <option value="receita">Receita</option>
        <option value="despesa">Despesa</option>
      </select>
      
      <button type="submit">Criar</button>
    </form>
  )
}
```

---

## 🎯 BENEFÍCIOS DA MIGRAÇÃO

### Performance
- ✅ Queries otimizadas no backend
- ✅ Menos overhead de rede
- ✅ Cache no backend (futuro)

### Manutenção
- ✅ Lógica centralizada
- ✅ Fácil de testar
- ✅ Código reutilizável (Web + Mobile)

### Funcionalidades
- ✅ Saldo atualizado automaticamente
- ✅ Transações atômicas
- ✅ Validações no backend
- ✅ Paginação otimizada

---

## 📦 VARIÁVEL DE AMBIENTE

Adicione ao `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Para produção:
```env
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
```

---

## 🔄 PLANO DE MIGRAÇÃO GRADUAL

### Fase 1: Contas e Transações (Atual)
- [x] Criar API Client
- [x] Criar Account Service
- [x] Criar Transaction Service
- [x] Criar Hooks
- [ ] Migrar componentes de Accounts
- [ ] Migrar componentes de Transactions

### Fase 2: Categorias
- [ ] Implementar backend
- [ ] Criar Category Service
- [ ] Criar Hook
- [ ] Migrar componentes

### Fase 3: Cartões e Faturas
- [ ] Implementar backend
- [ ] Criar Services
- [ ] Criar Hooks
- [ ] Migrar componentes

### Fase 4: Contas a Pagar
- [ ] Implementar backend
- [ ] Criar Services
- [ ] Criar Hooks
- [ ] Migrar componentes

---

## 🧪 TESTAR A MIGRAÇÃO

### 1. Iniciar Backend
```bash
cd backend
go run cmd/api/main.go
```

### 2. Iniciar Frontend
```bash
cd web
npm run dev
```

### 3. Testar no Browser
- Abra http://localhost:3000
- Faça login
- Navegue para página de contas
- Crie uma conta
- Veja no Network tab: requisições vão para localhost:8080

---

## 📚 DOCUMENTAÇÃO

- **API Client:** `src/lib/api-client.ts`
- **Services:** `src/services/`
- **Hooks:** `src/hooks/`
- **Backend API:** `backend/README.md`

---

**Próximo Passo:** Migrar componentes existentes para usar os novos hooks! 🚀
