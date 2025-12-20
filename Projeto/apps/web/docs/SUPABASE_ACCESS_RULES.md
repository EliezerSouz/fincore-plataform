# Diretrizes de Banco de Dados (Supabase)

## Criação de Tabelas e Permissões

**REGRA DE OURO:** Sempre que criar uma nova tabela, você deve explicitamente definir as permissões de acesso. O Supabase (PostgreSQL) nega acesso por padrão (deny-all) se o RLS for ativado ou se as permissões não forem concedidas.

### 1. Tabelas Públicas (Dados do Sistema)
Para tabelas que contêm dados estáticos ou públicos (ex: `payment_methods`, `categories`, `subcategories`, `plan_types`), que devem ser lidos por qualquer usuário logado ou até anônimo:

**Opção A (Simples - Sem RLS):**
Se não há dados sensíveis de usuários misturados, desabilite o RLS e garanta os Grants.
```sql
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;

GRANT SELECT ON nome_da_tabela TO anon;
GRANT SELECT ON nome_da_tabela TO authenticated;
GRANT SELECT ON nome_da_tabela TO service_role;
```

**Opção B (Com RLS - Mais Seguro):**
Se preferir manter RLS ativado:
```sql
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
CREATE POLICY "Leitura pública" ON nome_da_tabela FOR SELECT USING (true);

-- E não esqueça dos Grants básicos de uso
GRANT SELECT ON nome_da_tabela TO anon;
GRANT SELECT ON nome_da_tabela TO authenticated;
```

### 2. Tabelas de Usuário (Dados Privados)
Para tabelas com dados de usuários (ex: `transactions`, `accounts`):

```sql
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Policy vinculada ao ID do usuário
CREATE POLICY "Usuário vê apenas seus dados" 
ON nome_da_tabela 
FOR ALL 
USING (auth.uid() = user_id);

-- Grants básicos são necessários para que o usuário consiga sequer tentar acessar
GRANT ALL ON nome_da_tabela TO authenticated;
GRANT ALL ON nome_da_tabela TO service_role;
```

### Resumo do Workflow de Criação
1. `CREATE TABLE ...`
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (Recomendado)
3. `CREATE POLICY ...` (Definir quem vê o quê)
4. **CRÍTICO:** `GRANT SELECT, INSERT, UPDATE, DELETE ON ... TO authenticated;` (Sem isso, erro 42501 Permission Denied)
