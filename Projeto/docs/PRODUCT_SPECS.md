# 📘 Modelagem de Produto: Planos Free vs Premium (SaaS Financeiro)

Este documento define as regras de negócio, limitações e diferenciais entre os planos **FREE** (Gratuito / Trial) e **PREMIUM** (Assinatura) do sistema.
O objetivo é garantir uma experiência de entrada sem atrito, incentivando a conversão através de funcionalidades avançadas e personalização.

---

## 🏗️ Princípios Gerais
1.  **Integridade de Dados:** Funcionalidades críticas (como estornos e consistência de saldo) **NUNCA** são bloqueadas. Um usuário Free não pode ter o saldo errado por limitação do plano.
2.  **Crescimento:** O Free é limitado por **Volume** e **Conveniência**, não por funcionalidades essenciais.
3.  **Upsell Visual:** Recursos bloqueados devem ser visíveis (botões desabilitados ou modais) para gerar desejo de upgrade.

---

## 1. Categorias e Organização

| Funcionalidade | Plano FREE (Básico) | Plano PREMIUM (PRO) |
| :--- | :--- | :--- |
| **Criação** | **Bloqueado.** Não pode criar novas categorias. | **Ilimitado.** |
| **Edição** | **Bloqueado.** Não pode editar nomes/ícones. | **Total.** Edita nome, cor e ícone. |
| **Exclusão** | **Bloqueado.** | **Permitido.** (Exceto categorias de sistema). |
| **Subcategorias** | Usa apenas os padrões do sistema. | Cria subcategorias personalizadas. |
| **Cores** | Cores padrão do sistema. | Paleta de cores completa. |

> **Regra de Implementação:** O botão "Nova Categoria" deve abrir um modal de Upsell para usuários Free.

---

## 2. Cartões de Crédito

| Funcionalidade | Plano FREE (Básico) | Plano PREMIUM (PRO) |
| :--- | :--- | :--- |
| **Quantidade** | **Máximo de 2 cartões.** | **Ilimitado.** |
| **Projeção** | Visualiza fatura atual e próxima (D+30). | **Projeção anual (D+360).** |
| **Parcelamento** | Simulação básica. | Simulação avançada com impacto no orçamento. |
| **Melhor Dia** | Informativo simples. | Sugestão inteligente de compra baseada no fechamento. |

> **Regra de Implementação:** Ao tentar criar o 3º cartão, o sistema bloqueia e oferece o Premium.

---

## 3. Contas a Pagar (Payables)

| Funcionalidade | Plano FREE (Básico) | Plano PREMIUM (PRO) |
| :--- | :--- | :--- |
| **Volume** | Ilimitado (para não quebrar o uso). | Ilimitado. |
| **Recorrência** | Apenas "Mensal Fixa" ou "Única". | **Avançada:** Quinzenal, Semestral, Personalizada. |
| **Anexos** | Não permite anexos. | Upload de boletos/comprovantes (PDF/Img). |
| **Notificações** | Apenas no dia do vencimento. | Configurável (3 dias antes, atraso, etc). |

---

## 4. Relatórios e Inteligência (AI)

| Funcionalidade | Plano FREE (Básico) | Plano PREMIUM (PRO) |
| :--- | :--- | :--- |
| **Histórico** | Visualiza últimos **90 dias**. | **Histórico Completo (Vitalício).** |
| **Insights AI** | Mensagens estáticas/regras simples. | **Análise Generativa (LLM).** Dicas reais baseadas no perfil. |
| **Comparativos** | Mês Atual vs Mês Anterior. | Análise Sazonal (Ano x Ano), Categoria x Categoria. |
| **Exportação** | PDF Simples (Resumo). | Excel, CSV e PDF Detalhado. |

---

## 5. Funcionalidades Críticas (Regras de Ouro)
*Recursos que funcionam IGUAL para ambos os planos para garantir a integridade.*

*   **Estorno de Pagamento:** Ao estornar uma fatura paga, o sistema **SEMPRE** apaga a transação de despesa correspondente e recalcula o saldo, independente do plano.
*   **Gestão de Saldo:** O cálculo de saldo em contas bancárias é sempre preciso.
*   **Login/Segurança:** Mesmos níveis de criptografia e proteção.

---

## 🛠️ Plano de Implementação Técnica (Sugestão)

### Banco de Dados (Supabase)
Criar funções de validação no PostgreSQL para garantir integridade mesmo se o frontend for burlado.

```sql
-- Exemplo conceitual de Policy
CREATE POLICY "Premium users can create categories"
ON categories FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE subscription_plan = 'premium')
);
```

### Frontend (Componentes)
Criar um wrapper ou hook `usePlan()` para facilitar as verificações na UI.

```tsx
const { isPremium } = usePlan();

// Exemplo de uso
<Button onClick={isPremium ? handleCreate : showUpsellModal}>
  Novo Cartão
</Button>
```
