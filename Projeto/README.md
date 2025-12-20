# 💰 Financeiro Platform

> Plataforma completa de gestão financeira pessoal e empresarial

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Architecture](https://img.shields.io/badge/architecture-refactored-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## 📋 Sobre o Projeto

Plataforma Full Stack para gestão financeira completa, incluindo:

- 💳 Gestão de contas bancárias
- 📊 Controle de transações (receitas e despesas)
- 🏷️ Categorização inteligente
- 💳 Gerenciamento de cartões de crédito e faturas
- 📅 Contas a pagar
- 📈 Dashboard com insights financeiros
- 🤖 Insights com IA (Groq AI)

---

## 🏗️ Arquitetura

### Stack Tecnológica

#### Frontend (Web)
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS 4
- **Componentes:** Radix UI + shadcn/ui
- **Autenticação:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **IA:** Groq SDK

#### Backend (API)
- **Linguagem:** Golang
- **Arquitetura:** Clean Architecture
- **Database:** PostgreSQL (Supabase)

#### Mobile (Futuro)
- **Framework:** React Native
- **Código Compartilhado:** TypeScript packages

---

## 📁 Estrutura do Projeto

```
Financeiro/
├── apps/
│   ├── web/              # Frontend Web (Next.js)
│   └── api/              # Backend API (Golang)
│
├── packages/             # Código compartilhado (futuro)
│   └── shared/           # Types, utils, validators
│
├── infra/
│   └── database/         # Migrations e schemas
│       └── migrations/   # 51 migrations organizadas
│
└── docs/                 # Documentação
    ├── ARCHITECTURE_REFACTORING_PLAN.md
    ├── REFACTORING_PROGRESS.md
    ├── MIGRATION_GUIDE.md
    └── EXECUTIVE_SUMMARY.md
```

### Estrutura Web (Detalhada)

```
web/
├── src/                  # 🆕 Nova estrutura organizada
│   ├── features/         # Features modulares
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── credit-cards/
│   │   ├── payables/
│   │   ├── dashboard/
│   │   └── auth/
│   │
│   ├── lib/             # Bibliotecas
│   │   ├── supabase/    # Cliente Supabase
│   │   ├── ai/          # Integrações AI
│   │   └── utils/       # Utilitários
│   │
│   ├── config/          # Configurações
│   ├── types/           # Types TypeScript
│   └── services/        # Serviços de API
│
├── app/                 # Next.js App Router
├── components/          # Componentes compartilhados
└── public/              # Assets estáticos
```

---

## 🚀 Getting Started

### Pré-requisitos

- Node.js 20+
- Go 1.21+
- PostgreSQL (ou conta Supabase)
- npm ou yarn

### Instalação

#### 1. Clone o repositório
```bash
git clone https://github.com/yourusername/financeiro.git
cd financeiro
```

#### 2. Configure o Frontend (Web)
```bash
cd web
npm install
```

#### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key  # Opcional (para IA)
```

#### 4. Execute as migrations
```bash
# Via Supabase CLI
supabase db push

# Ou execute manualmente no Supabase Dashboard
```

#### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentação

### Para Desenvolvedores
- 📖 [Guia de Migração](./docs/MIGRATION_GUIDE.md) - Como usar a nova estrutura
- 🏗️ [Plano de Refatoração](./docs/ARCHITECTURE_REFACTORING_PLAN.md) - Arquitetura completa
- 📊 [Progresso](./docs/REFACTORING_PROGRESS.md) - Status da refatoração

### Para Gestores
- 📋 [Resumo Executivo](./docs/EXECUTIVE_SUMMARY.md) - Visão geral do projeto

### Migrations
- 📄 [Ordem de Migrations](./web/supabase/migrations/MIGRATIONS_ORDER.md) - 51 migrations organizadas

---

## 🎯 Features Principais

### ✅ Implementadas
- [x] Autenticação (Login/Signup/Logout)
- [x] Gestão de Contas Bancárias
- [x] Transações (Receitas e Despesas)
- [x] Categorias e Subcategorias
- [x] Cartões de Crédito
- [x] Faturas de Cartão
- [x] Contas a Pagar
- [x] Dashboard com Gráficos
- [x] Insights Financeiros (Regras)
- [x] Insights com IA (Groq)
- [x] Tema Claro/Escuro

### 🚧 Em Desenvolvimento
- [ ] Investimentos
- [ ] Patrimônio
- [ ] Relatórios Avançados
- [ ] Exportação de Dados
- [ ] Mobile App

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção

# Qualidade de Código
npm run lint         # Executa linter
npx tsc --noEmit     # Verifica tipos TypeScript
```

---

## 🏛️ Arquitetura e Padrões

### Frontend
- **Padrão:** Feature-based architecture
- **State:** React Hooks + Context API
- **Styling:** Tailwind CSS + CSS Modules
- **Forms:** React Hook Form (planejado)
- **Validação:** Zod (planejado)

### Backend
- **Padrão:** Clean Architecture
- **Camadas:** Domain → Application → Infrastructure
- **Database:** Repository Pattern

### Imports
```typescript
// Ordem padrão
1. Bibliotecas externas
2. Componentes UI
3. Features
4. Hooks
5. Libs/Services
6. Types
7. Configurações
```

---

## 🤝 Contribuindo

### Workflow
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use os aliases configurados (`@/lib`, `@/features`, etc.)
- Siga a ordem padrão de imports
- Organize código por features
- Documente funções complexas

---

## 📝 Roadmap

### Q1 2025
- [x] Refatoração arquitetural
- [x] Organização de migrations
- [ ] Migração completa para nova estrutura
- [ ] Testes unitários

### Q2 2025
- [ ] Mobile App (React Native)
- [ ] Relatórios avançados
- [ ] Exportação de dados
- [ ] API pública

### Q3 2025
- [ ] Investimentos
- [ ] Patrimônio
- [ ] Planejamento financeiro
- [ ] Metas e objetivos

---

## 📊 Status do Projeto

### Refatoração Arquitetural
- ✅ **Fase 1:** Preparação e Estrutura (Concluída)
- 🟡 **Fase 2:** Migração de Componentes (Próxima)
- ⏳ **Fase 3:** Types e Services (Pendente)
- ⏳ **Fase 4:** Atualização de Imports (Pendente)
- ⏳ **Fase 5:** Validação (Pendente)

### Funcionalidades
- ✅ **Web:** Funcional e em produção
- 🟡 **Backend:** Estrutura básica
- ⏳ **Mobile:** Planejado

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Seu Nome** - *Desenvolvimento Inicial* - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Groq](https://groq.com/)

---

## 📞 Contato

- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Website: [Your Website](https://yourwebsite.com)

---

**Última Atualização:** 14/12/2025  
**Versão:** 0.2.0 (Refatoração Arquitetural)
