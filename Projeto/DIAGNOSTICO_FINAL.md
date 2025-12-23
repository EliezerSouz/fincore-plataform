# 🔧 TESTE DE DIAGNÓSTICO FINAL

## 🎯 Vamos Isolar o Problema

O erro "invalid token" pode ter 3 causas:

### 1. Backend não foi reiniciado
### 2. JWT_SECRET está errado
### 3. Usuário não existe em public.users

---

## ✅ TESTE 1: Verificar se Backend Foi Reiniciado

**Faça logout e login novamente:**
1. Clique em "Sair" no sistema
2. Faça login novamente
3. Isso vai gerar um token NOVO
4. Teste se funciona

---

## ✅ TESTE 2: Verificar Usuário em public.users

Execute no Supabase SQL Editor:

```sql
-- Ver se o usuário existe
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.subscription_plan,
    u.subscription_status,
    u.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE au.email = 'SEU_EMAIL_AQUI';  -- Substitua pelo seu email
```

**Se NÃO aparecer nada:**
```sql
-- Criar o registro manualmente
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
    COALESCE(raw_user_meta_data->>'full_name', email),
    email,
    'free',
    'trial',
    email_confirmed_at IS NOT NULL,
    true
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI'  -- Substitua pelo seu email
ON CONFLICT (id) DO NOTHING;

-- Criar categorias e métodos de pagamento
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI';
    PERFORM create_default_categories(v_user_id);
    PERFORM create_default_payment_methods(v_user_id);
END $$;
```

---

## ✅ TESTE 3: Endpoint Público (Bypass Auth)

Vou criar um endpoint de teste SEM autenticação para verificar se o backend está funcionando:

**Teste no navegador:**
```
http://localhost:8080/ping
```

**Deve retornar:**
```json
{"message": "pong"}
```

Se funcionar = Backend está OK
Se NÃO funcionar = Backend não está rodando

---

## 🎯 SOLUÇÃO TEMPORÁRIA

Se nada funcionar, podemos:

1. **Desabilitar autenticação temporariamente** no backend
2. **Testar o sistema** sem auth
3. **Investigar o problema** com calma depois

---

## 📝 CHECKLIST FINAL

- [ ] Fazer logout e login novamente
- [ ] Verificar se usuário existe em public.users
- [ ] Criar usuário manualmente se não existir
- [ ] Testar endpoint /ping
- [ ] Se tudo falhar, desabilitar auth temporariamente

---

**Qual teste você quer fazer primeiro?** 🚀

1. Logout/Login?
2. Verificar usuário no banco?
3. Testar endpoint /ping?
4. Desabilitar auth temporariamente?

**Me diga e eu te ajudo!** 😊
