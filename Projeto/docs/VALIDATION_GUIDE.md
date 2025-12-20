# ✅ Guia de Validação - Padronização de Transações

## 🎯 Objetivo

Validar que a padronização de modalidades de pagamento está funcionando corretamente em **TODAS** as telas financeiras.

---

## 📝 Checklist de Validação

### 1️⃣ Tela: Nova Transação

**Caminho:** Caixa → Nova Transação

#### Teste: Despesa
- [ ] Abrir "Nova Transação"
- [ ] Selecionar tipo "Despesa"
- [ ] Verificar campo "Forma de Pagamento"
- [ ] **Validar:** Aparecem APENAS métodos com `allows_expense = true`
- [ ] Selecionar "Cartão de Crédito"
- [ ] **Validar:** Aparece campo "Selecionar Cartão de Crédito" com animação
- [ ] **Validar:** Aparece campo "Parcelas" (1x até 12x)

#### Teste: Receita
- [ ] Mudar tipo para "Receita"
- [ ] **Validar:** Campo "Forma de Pagamento" atualiza automaticamente
- [ ] **Validar:** Aparecem APENAS métodos com `allows_income = true`
- [ ] **Validar:** Se tinha "Cartão de Crédito" selecionado, foi resetado

#### Teste: Transferência
- [ ] Mudar tipo para "Transferência"
- [ ] **Validar:** Campo "Forma de Pagamento" vira "Conta de Destino"
- [ ] **Validar:** Categoria e Subcategoria ficam ocultas
- [ ] **Validar:** Aparece campo "Método (Opcional)" na segunda linha
- [ ] **Validar:** Métodos com `allows_expense = true` aparecem

---

### 2️⃣ Tela: Editar Transação

**Caminho:** Caixa → Transações → Clique em uma transação → Editar

#### Teste: Visual
- [ ] Abrir edição de uma despesa
- [ ] **Validar:** Layout IDÊNTICO à tela de criação
- [ ] **Validar:** Mesmas cores, mesmos espaçamentos
- [ ] **Validar:** Botão "Salvar Alterações" na cor vermelha (despesa)

#### Teste: Dados Pré-preenchidos
- [ ] **Validar:** Valor está correto
- [ ] **Validar:** Descrição está correta
- [ ] **Validar:** Categoria está selecionada
- [ ] **Validar:** Forma de pagamento está selecionada
- [ ] **Validar:** Data está correta

#### Teste: Mudança de Tipo
- [ ] Mudar de "Despesa" para "Receita"
- [ ] **Validar:** Modalidades de pagamento atualizam
- [ ] **Validar:** Se método anterior não é válido para receita, é resetado
- [ ] Salvar e verificar se salvou corretamente

---

### 3️⃣ Teste: Modalidades Dinâmicas

**Caminho:** Sistema → Formas de Pagamento

#### Configuração
- [ ] Criar método "PIX Teste" com:
  - `allows_income = true`
  - `allows_expense = false`
  - `allows_transfer = true`
  - `is_active = true`

#### Validação
- [ ] Ir em "Nova Transação"
- [ ] Tipo "Despesa" → **PIX Teste NÃO aparece**
- [ ] Tipo "Receita" → **PIX Teste APARECE**
- [ ] Tipo "Transferência" → **PIX Teste APARECE** (usa allows_expense, mas vamos validar)

#### Limpeza
- [ ] Desativar "PIX Teste" (`is_active = false`)
- [ ] **Validar:** Não aparece mais em nenhum tipo

---

### 4️⃣ Teste: Cartão de Crédito

**Caminho:** Nova Transação

#### Cenário: Despesa com Cartão
- [ ] Tipo "Despesa"
- [ ] Selecionar "Cartão de Crédito" em Forma de Pagamento
- [ ] **Validar:** Aparece bloco "Selecionar Cartão de Crédito"
- [ ] **Validar:** Bloco tem fundo diferenciado (bg-slate-50)
- [ ] **Validar:** Bloco tem animação de entrada
- [ ] **Validar:** Campo "Parcelas" aparece ao lado de "Data"
- [ ] Selecionar cartão e 3 parcelas
- [ ] Criar transação
- [ ] **Validar:** Transação foi criada com 3 parcelas

#### Cenário: Receita com Cartão
- [ ] Tipo "Receita"
- [ ] **Validar:** "Cartão de Crédito" NÃO aparece nas opções
  - (Ou aparece se `allows_income = true` no método)

---

### 5️⃣ Teste: Consistência Visual

#### Comparação Lado a Lado
- [ ] Abrir "Nova Transação" em uma aba
- [ ] Abrir "Editar Transação" em outra aba
- [ ] **Validar:** Labels têm mesmo estilo (uppercase, text-xs, text-slate-500)
- [ ] **Validar:** Inputs têm mesmo tamanho e sombra
- [ ] **Validar:** Botões têm mesmas cores por tipo
- [ ] **Validar:** Espaçamentos são idênticos

---

### 6️⃣ Teste: Permissões

**Caminho:** Nova Transação (usuário FREE)

#### Transferências
- [ ] Clicar em "Transferir"
- [ ] **Validar:** Aparece alerta "Exclusivo para Premium"
- [ ] **Validar:** Tipo NÃO muda para transferência
- [ ] **Validar:** Ícone de cadeado aparece no botão

#### Múltiplos Cartões
- [ ] Selecionar "Cartão de Crédito"
- [ ] Abrir dropdown de cartões
- [ ] **Validar:** Apenas cartão primário está habilitado
- [ ] **Validar:** Outros cartões mostram "(Inativo)"

---

## 🐛 Problemas Comuns

### Modalidades não aparecem
**Causa:** `is_active = false` no banco  
**Solução:** Ativar o método em Sistema → Formas de Pagamento

### Cartão não aparece
**Causa:** Método não tem `slug = 'credit_card'`  
**Solução:** Verificar cadastro do método

### Visual diferente entre criar e editar
**Causa:** Componente não está usando o form base  
**Solução:** Verificar se está importando `FinancialTransactionForm`

---

## ✅ Critérios de Sucesso

Para considerar a validação **APROVADA**, todos os itens devem estar ✅:

- [ ] Modalidades filtradas corretamente por tipo
- [ ] Visual 100% idêntico entre criar e editar
- [ ] Cartão de crédito funciona com animação
- [ ] Permissões bloqueiam corretamente
- [ ] Mudança de tipo atualiza modalidades
- [ ] Dados pré-preenchidos corretamente na edição

---

## 📊 Relatório de Bugs

Se encontrar problemas, documente aqui:

### Bug #1
**Tela:** _______________  
**Descrição:** _______________  
**Passos para reproduzir:** _______________  
**Comportamento esperado:** _______________  
**Comportamento atual:** _______________  

---

**Data da validação:** __________  
**Validado por:** __________  
**Status:** ⬜ Pendente | ⬜ Em Progresso | ⬜ Aprovado | ⬜ Reprovado
