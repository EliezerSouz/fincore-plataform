# 📘 PADRÃO OFICIAL DE DADOS — FINCORE

## 📌 Princípio Central

> **Dados técnicos são padronizados.**  
> **Dados humanos são preservados.**  
> **Formatação é responsabilidade da UI, não do banco.**

---

## 🔹 Classificação de Dados

### ✅ Dados Técnicos (UPPERCASE obrigatório)

Devem ser armazenados **sempre em UPPERCASE** no banco de dados:

- Enums  
- Status  
- Tipos  
- Códigos  
- Identificadores sem semântica humana  

**Exemplos de campos:**

- `status`
- `type`
- `category_code`
- `payment_method`
- `currency`
- `source`
- `origin`
- `kind`

**Motivos:**

- Previsibilidade  
- Consistência  
- Facilidade de comparação  
- Integridade lógica  

---

### ❌ Dados Humanos (NUNCA forçar UPPERCASE)

Devem ser armazenados **exatamente como o usuário digitou**:

- Nome de pessoas  
- Descrição de transações  
- Nome de contas  
- Observações  
- Títulos exibidos ao usuário  
- Textos livres  

**Motivos:**

- Melhor experiência do usuário (UX)  
- Legibilidade  
- Exportação de dados (CSV / PDF)  
- Uso futuro com IA  
- Integrações externas  

---

### ⚠️ Dados Híbridos (tratar com cuidado)

Campos que possuem semântica humana, mas também são usados para busca:

- Nome de banco  
- Nome de cartão  
- Nome de categoria customizada  

**Regras:**

- Salvar como texto normal (sem forçar UPPERCASE)
- Normalizar apenas para busca e comparação

Exemplos de técnicas:
- `LOWER()`
- `UNACCENT()`

---

## 🔹 Busca e Comparação

❌ **Não usar UPPERCASE como estratégia de busca**

✅ Utilizar:

- `ILIKE`
- `LOWER()`
- Collation case-insensitive
- Índices funcionais

---

## 🔹 Formatação por Camada

- **Banco de Dados:**  
  Armazena o dado cru, sem formatação visual

- **Backend:**  
  Responsável por validação e regras de domínio

- **Frontend (UI):**  
  Responsável por formatação visual  
  (Title Case, máscaras, capitalização, etc.)

---

> Este padrão garante consistência técnica, boa experiência do usuário  
> e escalabilidade para integrações futuras e uso de IA.
