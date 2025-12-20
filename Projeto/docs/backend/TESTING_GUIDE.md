# 🧪 Guia de Testes - Financeiro Platform

**Data:** 14/12/2025  
**Versão:** 1.0.0

---

## 🚀 INICIAR AMBIENTE

### Opção 1: Script Automático (Recomendado)

```powershell
.\start-dev.ps1
```

Este script inicia:
- ✅ Backend (Golang) em `http://localhost:8080`
- ✅ Frontend (Next.js) em `http://localhost:3000`

### Opção 2: Manual

#### Terminal 1 - Backend:
```powershell
cd backend
go run cmd/api/main.go
```

#### Terminal 2 - Frontend:
```powershell
cd web
npm run dev
```

---

## ⚙️ CONFIGURAÇÃO NECESSÁRIA

### 1. Backend (.env)

Edite `backend/.env` com suas credenciais do Supabase:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=8080
```

### 2. Frontend (.env.local)

Já deve estar configurado em `web/.env.local`

---

## 🧪 TESTES BÁSICOS

### 1. Health Check do Backend

```bash
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

### 2. Testar Frontend

Acesse: `http://localhost:3000`

- ✅ Deve carregar a página de login
- ✅ Faça login com suas credenciais
- ✅ Navegue pelas páginas

---

## 🔐 OBTER TOKEN PARA TESTES

### Via Browser (DevTools):

1. Faça login no frontend
2. Abra DevTools (F12)
3. Console:
```javascript
// Obter token do Supabase
const { data } = await supabase.auth.getSession()
console.log(data.session.access_token)
```

4. Copie o token

---

## 📡 TESTAR ENDPOINTS DA API

### 1. Listar Contas

```bash
curl http://localhost:8080/api/accounts \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 2. Criar Conta

```bash
curl -X POST http://localhost:8080/api/accounts \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Teste",
    "type": "conta_corrente",
    "balance": 1000.00
  }'
```

### 3. Listar Transações

```bash
curl http://localhost:8080/api/transactions?limit=10 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Criar Transação

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "uuid-da-conta",
    "description": "Teste de transação",
    "amount": 100.00,
    "type": "receita",
    "date": "2025-12-14T00:00:00Z"
  }'
```

---

## 🔍 VERIFICAR LOGS

### Backend:
Os logs aparecem no terminal onde o backend está rodando.

### Frontend:
Os logs aparecem no terminal onde o frontend está rodando.

### Browser:
Abra DevTools (F12) → Console para ver logs do frontend.

---

## ⚡ TESTAR PERFORMANCE

### Antes (Supabase Direto):
1. Acesse a página de transações
2. Observe o tempo de carregamento
3. Abra Network tab (DevTools)

### Depois (Com Backend):
1. Migre o código para usar a API
2. Compare o tempo de resposta
3. Deve ser mais rápido!

---

## 🐛 TROUBLESHOOTING

### Backend não inicia:

**Erro: "Failed to connect to database"**
- ✅ Verifique `DATABASE_URL` no `.env`
- ✅ Teste conexão com o banco

**Erro: "Invalid token"**
- ✅ Verifique `SUPABASE_JWT_SECRET` no `.env`
- ✅ Obtenha o secret correto do Supabase Dashboard

### Frontend não conecta ao Backend:

**Erro: "CORS"**
- ✅ Verifique se o backend está rodando
- ✅ CORS já está configurado no middleware

**Erro: "Network Error"**
- ✅ Verifique se o backend está em `http://localhost:8080`
- ✅ Verifique firewall

---

## 📊 ENDPOINTS DISPONÍVEIS

### Accounts
```
GET    /api/accounts           # Listar
GET    /api/accounts/:id       # Buscar
POST   /api/accounts           # Criar
PUT    /api/accounts/:id       # Atualizar
DELETE /api/accounts/:id       # Deletar
```

### Transactions
```
GET    /api/transactions       # Listar (paginado)
GET    /api/transactions/:id   # Buscar
POST   /api/transactions       # Criar
PUT    /api/transactions/:id   # Atualizar
DELETE /api/transactions/:id   # Deletar
```

---

## ✅ CHECKLIST DE TESTES

### Backend:
- [ ] Health check responde
- [ ] Conexão com banco funciona
- [ ] Auth middleware valida tokens
- [ ] Endpoints de accounts funcionam
- [ ] Endpoints de transactions funcionam
- [ ] Saldo é atualizado automaticamente
- [ ] Erros retornam mensagens claras

### Frontend:
- [ ] Página carrega
- [ ] Login funciona
- [ ] Navegação funciona
- [ ] Dados são exibidos
- [ ] Formulários funcionam
- [ ] Erros são tratados

### Integração:
- [ ] Frontend se conecta ao backend
- [ ] Token é enviado corretamente
- [ ] Dados são salvos no banco
- [ ] Performance melhorou
- [ ] Sem erros de CORS

---

## 🎯 PRÓXIMOS PASSOS

Após validar que tudo funciona:

1. ✅ Migrar mais endpoints (Categories, Cards, etc)
2. ✅ Atualizar frontend para usar API
3. ✅ Adicionar testes automatizados
4. ✅ Preparar para deploy

---

## 📞 COMANDOS ÚTEIS

### Parar todos os processos:
```powershell
# Se usando start-dev.ps1
Ctrl+C

# Se manual
Ctrl+C em cada terminal
```

### Verificar portas em uso:
```powershell
netstat -ano | findstr :8080
netstat -ano | findstr :3000
```

### Limpar cache do Go:
```powershell
go clean -cache
```

### Reinstalar dependências do npm:
```powershell
cd web
rm -rf node_modules
npm install
```

---

**Última Atualização:** 14/12/2025  
**Status:** ✅ Pronto para Testes
