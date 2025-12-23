# 🔍 DIAGNÓSTICO: Erro "Database error saving new user"

## Problema
O erro persiste mesmo após:
- ✅ Criar trigger
- ✅ Remover FOREIGN KEY
- ✅ Desabilitar RLS
- ✅ Ajustar permissões

Isso indica que o problema está **no próprio Supabase Auth**, não na nossa tabela `users`.

---

## 🎯 SOLUÇÃO: Testar Signup via Supabase Dashboard

### Passo 1: Criar Usuário Manualmente

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Selecione o projeto

2. **Vá em Authentication > Users:**
   - Clique em "Add user"
   - Escolha "Create new user"

3. **Preencha:**
   - Email: `teste@fincore.com`
   - Password: `Teste123!`
   - Auto Confirm User: ✅ **SIM** (marque essa opção!)

4. **Clique em "Create user"**

5. **Verifique se foi criado:**
   - O usuário deve aparecer na lista
   - Copie o UUID do usuário

---

### Passo 2: Verificar se o Trigger Funcionou

Execute no SQL Editor:

```sql
-- Ver se o usuário foi criado em public.users
SELECT * FROM public.users 
WHERE email = 'teste@fincore.com';
```

**Resultado esperado:**
- Se aparecer o usuário = ✅ Trigger funcionou!
- Se NÃO aparecer = ❌ Trigger não está funcionando

---

### Passo 3: Se o Trigger NÃO Funcionou

Execute no SQL Editor:

```sql
-- Criar manualmente o registro em public.users
INSERT INTO public.users (
    id,
    full_name,
    email,
    subscription_plan,
    subscription_status,
    email_verified,
    is_active
)
SELECT 
    id,
    email,
    email,
    'free',
    'trial',
    false,
    true
FROM auth.users
WHERE email = 'teste@fincore.com'
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT * FROM public.users WHERE email = 'teste@fincore.com';
```

---

### Passo 4: Testar Login no Sistema

1. **Abra:** http://localhost:3000
2. **Faça login com:**
   - Email: `teste@fincore.com`
   - Password: `Teste123!`
3. **Deve funcionar!** ✅

---

## 🔍 INVESTIGAÇÃO ADICIONAL

Se mesmo criando manualmente não funcionar, o problema pode ser:

### Possibilidade 1: Supabase Auth Config

O Supabase pode estar configurado para **não permitir signups**.

**Verificar:**
1. Dashboard > Authentication > Settings
2. Procure por "Enable email signups"
3. Deve estar **HABILITADO** ✅

### Possibilidade 2: Email Confirmation

O Supabase pode estar exigindo confirmação de email.

**Solução temporária:**
1. Dashboard > Authentication > Settings
2. Procure por "Enable email confirmations"
3. **DESABILITE** temporariamente para testar

### Possibilidade 3: Erro no Frontend

O erro pode estar no código do frontend, não no banco.

**Verificar:**
- Arquivo: `apps/web/app/signup/page.tsx` ou similar
- Procure por erros de validação ou configuração do Supabase Client

---

## 💡 RECOMENDAÇÃO IMEDIATA

**Faça o seguinte AGORA:**

1. ✅ Crie um usuário manualmente via Dashboard (Passo 1)
2. ✅ Verifique se aparece em `public.users` (Passo 2)
3. ✅ Se não aparecer, crie manualmente (Passo 3)
4. ✅ Teste login no sistema (Passo 4)

**Isso vai te permitir testar o sistema enquanto investigamos o signup!**

---

## 📞 Me Avise

Depois de fazer isso, me diga:
1. O usuário foi criado no Dashboard?
2. Ele apareceu em `public.users`?
3. O login funcionou?

Com essas informações, vou saber exatamente onde está o problema! 🚀
