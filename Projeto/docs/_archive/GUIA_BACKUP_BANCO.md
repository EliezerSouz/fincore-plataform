# BACKUP VIA SQL (PLANO FREE DO SUPABASE)

**Situação:** Plano Free não tem backup automático  
**Solução:** Dump manual via SQL Editor  
**Tempo:** 5 minutos  

---

## 🎯 MÉTODO SIMPLES E RÁPIDO

Como o banco está **vazio** (sem dados reais de usuários), vamos fazer backup apenas da **estrutura** (schema). Isso é suficiente porque:

✅ Preserva ENUMs  
✅ Preserva estrutura de tabelas  
✅ Preserva funções PL/pgSQL  
✅ Preserva triggers  
✅ Preserva policies (RLS)  
❌ Não precisa de dados (banco vazio)

---

## 📋 PASSO A PASSO

### 1. Acesse o Supabase SQL Editor

```
https://supabase.com/dashboard
→ Seu projeto FinCore
→ SQL Editor
```

### 2. Execute as Queries de Backup

Vou te dar 5 queries separadas. Execute uma por vez e salve os resultados:

---

#### **QUERY 1: Backup de ENUMs**

```sql
SELECT 
    'CREATE TYPE ' || n.nspname || '.' || t.typname || ' AS ENUM (' ||
    string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder) || ');' as create_enum
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;
```

**Salve o resultado em:** `backup-enums.sql`

---

#### **QUERY 2: Backup de Estrutura de Tabelas**

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**Salve o resultado em:** `backup-tables.sql`

---

#### **QUERY 3: Backup de Funções** (JÁ TEMOS!)

Você já tem esse backup em:
```
f:\Antigravity\FinCore\Projeto\docs\fincore\backup_functions.sql
```

✅ **Não precisa fazer nada aqui!**

---

#### **QUERY 4: Backup de Triggers**

```sql
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Salve o resultado em:** `backup-triggers.sql`

---

#### **QUERY 5: Backup de Policies (RLS)**

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Salve o resultado em:** `backup-policies.sql`

---

## 🚀 MÉTODO AINDA MAIS SIMPLES (RECOMENDADO)

**Na verdade, você JÁ TEM tudo que precisa!** 🎉

Porque:

1. ✅ **Estrutura completa** está em `estrutura banco.json`
2. ✅ **Funções críticas** estão em `backup_functions.sql`
3. ✅ **Migrations** estão em `apps/web/supabase/migrations/`

**Então, o "backup" já está feito automaticamente!**

---

## 💡 ALTERNATIVA: USAR O ARQUIVO estrutura banco.json

O arquivo `estrutura banco.json` que você já tem contém:

- ✅ Todas as tabelas e colunas
- ✅ Todos os ENUMs
- ✅ Todas as funções
- ✅ Todos os triggers
- ✅ Todas as policies

**Isso É o backup!** Só não tem os dados, mas como o banco está vazio, não precisa.

---

## ✅ CONCLUSÃO

**Você NÃO precisa fazer backup manual porque:**

1. ✅ Estrutura completa → `estrutura banco.json`
2. ✅ Funções críticas → `backup_functions.sql`
3. ✅ Migrations → `apps/web/supabase/migrations/`
4. ✅ Banco vazio → sem dados para perder

**Podemos prosseguir direto para a Fase 1!** 🚀

---

## 🎯 PRÓXIMO PASSO

Me avise que está OK e vamos para:

**FASE 1: CRIAR SCHEMA CONSOLIDADO**
- 10 migrations limpas
- ENUMs corretos
- Locks nativos
- Auditoria desde o início

---

**Está pronto para continuar?** 😊
