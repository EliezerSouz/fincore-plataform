# Configuração do Banco de Dados - Financial OS

## 📋 Visão Geral

Este documento explica como configurar o banco de dados do seu SaaS financeiro no Supabase.

## 🗄️ Estrutura do Banco

### Tabela `users`

Armazena informações completas dos usuários, incluindo:

- **Dados Pessoais**: nome, telefone, email
- **Assinatura**: plano, status, datas de início/fim
- **Pagamento**: última data de pagamento, próxima cobrança, método
- **Metadados**: criação, atualização, flags de controle

### Status de Assinatura

- `trial` - Período de teste (14 dias padrão)
- `active` - Assinatura ativa e paga
- `past_due` - Pagamento atrasado (3 dias de grace period)
- `canceled` - Cancelada pelo usuário
- `suspended` - Suspensa por falta de pagamento

### Planos Disponíveis

- `free` - Gratuito (limitado)
- `basic` - Básico
- `premium` - Premium
- `enterprise` - Enterprise

## 🚀 Como Executar a Migration

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase/migrations/001_create_users_table.sql`
5. Cole no editor
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migration
supabase db push
```

## ✅ Verificar se Funcionou

Após executar a migration, verifique no **Table Editor** do Supabase:

1. Deve aparecer a tabela `users`
2. Faça um teste de cadastro na aplicação
3. Verifique se o usuário foi criado automaticamente na tabela

## 🔐 Segurança (RLS)

A tabela já vem com **Row Level Security** configurada:

- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só podem atualizar seus próprios dados
- ✅ Criação automática via trigger do auth

## 🧪 Testar Funções

Você pode testar as funções SQL diretamente no SQL Editor:

```sql
-- Verificar se assinatura está válida
SELECT is_subscription_valid('UUID_DO_USUARIO');

-- Atualizar assinaturas expiradas (executar diariamente via cron)
SELECT update_expired_subscriptions();
```

## 📊 Próximos Passos

Após configurar o banco:

1. ✅ Criar um usuário de teste
2. ✅ Atualizar componentes para buscar dados reais
3. ✅ Implementar middleware de verificação de assinatura
4. ✅ Configurar webhook de pagamento (Stripe/Mercado Pago)

## 🔄 Automação de Expiração

Para automatizar a verificação de assinaturas expiradas, configure um **Cron Job** no Supabase:

1. Vá em **Database** > **Cron Jobs**
2. Crie um novo job:
   - **Name**: `update_expired_subscriptions`
   - **Schedule**: `0 0 * * *` (diariamente à meia-noite)
   - **SQL**: `SELECT update_expired_subscriptions();`

## 💡 Dicas

- **Trial padrão**: 14 dias (configurável na migration)
- **Grace period**: 3 dias após vencimento
- **Billing cycle**: 30 dias (mensal)

## 🆘 Troubleshooting

### Erro: "relation already exists"
- A tabela já foi criada. Use `DROP TABLE users CASCADE;` antes de recriar (⚠️ apaga dados!)

### Trigger não está funcionando
- Verifique se a função `handle_new_user()` existe
- Confirme que o trigger `on_auth_user_created` está ativo

### RLS bloqueando acesso
- Verifique se o usuário está autenticado (`auth.uid()` não é null)
- Confirme que as policies estão ativas
