# Correção do Erro "Database error saving new user"

## Problema Identificado

O erro "Database error saving new user" estava ocorrendo porque:

1. **Falta de Constraint UNIQUE**: A tabela `payment_methods` não tinha uma constraint de unicidade no campo `slug`
2. **ON CONFLICT não funcionava**: Sem a constraint, o `ON CONFLICT DO NOTHING` na função `create_default_payment_methods` não tinha efeito
3. **Duplicatas causavam erro**: Quando o trigger tentava criar métodos de pagamento padrão para um novo usuário, ocorriam tentativas de inserção duplicada

## Solução Implementada

### Migration: `20251223000000_fix_payment_methods_constraints.sql`

A migration criada resolve o problema através de:

#### 1. Limpeza de Duplicatas
```sql
DELETE FROM payment_methods a
USING payment_methods b
WHERE a.id > b.id
  AND a.slug = b.slug
  AND a.user_id = b.user_id;
```

#### 2. Adição de Constraint UNIQUE
```sql
ALTER TABLE payment_methods 
ADD CONSTRAINT payment_methods_user_slug_unique 
UNIQUE (user_id, slug);
```

Isso garante que cada usuário só pode ter um método de pagamento com um determinado slug.

#### 3. Criação de Índice para Performance
```sql
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_slug 
ON payment_methods(user_id, slug);
```

#### 4. Atualização da Função `create_default_payment_methods`
A função foi atualizada para usar corretamente o `ON CONFLICT (user_id, slug) DO NOTHING`, que agora funciona devido à constraint criada.

#### 5. Correção das Policies RLS
As policies foram reorganizadas e simplificadas:
- `payment_methods_select_policy`: Permite ler métodos próprios ou do sistema (user_id IS NULL)
- `payment_methods_insert_policy`: Permite inserir apenas métodos próprios
- `payment_methods_update_policy`: Permite atualizar apenas métodos próprios
- `payment_methods_delete_policy`: Permite deletar apenas métodos próprios

## Fluxo de Criação de Usuário

Quando um novo usuário é criado:

1. **Supabase Auth** cria o registro em `auth.users`
2. **Trigger `on_auth_user_created`** executa a função `handle_new_user()`
3. **`handle_new_user()`** cria o registro em `public.users`
4. **Trigger `trigger_setup_payment_methods`** executa após inserção em `public.users`
5. **`trigger_setup_payment_methods()`** chama `create_default_payment_methods()`
6. **`create_default_payment_methods()`** cria os métodos de pagamento padrão:
   - PIX
   - Dinheiro
   - Cartão de Crédito
   - Cartão de Débito
   - Boleto
   - Transferência Bancária
   - Débito Automático
   - Transferência Interna
   - Outro

Cada método tem um slug único baseado no user_id: `'pix-' || p_user_id::text`

## Status

✅ **Migration aplicada com sucesso**
✅ **Constraint UNIQUE criada**
✅ **Policies RLS atualizadas**
✅ **Função `create_default_payment_methods` corrigida**

## Próximos Passos

1. Testar criação de novo usuário
2. Verificar se os métodos de pagamento são criados corretamente
3. Confirmar que não há mais erros de duplicação

## Arquivos Modificados

- ✅ `apps/web/supabase/migrations/20251223000000_fix_payment_methods_constraints.sql` (criado)
- ✅ `apps/web/supabase/apply-migration.mjs` (atualizado)

## Comandos Executados

```bash
node supabase/apply-migration.mjs
```

**Resultado**: Migration aplicada com sucesso! ✅
