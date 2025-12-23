# 🔄 REINICIAR BACKEND MANUALMENTE

## ❗ PROBLEMA IDENTIFICADO

O backend está rodando com o `.env` ANTIGO!

Mesmo que você tenha atualizado o `SUPABASE_JWT_SECRET`, o backend **NÃO vai carregar automaticamente**. Precisa **PARAR e REINICIAR**.

---

## ✅ SOLUÇÃO: Reiniciar Backend

### Passo 1: Parar o Backend

No terminal onde o backend está rodando:
1. Pressione **Ctrl + C**
2. Aguarde o processo parar

### Passo 2: Reiniciar o Backend

No mesmo terminal:
```bash
cd backend
go run cmd/api/main.go
```

### Passo 3: Verificar se Carregou Corretamente

Você deve ver no log algo como:
```
✅ Supabase connected successfully
🚀 Server starting on port 8080
```

---

## 🔍 VERIFICAR SE FUNCIONOU

1. **Recarregue a página** do frontend (F5)
2. **Verifique** se o erro "invalid token" sumiu
3. **Deve funcionar agora!** ✅

---

## ⚠️ SE AINDA DER ERRO

Se mesmo após reiniciar o backend o erro persistir, pode ser:

### Possibilidade 1: Token Expirado
O token do usuário pode ter expirado. **Solução:**
- Faça logout
- Faça login novamente
- Teste

### Possibilidade 2: Usuário não existe em public.users
O usuário pode estar em `auth.users` mas não em `public.users`. **Solução:**
```sql
-- Execute no Supabase SQL Editor
SELECT * FROM public.users WHERE email = 'SEU_EMAIL_AQUI';

-- Se não aparecer, crie manualmente:
INSERT INTO public.users (id, full_name, email, subscription_plan, subscription_status, email_verified, is_active)
SELECT id, email, email, 'free', 'trial', true, true
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI'
ON CONFLICT (id) DO NOTHING;
```

### Possibilidade 3: Backend não está validando corretamente
Pode haver um bug no código de validação do backend. **Solução:**
- Verificar logs do backend
- Ver se há erro específico

---

## 📝 CHECKLIST

- [ ] Parar backend (Ctrl+C)
- [ ] Reiniciar backend (`go run cmd/api/main.go`)
- [ ] Verificar logs do backend
- [ ] Recarregar frontend (F5)
- [ ] Testar novamente
- [ ] ✅ Funcionou!

---

**Reinicie o backend agora e me avise o resultado!** 🚀
