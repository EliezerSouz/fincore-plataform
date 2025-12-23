# 🔧 CONFIGURAR FRONTEND PARA BANCO NOVO

## ❌ PROBLEMA IDENTIFICADO

O frontend está conectado no **BANCO ANTIGO**!

Por isso o login não funciona - o usuário foi criado no banco NOVO, mas o frontend está tentando autenticar no banco ANTIGO.

---

## ✅ SOLUÇÃO

### Passo 1: Criar arquivo `.env.local`

Crie o arquivo manualmente:

**Caminho:** `apps/web/.env.local`

**Conteúdo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY_AQUI
```

---

### Passo 2: Obter Credenciais do Banco NOVO

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione** o projeto NOVO (FinCore Production)
3. **Vá em:** Settings > API
4. **Copie:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Passo 3: Substituir no arquivo

Cole as credenciais no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg5NzYwMDAsImV4cCI6MjAwNDU1MjAwMH0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### Passo 4: Reiniciar Frontend

1. **Pare o frontend** (Ctrl+C no terminal onde está rodando)
2. **Inicie novamente:**
   ```bash
   cd apps/web
   npm run dev
   ```

---

### Passo 5: Testar Login

1. **Abra:** http://localhost:3000
2. **Faça login** com o usuário que você criou
3. **Deve funcionar agora!** ✅

---

## 🔍 VERIFICAR SE ESTÁ CORRETO

No navegador, abra o Console (F12) e execute:

```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

**Deve mostrar a URL do BANCO NOVO!**

Se mostrar `undefined` ou a URL antiga, o `.env.local` não está sendo lido.

---

## 📝 CHECKLIST

- [ ] Criar arquivo `apps/web/.env.local`
- [ ] Copiar credenciais do banco NOVO
- [ ] Colar no arquivo
- [ ] Salvar arquivo
- [ ] Reiniciar frontend
- [ ] Testar login
- [ ] ✅ Funcionou!

---

**Me avise quando criar o arquivo e reiniciar!** 🚀
