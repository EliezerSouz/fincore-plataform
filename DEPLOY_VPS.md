---
description: Deploy do projeto em uma VPS usando Docker
---

# 🚀 Guia de Deploy VPS (Docker)

Siga estes passos para colocar o projeto online em sua VPS.

## 1. Pré-requisitos na VPS
Certifique-se de que sua VPS tenha instalado:
- **Docker**
- **Docker Compose**
- **Git**

## 2. Preparação dos Arquivos
No seu computador local, certifique-se de que os arquivos `.env` existem e estão configurados:
- `backend/.env` (Contendo `GROQ_API_KEY`, Supabase Vars, etc)
- `apps/web/.env.local` (Contendo as variáveis de cliente do Supabase)

## 3. Clonar e Configurar
Na sua VPS, clone o repositório e configure as variáveis de ambiente:

```bash
git clone <seu-repositorio> financeiro
cd financeiro

# Copie os arquivos de exemplo para os reais e ajuste os valores
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env.local
```

> **IMPORTANTE**: No arquivo `apps/web/.env.local` da VPS, o `NEXT_PUBLIC_API_URL` deve apontar para o domínio ou IP da sua VPS (Ex: `http://123.456.78.9:8080`).

## 4. Executar o Deploy
Basta rodar o comando do Docker Compose:

```bash
docker-compose up -d --build
```

## 5. Acesso
- **Frontend**: http://seu-ip-vps:3000
- **Backend API**: http://seu-ip-vps:8080

---

## 💡 Dicas Adicionais

### Usando Nginx para Domínio e HTTPS
É altamente recomendável usar um Nginx como Proxy Reverso para usar domínios (Ex: `app.meufinanceiro.com`) e SSL (HTTPS).

**Exemplo de config Nginx:**
```nginx
server {
    listen 80;
    server_name app.meufinanceiro.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Atualização Automática
Para atualizar o código na VPS:
```bash
git pull origin main
docker-compose up -d --build
```
