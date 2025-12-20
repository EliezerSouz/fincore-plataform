# 💳 Sistema de Cartões de Crédito - Guia Rápido

## 📦 O que foi criado?

### 🗄️ Banco de Dados (3 Migrations)

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `011_create_credit_card_invoices.sql` | Tabela de faturas mensais | ⏳ Aguardando execução |
| `012_create_credit_card_transactions.sql` | Tabela de compras/transações | ⏳ Aguardando execução |
| `013_credit_card_functions.sql` | Funções auxiliares (parcelamento, etc) | ⏳ Aguardando execução |

### 📚 Documentação (3 Arquivos)

| Arquivo | Conteúdo |
|---------|----------|
| `CREDIT_CARDS_SUMMARY.md` | **COMECE AQUI** - Resumo executivo |
| `CREDIT_CARDS_DATABASE.md` | Documentação técnica completa |
| `RUNNING_MIGRATIONS.md` | Como executar as migrations |

### 🛠️ Scripts

| Arquivo | Uso |
|---------|-----|
| `run-migrations.mjs` | Script para executar migrations via Node.js |

---

## 🚀 Como Começar?

### Passo 1: Ler a Documentação
```bash
# Leia primeiro o resumo executivo
docs/CREDIT_CARDS_SUMMARY.md
```

### Passo 2: Executar Migrations
```bash
# Siga o guia passo a passo
docs/RUNNING_MIGRATIONS.md
```

**Método Recomendado:** Via Supabase Dashboard (SQL Editor)

1. Acesse: https://supabase.com/dashboard
2. Vá em "SQL Editor"
3. Execute as migrations na ordem (011 → 012 → 013)

### Passo 3: Verificar Instalação
```sql
-- No SQL Editor do Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'credit_card%'
ORDER BY table_name;
```

**Resultado esperado:**
- ✅ credit_card_invoices
- ✅ credit_card_transactions
- ✅ credit_cards (já existia)

---

## 🎯 Funcionalidades Implementadas

### ✅ Gerenciamento de Cartões
- Cadastro de múltiplos cartões
- Limite, bandeira, datas de fechamento/vencimento
- Cores personalizadas para UI

### ✅ Faturas Automáticas
- Criação automática de faturas mensais
- Cálculo inteligente baseado na data de fechamento
- Status: open, closed, paid, overdue, partial

### ✅ Compras e Transações
- Compras à vista
- **Parcelamento automático** (divide em N parcelas)
- Estornos, ajustes, taxas
- Categorização

### ✅ Funções Inteligentes
- `get_or_create_invoice()` - Cria fatura automaticamente
- `create_installment_purchase()` - Parcelamento em 1 comando
- `pay_invoice()` - Registra pagamentos
- `update_overdue_invoices()` - Marca faturas vencidas

---

## 📊 Exemplo de Uso

### Criar uma compra parcelada
```sql
SELECT create_installment_purchase(
  auth.uid(),                    -- ID do usuário
  'card-uuid',                   -- ID do cartão
  'iPhone 15 Pro',               -- Descrição
  7200.00,                       -- Valor total
  CURRENT_DATE,                  -- Data da compra
  12,                            -- Número de parcelas
  'category-uuid'                -- Categoria (opcional)
);
```

**Resultado:**
- ✅ Cria 12 parcelas de R$ 600,00
- ✅ Distribui nas próximas 12 faturas
- ✅ Vincula todas à compra original

---

## 📁 Estrutura de Arquivos

```
Financeiro/
├── web/
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 011_create_credit_card_invoices.sql
│   │       ├── 012_create_credit_card_transactions.sql
│   │       └── 013_credit_card_functions.sql
│   ├── scripts/
│   │   └── run-migrations.mjs
│   └── app/
│       └── (protected)/
│           └── compromissos/
│               └── cards/
│                   ├── page.tsx              ← Página principal
│                   ├── card-list.tsx         ← Lista de cartões
│                   ├── create-card-dialog.tsx ← Formulário
│                   └── actions.ts            ← Server actions
└── docs/
    ├── README_CREDIT_CARDS.md               ← VOCÊ ESTÁ AQUI
    ├── CREDIT_CARDS_SUMMARY.md              ← Resumo executivo
    ├── CREDIT_CARDS_DATABASE.md             ← Docs técnicas
    └── RUNNING_MIGRATIONS.md                ← Guia de instalação
```

---

## 🔄 Próximos Passos

### 1. Executar Migrations ⏳
- [ ] Abrir Supabase Dashboard
- [ ] Executar migration 011 (invoices)
- [ ] Executar migration 012 (transactions)
- [ ] Executar migration 013 (functions)
- [ ] Verificar tabelas criadas

### 2. Criar Páginas de Faturas 🎨
- [ ] `/compromissos/faturas` - Lista de faturas
- [ ] `/compromissos/faturas/[id]` - Detalhes da fatura
- [ ] Formulário de nova compra
- [ ] Formulário de pagamento

### 3. Dashboard e Relatórios 📊
- [ ] Gráfico de gastos por categoria
- [ ] Evolução mensal
- [ ] Alertas de vencimento
- [ ] Limite disponível em tempo real

### 4. Integração com IA 🤖
- [ ] Análise de padrões de consumo
- [ ] Sugestões de economia
- [ ] Alertas inteligentes
- [ ] Previsão de gastos futuros

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

**❌ Erro: "relation credit_card_invoices does not exist"**
→ Execute a migration 011 primeiro

**❌ Erro: "function get_or_create_invoice does not exist"**
→ Execute a migration 013

**❌ Erro: "permission denied"**
→ Verifique se está autenticado (RLS ativo)

### Documentação Completa
- 📖 [Documentação Técnica](./CREDIT_CARDS_DATABASE.md)
- 🚀 [Guia de Instalação](./RUNNING_MIGRATIONS.md)
- 📋 [Resumo Executivo](./CREDIT_CARDS_SUMMARY.md)

---

## 📞 Contato

Se tiver dúvidas ou sugestões, consulte a documentação completa ou abra uma issue.

---

**Versão:** 1.0.0  
**Última atualização:** 13/12/2024  
**Status:** ⏳ Aguardando execução das migrations
