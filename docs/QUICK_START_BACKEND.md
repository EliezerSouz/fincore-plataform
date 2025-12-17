# 🚀 Guia Rápido - Iniciar Backend

## ⚠️ ERRO ATUAL

```
fetch failed
```

**Causa:** O backend não está rodando em `localhost:8080`

---

## ✅ SOLUÇÃO

### 1. Configure o Backend `.env`

Edite `backend/.env` e configure:

#### a) DATABASE_URL

**Obter do Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → Database
4. Connection String → **Connection Pooling** (Transaction Mode)
5. Copie a URL e substitua `[YOUR-PASSWORD]` pela senha real

**Exemplo:**
```env
DATABASE_URL=postgresql://postgres.ufgpwjgqxjuqfqbfqxqb:SUA_SENHA_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### b) SUPABASE_JWT_SECRET

**Obter do Supabase Dashboard:**
1. Settings → API
2. Copie **JWT Secret** (não é o anon key!)

**Exemplo:**
```env
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters
```

---

### 2. Inicie o Backend

```powershell
cd backend
go run cmd/api/main.go
```

**Saída esperada:**
```
🚀 Server starting on port 8080
📊 API available at http://localhost:8080/api
💚 Health check at http://localhost:8080/health
```

---

### 3. Teste o Backend

Em outro terminal:

```powershell
# Health check
curl http://localhost:8080/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "financeiro-api",
  "version": "1.0.0"
}
```

---

### 4. Reinicie o Frontend

O frontend já está rodando, mas você pode reiniciar se necessário:

```powershell
# Ctrl+C para parar
# Depois:
cd web
npm run dev
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Failed to connect to database"

**Causa:** DATABASE_URL incorreta

**Solução:**
1. Verifique se a senha está correta
2. Verifique se está usando **Connection Pooling** (porta 6543)
3. Teste a conexão no Supabase Dashboard

### Erro: "Invalid token"

**Causa:** SUPABASE_JWT_SECRET incorreto

**Solução:**
1. Copie o JWT Secret correto do Dashboard
2. **NÃO** use o Anon Key (são diferentes!)
3. Reinicie o backend

### Erro: "Port 8080 already in use"

**Solução:**
```powershell
# Encontrar processo usando a porta
netstat -ano | findstr :8080

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

---

## ✅ CHECKLIST

- [ ] `backend/.env` configurado com DATABASE_URL real
- [ ] `backend/.env` configurado com SUPABASE_JWT_SECRET real
- [ ] Backend iniciado sem erros
- [ ] Health check respondendo
- [ ] Frontend consegue acessar `localhost:8080`

---

## 📝 EXEMPLO COMPLETO

**backend/.env:**
```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.ufgpwjgqxjuqfqbfqxqb:minha_senha_123@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://ufgpwjgqxjuqfqbfqxqb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-1234567890

# Server
PORT=8080
ENV=development
```

---

**Depois de configurar, execute:**

```powershell
# Terminal 1 - Backend
cd backend
go run cmd/api/main.go

# Terminal 2 - Frontend (já está rodando)
# Apenas recarregue a página no browser
```

---

**Última Atualização:** 14/12/2025  
**Status:** 🔧 Aguardando Configuração
