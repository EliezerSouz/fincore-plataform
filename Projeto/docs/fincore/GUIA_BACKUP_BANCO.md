# GUIA RÁPIDO: BACKUP DO BANCO DE DADOS

**Tempo estimado:** 2-3 minutos  
**Dificuldade:** Fácil  
**Obrigatório:** SIM ⚠️

---

## OPÇÃO 1: BACKUP VIA SUPABASE DASHBOARD (RECOMENDADO)

### Passo a Passo

1. **Acesse o Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Faça login** com sua conta

3. **Selecione o projeto FinCore**
   - Clique no projeto na lista

4. **Vá para a seção de Backups**
   ```
   Database > Backups
   ```

5. **Crie um novo backup**
   - Clique em **"Create Backup"** ou **"New Backup"**
   - Nome sugerido: `backup-pre-refactor-20251223`
   - Descrição: "Backup antes de refatoração completa do banco"

6. **Aguarde a conclusão**
   - O backup pode levar 1-2 minutos
   - Você verá uma barra de progresso

7. **Confirme o backup**
   - Verifique se o backup aparece na lista
   - Status deve estar como "Completed" ou "Success"

8. **(OPCIONAL) Baixe o SQL dump**
   - Clique nos 3 pontinhos ao lado do backup
   - Selecione "Download"
   - Salve em: `f:\Antigravity\FinCore\Backups\`

---

## OPÇÃO 2: BACKUP VIA pg_dump (AVANÇADO)

Se você preferir fazer backup via linha de comando:

### Windows (PowerShell)

```powershell
# 1. Criar pasta de backups
New-Item -ItemType Directory -Force -Path "f:\Antigravity\FinCore\Backups"

# 2. Definir variáveis (SUBSTITUA COM SUAS CREDENCIAIS)
$DB_HOST = "db.XXXXXXXXXXXXXXXX.supabase.co"
$DB_NAME = "postgres"
$DB_USER = "postgres"
$DB_PASSWORD = "SUA_SENHA_AQUI"
$BACKUP_FILE = "f:\Antigravity\FinCore\Backups\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

# 3. Fazer backup (requer pg_dump instalado)
$env:PGPASSWORD = $DB_PASSWORD
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE

# 4. Verificar
if (Test-Path $BACKUP_FILE) {
    Write-Host "✅ Backup criado com sucesso: $BACKUP_FILE" -ForegroundColor Green
    $size = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host "📦 Tamanho: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao criar backup" -ForegroundColor Red
}
```

### Como obter as credenciais do Supabase:

1. Acesse: `https://supabase.com/dashboard`
2. Selecione seu projeto
3. Vá em: `Settings > Database`
4. Copie:
   - **Host:** `db.XXXXXXXXXXXXXXXX.supabase.co`
   - **Database name:** `postgres`
   - **User:** `postgres`
   - **Password:** (clique em "Reset database password" se não souber)

---

## OPÇÃO 3: BACKUP VIA SUPABASE CLI (INTERMEDIÁRIO)

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
cd f:\Antigravity\FinCore\Projeto\apps\web
supabase link --project-ref SEU_PROJECT_REF

# 4. Fazer backup
supabase db dump -f f:\Antigravity\FinCore\Backups\backup-$(date +%Y%m%d-%H%M%S).sql
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após fazer o backup, verifique:

- [ ] Backup aparece no Supabase Dashboard
- [ ] Status do backup é "Completed" ou "Success"
- [ ] Data/hora do backup está correta
- [ ] (Opcional) Arquivo SQL foi baixado localmente
- [ ] (Opcional) Tamanho do arquivo é razoável (> 100 KB)

---

## 🚨 EM CASO DE PROBLEMA

### Erro: "Insufficient permissions"
**Solução:** Verifique se você é o owner do projeto no Supabase

### Erro: "pg_dump not found"
**Solução:** Instale PostgreSQL client tools:
```
https://www.postgresql.org/download/windows/
```

### Erro: "Connection timeout"
**Solução:** Verifique se o IP está na whitelist do Supabase:
```
Settings > Database > Connection Pooling > Add your IP
```

---

## 📞 PRÓXIMOS PASSOS

Após fazer o backup:

1. ✅ Marque como concluído no `PLANO_B_EXECUCAO.md`
2. ✅ Me avise que o backup foi feito
3. ✅ Vamos iniciar a Fase 1: Schema Consolidado

---

**Última atualização:** 23/12/2025 00:07  
**Tempo estimado:** 2-3 minutos  
**Prioridade:** 🔴 CRÍTICA
