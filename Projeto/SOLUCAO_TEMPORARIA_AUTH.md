# 🚨 SOLUÇÃO TEMPORÁRIA: Desabilitar Autenticação

## ⚠️ IMPORTANTE
Esta é uma solução **TEMPORÁRIA** apenas para **TESTAR** o sistema.
**NÃO USE EM PRODUÇÃO!**

---

## 🎯 O Que Vamos Fazer

Vamos criar um middleware que **aceita qualquer token** temporariamente, permitindo que você teste o sistema enquanto investigamos o problema real do JWT.

---

## 📝 PASSO A PASSO

### 1. Criar Arquivo de Bypass

Crie o arquivo: `backend/internal/infra/middleware/auth_bypass.go`

```go
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthBypass - TEMPORÁRIO: Bypass de autenticação para testes
// TODO: REMOVER ANTES DE PRODUÇÃO!
func AuthBypass() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Usar um UUID fixo para testes
		testUserID := "00000000-0000-0000-0000-000000000001" // Substitua pelo UUID do seu usuário
		
		// Definir o user_id no contexto
		c.Set("user_id", testUserID)
		
		c.Next()
	}
}
```

### 2. Atualizar main.go

No arquivo `backend/cmd/api/main.go`, encontre onde o middleware de auth é usado e **comente** temporariamente:

```go
// ANTES (com auth):
api.Use(middleware.AuthMiddleware(supabaseClient))

// DEPOIS (bypass temporário):
api.Use(middleware.AuthBypass()) // TEMPORÁRIO - REMOVER DEPOIS!
// api.Use(middleware.AuthMiddleware(supabaseClient)) // Comentado temporariamente
```

### 3. Atualizar UUID do Usuário

No arquivo `auth_bypass.go`, substitua o UUID pelo **UUID real do seu usuário**:

```sql
-- Execute no Supabase SQL Editor para pegar o UUID:
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

Copie o UUID e cole no `auth_bypass.go`.

### 4. Reiniciar Backend

```bash
# Pare o backend (Ctrl+C)
cd backend
go run cmd/api/main.go
```

### 5. Testar

Recarregue o frontend (F5) e teste!

---

## ✅ DEPOIS QUE FUNCIONAR

Quando o sistema estiver funcionando e você quiser voltar para autenticação real:

1. **Reverta** as mudanças no `main.go`
2. **Delete** o arquivo `auth_bypass.go`
3. **Investigue** o problema do JWT com calma

---

## 🎯 ALTERNATIVA MAIS RÁPIDA

Se não quiser criar arquivo novo, pode simplesmente **comentar a validação** no middleware existente.

Encontre o arquivo do middleware de auth e comente a parte que valida o token.

---

**Quer que eu crie os arquivos para você ou prefere fazer manualmente?** 🚀
