# 📊 Estratégia de Categorias Híbridas (DRE Pessoal)

**Data**: 26/12/2025
**Módulo**: Gestão Financeira / Contabilidade Gerencial

---

## 🎯 Conceito
Implementamos no FinCore o conceito de **Domínio Econômico** vs **Fluxo de Caixa**.

*   **Categoria (Domínio)**: Representa o *contexto* (ex: "Impressão 3D", "Carro", "Apartamento").
*   **Transação (Fluxo)**: Representa a *direção do dinheiro* (Receita ou Despesa).

Isso permite que você tenha categorias "Híbridas" (Ambas), gerando um demonstrativo de resultado (Lucro/Prejuízo) por item.

---

## 🛠️ Como Utilizar

### 1. Criar Categoria Híbrida
Ao criar uma nova categoria, selecione a opção **"Híbrida"**.
Use isso para projetos, fontes de renda com custos atrelados ou bens que geram despesa e renda.

**Exemplos Reais:**

| Categoria | Tipo | Exemplo de Receita | Exemplo de Despesa |
| :--- | :--- | :--- | :--- |
| **Carro** | Híbrida | Carona remunerada / Venda | Gasolina, IPVA, Manutenção |
| **Impressão 3D** | Híbrida | Venda de peças | Filamento, Energia, Peças |
| **Airbnb / Aluguel** | Híbrida | Recebimento de aluguel | Condomínio, IPTU, Reparos |
| **Cartão de Crédito** | Híbrida | Cashback, Estorno | Pagamento de Fatura, Anuidade |

### 2. Lançar Transações
*   Quando for lançar uma **Receita**, a categoria híbrida aparecerá na lista.
*   Quando for lançar uma **Despesa**, a mesma categoria também aparecerá.
*   O sistema exibirá um aviso visual: *"Categoria híbrida: utilizada para Receitas e Despesas"*.

### 3. Análise de Resultado (Futuro)
Com essa estrutura, os relatórios poderão agrupar por Categoria e mostrar:
*   (+) Total Entradas
*   (-) Total Saídas
*   **(=) Resultado Líquido**

Isso transforma sua gestão financeira em uma contabilidade de negócio, permitindo ver quais "setores" da sua vida dão lucro ou prejuízo.

---

## ✅ Status da Implementação

- [x] **Banco de Dados**: Compatível (sem restrições de enum).
- [x] **Backend**:
    - Entidade aceita tipo 'ambas'.
    - Listagem retorna híbridas para filtros de receita e despesa.
- [x] **Frontend**:
    - Criação de Categoria: Botão "Híbrida" adicionado.
    - Transações: Filtro exibe híbridas corretamente.
    - UI: Indicadores visuais de categoria híbrida.
