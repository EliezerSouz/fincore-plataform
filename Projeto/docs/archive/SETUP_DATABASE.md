# 🚀 Guia de Configuração do Banco de Dados

## ✅ O que foi criado

1. **Migration SQL** (`supabase/migrations/001_create_users_table.sql`)
   - Tabela `users` completa com campos de assinatura
   - Triggers automáticos para criar usuário após signup
   - Funções de validação de assinatura
   - Row Level Security (RLS) configurado

2. **Biblioteca TypeScript** (`lib/user.ts`)
   - Funções para gerenciar usuários
   - Funções para gerenciar assinaturas
   - Helpers para cálculos de trial e status

3. **Função de busca** (`lib/get-user-data.ts`)
   - Busca dados formatados do usuário
   - Pronta para usar em componentes

4. **TopBar atualizado**
   - Agora busca dados reais do banco
   - Exibe nome, email e plano do usuário

## 📝 Passo a Passo para Configurar

### 1️⃣ Executar Migration no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Abra o arquivo `supabase/migrations/001_create_users_table.sql`
6. **Copie TODO o conteúdo** do arquivo
7. **Cole** no SQL Editor
8. Clique em **Run** (ou Ctrl+Enter)
9. Aguarde a mensagem de sucesso ✅

### 2️⃣ Verificar se Funcionou

1. Vá em **Table Editor** no Supabase
2. Você deve ver a tabela **users** criada
3. Clique nela para ver as colunas

### 3️⃣ Criar Usuário de Teste

**Opção A: Via Aplicação (Recomendado)**

1. Acesse `http://localhost:3000/logout` para deslogar
2. Vá em **Criar nova conta**
3. Preencha:
   - Nome: Seu Nome Completo
   - Telefone: (11) 99999-9999
   - Email: seu@email.com
   - Senha: senha123
4. Cadastre-se

**Opção B: Via SQL (Manual)**

```sql
-- No SQL Editor do Supabase, execute:

-- 1. Criar usuário no auth (substitua os valores)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'teste@exemplo.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Usuário Teste", "phone": "(11) 99999-9999"}'::jsonb
);

-- 2. O trigger criará automaticamente o registro na tabela users
```

### 4️⃣ Verificar Dados no Dashboard

Após criar o usuário:

1. Vá em **Table Editor** > **users**
2. Você deve ver o usuário criado com:
   - ✅ Nome completo
   - ✅ Telefone
   - ✅ Email
   - ✅ Status: `trial`
   - ✅ Plano: `trial`
   - ✅ Trial ends at: 14 dias no futuro

### 5️⃣ Testar na Aplicação

1. Faça login com o usuário criado
2. Acesse o dashboard
3. No **TopBar** (canto superior direito):
   - ✅ Deve aparecer seu nome real
   - ✅ Deve aparecer "Período de Teste" (ou o plano atual)
   - ✅ Suas iniciais no avatar

## 🎯 Próximos Passos

### Atualizar Sidebar com Dados Reais

Vou atualizar o `AppSidebar` para também buscar dados reais:

```typescript
// Em app-sidebar.tsx
import { getUserData } from '@/lib/get-user-data'

export async function AppSidebar() {
  const userData = await getUserData()
  // ... usar userData ao invés de mock
}
```

### Implementar Middleware de Verificação

Criar middleware para bloquear acesso de usuários sem assinatura válida:

```typescript
// middleware.ts
import { hasValidSubscription } from '@/lib/user'

export async function middleware(request: NextRequest) {
  const isValid = await hasValidSubscription()
  
  if (!isValid && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/subscription-expired', request.url))
  }
}
```

### Integrar Gateway de Pagamento

Opções:
- **Stripe**: Mais usado internacionalmente
- **Mercado Pago**: Melhor para Brasil
- **Asaas**: Focado em SaaS brasileiro

## 🔧 Funções Úteis

### Ativar Assinatura Premium (Teste)

```typescript
import { activatePremiumSubscription } from '@/lib/user'

// Em alguma server action
await activatePremiumSubscription('premium')
```

### Verificar Status de Assinatura

```typescript
import { hasValidSubscription } from '@/lib/user'

const isValid = await hasValidSubscription()
if (!isValid) {
  // Redirecionar para página de pagamento
}
```

### Registrar Pagamento

```typescript
import { recordPayment } from '@/lib/user'

// Após confirmar pagamento
await recordPayment('credit_card')
```

## 📊 Estrutura de Assinatura

### Status Lifecycle

```
trial (14 dias)
    ↓ (pagamento)
active (30 dias)
    ↓ (vencimento)
past_due (3 dias grace)
    ↓ (sem pagamento)
suspended
```

### Planos e Preços (Sugestão)

- **Trial**: Gratuito, 14 dias
- **Basic**: R$ 29,90/mês
- **Premium**: R$ 59,90/mês
- **Enterprise**: R$ 149,90/mês

## 🆘 Troubleshooting

### "relation does not exist"
- A migration não foi executada. Volte ao passo 1.

### "User not found in users table"
- O trigger não funcionou. Verifique se existe:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

### "RLS policy violation"
- Usuário não está autenticado. Faça login novamente.

### TopBar não mostra dados reais
- Verifique se o usuário existe na tabela `users`
- Confira os logs do servidor Next.js

## ✨ Recursos Implementados

- ✅ Criação automática de usuário após signup
- ✅ Validação de assinatura
- ✅ Período de trial (14 dias)
- ✅ Grace period (3 dias)
- ✅ Row Level Security
- ✅ Funções TypeScript type-safe
- ✅ TopBar com dados reais
- ⏳ Sidebar com dados reais (próximo)
- ⏳ Middleware de verificação (próximo)
- ⏳ Integração de pagamento (próximo)

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique os logs do Supabase (Database > Logs)
2. Verifique os logs do Next.js no terminal
3. Teste as funções SQL diretamente no SQL Editor
