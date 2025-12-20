#!/bin/bash

# Script de Deploy Automatizado para VPS

echo "🚀 Iniciando Deploy do Financeiro Platform..."

# 1. Atualizar código
echo "📥 Puxando últimas alterações do Git..."
git pull origin main

# 2. Reconstruir containers
echo "🛠️ Reconstruindo containers Docker (isso pode levar alguns minutos)..."
docker-compose up -d --build

# 3. Limpar imagens antigas (opcional para economizar espaço)
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️ Backend: http://localhost:8080"
