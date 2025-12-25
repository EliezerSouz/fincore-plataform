# 🔐 CONFIGURAÇÃO DO JWT SECRET - SUPABASE

## ❌ PROBLEMA ATUAL

O backend está retornando "invalid token" porque o **JWT Secret** não está configurado corretamente.

## ✅ SOLUÇÃO

Você precisa adicionar o **JWT Secret** do seu projeto Supabase no arquivo `.env` do backend.

### Passo 1: Obter o JWT Secret do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **API**
4. Copie o valor de **JWT Secret** (NÃO é a anon key!)

### Passo 2: Adicionar no `.env` do Backend

Abra o arquivo `f:\Antigravity\FinCore\Projeto\backend\.env` e adicione:

```env
SUPABASE_JWT_SECRET=seu_jwt_secret_aqui
```

**IMPORTANTE**: Use o **JWT Secret**, não a **Anon Key**!

### Passo 3: Reiniciar o Backend

Após adicionar o JWT Secret no `.env`:

1. Pare o backend (Ctrl+C no terminal)
2. Inicie novamente: `.\fincore-api.exe`

### Passo 4: Testar

1. Faça refresh no navegador (F5)
2. Tente criar uma conta novamente
3. Verifique os logs do backend - deve aparecer:
   - `🔑 JWT secret configured (length: XX)`
   - `✅ Token validated for user: [seu-user-id]`
   - `🔍 EnsureUserExists: Checking user [seu-user-id]`

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

Após configurar, você verá nos logs do backend:

```
🔑 JWT secret configured (length: 64)
✅ Token validated for user: abc123-def456-...
🔍 EnsureUserExists: Checking user abc123-def456-...
🆕 Creating user in database: abc123-def456-... (seu@email.com)
✅ User created successfully: abc123-def456-...
```

## ⚠️ TROUBLESHOOTING

Se ainda der erro "invalid token":

1. **Verifique se copiou o JWT Secret correto** (não a Anon Key)
2. **Certifique-se de que não há espaços** antes ou depois do secret
3. **Reinicie o backend** após alterar o `.env`
4. **Limpe o cache do navegador** e faça login novamente

## 📋 CHECKLIST

- [ ] Acessei o Supabase Dashboard
- [ ] Copiei o **JWT Secret** (Settings → API)
- [ ] Adicionei `SUPABASE_JWT_SECRET=...` no `.env`
- [ ] Reiniciei o backend
- [ ] Fiz refresh no navegador
- [ ] Testei criar uma conta

---

**Após configurar, reporte se funcionou!**
