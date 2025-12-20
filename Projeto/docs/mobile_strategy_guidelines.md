# Estratégia Web First & Mobile Ready - FinCore

**Versão:** 1.0
**Data:** 19/12/2025
**Contexto:** Preparação da arquitetura e UX/UI da aplicação Web (Next.js) para futura expansão Mobile (Android/iOS) sem retrabalho.

---

## 1️⃣ DEFINIR ESTRATÉGIA WEB FIRST / MOBILE READY

O princípio central é: **"A Web é apenas uma viewport grande do Mobile."**

### O que pensar AGORA (Obrigatório)
*   **Touch Targets (Alvos de Toque):** Todo elemento clicável deve ter no mínimo **44x44px** (área de toque), mesmo no desktop. Botões pequenos no mouse são impossíveis no dedo.
*   **Independência do Hover:** Nenhuma informação crítica ou ação primária pode depender de `hover`. No mobile, hover não existe. Se existe um tooltip, ele deve ser acessível via clique/toque (ícone de `info`).
*   **Inputs Financeiros:** Inputs de moeda devem prevenir zoom automático no mobile (font-size >= 16px) e usar `inputmode="decimal"` para abrir o teclado numérico correto.
*   **Feedback Visual:** O estado `active` (pressionado) é mais importante que o `hover`. O usuário precisa sentir que tocou na tela.

### O que fica para a fase Mobile
*   **Gestos Nativos:** Swipe-to-delete, Pull-to-refresh, Biometria. Na web, usamos botões explícitos e loaders convencionais.
*   **Notificações Push:** Na web usamos Toasts/Snackbars; no mobile usaremos o sistema operacional.
*   **Deep Linking:** Configuração de rotas profundas para abrir o app direto.

### O que NUNCA fazer (Tech Debt Prevention)
*   **Tabelas "Excel-like":** Nunca crie tabelas com muitas colunas que exigem scroll horizontal como única forma de visualização. Elas são inavegáveis no celular.
*   **Modais Aninhados:** Evite "Modal dentro de Modal". No mobile isso quebra a UX. Use fluxos de navegação ou Bottom Sheets empilhados.
*   **Layouts de Coluna Fixa:** Nunca assuma que haverá espaço lateral. O layout deve ser fluido (100% width) com `max-width` para telas grandes.

---

## 2️⃣ PADRÃO DE TELA COMPARTILHÁVEL (WEB → MOBILE)

Definimos o **"Scaffold Universal"** que se adapta sem mudar a estrutura do DOM.

### Estrutura Base
1.  **Header (Contexto):** Título da página + Ações Secundárias (Filtro, Busca).
    *   *Web:* Topo da área de conteúdo.
    *   *Mobile:* Navbar nativa ou topo fixo.
2.  **Body (Conteúdo):** Área scrollável.
3.  **Footer (Ação Primária):** Onde vive o botão principal ("Salvar", "Nova Transação").
    *   *Web:* Pode flutuar no canto inferior direito ou ser fixo no rodapé do modal/página.
    *   *Mobile:* **Sticky Bottom**. Sempre visível, fixo na parte inferior da tela (Thumb Zone).

### Adaptação de Componentes
| Elemento | Web (Desktop) | Mobile (Adaptação Responsiva) |
| :--- | :--- | :--- |
| **Navegação** | Sidebar Lateral (Esquerda) | Bottom Navigation ou Hamburger Menu |
| **Tabs** | Abas no topo do conteúdo | Segmented Control ou Bottom Navigation |
| **Modais** | Dialog Centralizado | **Bottom Sheet** (Gaveta que sobe de baixo) |
| **Filtros** | Popover ou Sidebar na tabela | Bottom Sheet de Filtros |
| **Tabelas** | Grid com colunas | Lista de Cards (Row Items) |

---

## 3️⃣ DASHBOARD PENSADO PARA MOBILE

O Dashboard deve responder a duas perguntas em 3 segundos: "Quanto eu tenho?" e "Gastei muito?".

### Estrutura
1.  **Saldo Total (Hero):** Destaque absoluto.
    *   *Web:* Card grande no topo.
    *   *Mobile:* Card no topo, ocupando 100% da largura.
2.  **Resumo Mensal (Gráfico):**
    *   *Manutenção:* O gráfico de linha/barra deve permitir "scrubbing" (arrastar o dedo para ver valores) no mobile, não apenas hover.
    *   *Adaptação:* No desktop, o gráfico pode ter legendas laterais. No mobile, as legendas vão para baixo ou viram um modal de detalhes ao tocar.
3.  **Atalhos Rápidos:**
    *   *Web:* Botões ou Links laterais.
    *   *Mobile:* Carrossel horizontal (Scroll X) de ícones grandes.

### Lógica
*   **Cards Isolados:** Cada widget (Receita, Despesa, Cartão) deve ser um componente isolado que busca seus próprios dados ou recebe via props. Isso permite reordená-los verticalmente no mobile sem quebrar o layout.

---

## 4️⃣ TELAS CRÍTICAS

### A. Contas (O Núcleo)
*   **Web:** Grid de Cards (3 ou 4 por linha).
*   **Mobile:** Lista Vertical de Cards.
*   **Detalhe:** O Card da conta deve mostrar: Nome, Saldo, Instituição (Ícone).
*   **Ação:** Clicar no card leva aos detalhes/extrato daquela conta.

### B. Transações (A Linha do Tempo)
*   **O Problema:** Tabelas são ruins no mobile.
*   **A Solução (Componente `TransactionItem`):**
    *   Crie um componente que renderiza uma linha de tabela no Desktop (`<tr>`), mas que via CSS (`flex/grid`) se transforma em um Bloco Rico no Mobile.
    *   *Mobile Layout:*
        *   Esquerda: Ícone da Categoria (Avatar).
        *   Centro: Descrição (Topo) + Data/Conta (Baixo, texto menor).
        *   Direita: Valor (Topo, colorido) + Status (Baixo).
*   **Agrupamento:** Sempre agrupe por DATA (Dia) no mobile para facilitar o scan vertical.

### C. Cartões (Extensão)
*   **Visual:** Use a metáfora do "Cartão Físico".
*   **Web:** Grid de cartões.
*   **Mobile:** Carrossel Horizontal (Swipe) com "dots" indicadores. O usuário vê um cartão por vez e o extrato logo abaixo.

---

## 5️⃣ DESIGN SYSTEM COMPARTILHÁVEL

### Tokens (A base da consistência)
*   **Cores Semânticas:** `bg-danger-light`, `text-success-main`. Nunca use hexadecimais soltos no código. Isso garante que se mudarmos o tom de "Erro" no futuro, muda em tudo (Web e App).
*   **Tipografia (Scale):**
    *   Defina `h1`, `h2`, `body`, `caption`.
    *   No mobile, os títulos reduzem de tamanho automaticamente (ex: `text-2xl md:text-4xl`).
*   **Espaçamentos:** Use múltiplos de 4px (0.25rem). O padrão mobile é `p-4` (16px) de margem lateral.

### Estados de UI
*   **Skeleton Loading:** Essencial para percepção de velocidade. O skeleton deve imitar o layout final (se é lista, skeleton de lista; se é card, skeleton de card).
*   **Empty States:** Não deixe telas em branco. "Nenhuma transação aqui" + Ilustração + Botão "Criar Transação". Isso educa o usuário.

---

## 6️⃣ UX PARA MOBILE (DESDE JÁ)

### A Regra do Polegar (Thumb Zone)
*   Coloque as ações principais na parte **inferior** da tela.
*   Em formulários Web, evite colocar o botão "Salvar" no topo direito. Coloque no final do formulário ou numa barra fixa inferior. Isso já prepara a memória muscular para o mobile.

### Fluxos Rápidos (Speed)
*   **Lançamento Rápido:** O botão de "+" deve estar sempre acessível.
*   **Menos Texto:** Em vez de "Clique aqui para editar a categoria", use apenas um ícone de Lápis ou a label "Editar". Mobile exige concisão.

### Inputs Inteligentes
*   **Autofocus:** Ao abrir um modal de "Nova Transação", o foco deve ir direto para o "Valor". Economiza um toque.
*   **Máscaras:** Formatação de moeda, CPF e Data deve ser automática enquanto digita.

---

## 7️⃣ RECOMENDAÇÕES TÉCNICAS DE ARQUITETURA

### Organização de Componentes (Atomic Design Simplificado)
*   `ui/`: Componentes burros (Button, Input, Card). Seguem o Design System.
*   `features/`: Componentes de negócio (TransactionRow, AccountCard). Conectam dados à UI.
*   **Regra:** Um componente de UI nunca deve saber o que é uma "Transação". Um componente de Feature sabe.

### Separação de Domínio
*   Mantenha a lógica de negócio (cálculo de saldo, validação de regras) em `hooks` ou `services`, NUNCA dentro do JSX.
*   *Exemplo:* `useTransactionLogic()` retorna `{ validateBalance, calculateTotal }`. O React Native poderá reutilizar essa lógica se for feito em TS/JS, ou servirá de guia claro para a implementação nativa.

### APIs (BFF - Backend for Frontend)
*   Se possível, mantenha os endpoints agnósticos (`GET /transactions`).
*   Se o Web precisar de dados muito diferentes do Mobile, considere um padrão de BFF, mas para o estágio atual, **padronize os DTOs** (Data Transfer Objects). O JSON que o Web recebe deve ser limpo o suficiente para o Mobile consumir sem malabarismos.
