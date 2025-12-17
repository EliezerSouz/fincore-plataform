# 🚀 Financeiro API - Backend Golang

API REST completa para o sistema Financeiro Platform.

---

## 📋 Tecnologias

- **Linguagem:** Go 1.21+
- **Framework:** Gin (HTTP Router)
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase JWT
- **Driver:** pgx/v5

---

## 🏗️ Arquitetura

```
Clean Architecture

cmd/
  api/
    main.go                 # Entry point

internal/
  entity/                   # Domain entities
    account.go
    transaction.go
    category.go
    user.go
  
  infra/
    database/               # Database connection
    repository/             # Data access layer
    handler/                # HTTP handlers
      middleware/           # Auth, CORS, etc
```

---

## 🔧 Setup

### 1. Instalar dependências

```bash
cd backend
go mod download
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Supabase:

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=8080
```

### 3. Executar

```bash
go run cmd/api/main.go
```

Ou com hot reload (usando air):

```bash
# Instalar air
go install github.com/cosmtrek/air@latest

# Executar
air
```

---

## 📡 Endpoints Disponíveis

### Health Check

```
GET /ping
GET /health
```

### Accounts (Contas)

```
GET    /api/accounts           # Listar contas
GET    /api/accounts/:id       # Buscar conta
POST   /api/accounts           # Criar conta
PUT    /api/accounts/:id       # Atualizar conta
DELETE /api/accounts/:id       # Deletar conta
```

### Transactions (Transações)

```
GET    /api/transactions       # Listar transações (com paginação)
GET    /api/transactions/:id   # Buscar transação
POST   /api/transactions       # Criar transação
PUT    /api/transactions/:id   # Atualizar transação
DELETE /api/transactions/:id   # Deletar transação
```

### Em Desenvolvimento

- Categories
- Credit Cards
- Invoices
- Payables
- Dashboard

---

## 🔐 Autenticação

Todas as rotas `/api/*` requerem autenticação via JWT do Supabase.

**Header:**
```
Authorization: Bearer <supabase_jwt_token>
```

O token é obtido automaticamente pelo frontend após login no Supabase.

---

## 📝 Exemplos de Uso

### Criar uma conta

```bash
curl -X POST http://localhost:8080/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Corrente",
    "type": "conta_corrente",
    "balance": 1000.00
  }'
```

### Criar uma transação

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "uuid-da-conta",
    "description": "Salário",
    "amount": 5000.00,
    "type": "receita",
    "date": "2025-12-14T00:00:00Z"
  }'
```

### Listar transações com paginação

```bash
curl http://localhost:8080/api/transactions?limit=20&offset=0 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Features Implementadas

### ✅ Accounts
- [x] CRUD completo
- [x] Soft delete (is_active)
- [x] Validações
- [x] Segurança por user_id

### ✅ Transactions
- [x] CRUD completo
- [x] Atualização automática de saldo
- [x] Transações atômicas (BEGIN/COMMIT)
- [x] Paginação
- [x] Validações
- [x] Segurança por user_id

### 🚧 Em Desenvolvimento
- [ ] Categories
- [ ] Credit Cards
- [ ] Invoices
- [ ] Payables
- [ ] Dashboard summary
- [ ] Relatórios

---

## 🔄 Integração com Frontend

O frontend Next.js deve fazer requisições para:

```typescript
// Exemplo
const response = await fetch('http://localhost:8080/api/accounts', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 🚀 Deploy

### Opção 1: Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o main cmd/api/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

### Opção 2: Render/Railway/Fly.io

Configure as variáveis de ambiente e faça deploy direto do repositório.

---

## 📊 Performance

- **Conexão Pool:** pgx com pool de conexões
- **Transações Atômicas:** Garantia de consistência
- **Queries Otimizadas:** Índices no banco
- **Paginação:** Evita sobrecarga

---

## 🧪 Testes (TODO)

```bash
go test ./...
```

---

## 📚 Próximos Passos

1. ✅ Implementar Categories endpoints
2. ✅ Implementar Credit Cards endpoints
3. ✅ Implementar Invoices endpoints
4. ✅ Implementar Payables endpoints
5. ✅ Adicionar testes unitários
6. ✅ Adicionar cache (Redis)
7. ✅ Adicionar logs estruturados
8. ✅ Adicionar métricas (Prometheus)

---

**Versão:** 1.0.0  
**Status:** 🟢 Em Desenvolvimento Ativo  
**Última Atualização:** 14/12/2025
