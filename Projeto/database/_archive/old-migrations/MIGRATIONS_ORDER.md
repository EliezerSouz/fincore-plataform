# Migrations - Ordem Cronológica

Este documento lista todas as migrations do projeto em ordem sequencial de execução.

## Estrutura Base (001-006)
- **001** - `create_users_table.sql` - Criação da tabela de usuários
- **002** - `fix_permissions.sql` - Correção de permissões
- **003** - `create_accounts_table.sql` - Criação da tabela de contas
- **004** - `create_transactions_table.sql` - Criação da tabela de transações
- **005** - `update_account_types.sql` - Atualização dos tipos de conta
- **006** - `create_categories_table.sql` - Criação da tabela de categorias

## Melhorias de Categorias e Assinaturas (007-010)
- **007** - `enhance_categories_saas.sql` - Melhorias nas categorias SaaS
- **008** - `add_subscription_fields.sql` - Adição de campos de assinatura
- **009** - `create_credit_cards.sql` - Criação da tabela de cartões de crédito
- **010** - `update_transactions_account.sql` - Atualização de contas nas transações

## Sistema de Pagamentos (011-031)
- **011** - `add_payment_method.sql` - Adição de método de pagamento
- **012** - `create_payment_methods.sql` - Criação da tabela de métodos de pagamento
- **013** - `update_payment_methods_schema.sql` - Atualização do schema de métodos de pagamento
- **014** - `prevent_cascade_delete.sql` - Prevenção de deleção em cascata
- **015** - `add_account_is_active.sql` - Adição do campo is_active em contas
- **016** - `add_is_active_globally.sql` - Adição do campo is_active globalmente
- **017** - `change_account_type_to_text.sql` - Mudança do tipo de conta para texto
- **018** - `remove_payment_method_text.sql` - Remoção do campo de texto de método de pagamento
- **019** - `add_payment_method_fk.sql` - Adição de foreign key para método de pagamento
- **020** - `seed_payment_methods.sql` - Seed inicial de métodos de pagamento
- **021** - `fix_payment_methods_seed.sql` - Correção do seed de métodos de pagamento
- **022** - `fix_payment_methods_seed_v2.sql` - Correção do seed v2
- **023** - `fix_payment_methods_seed_v3.sql` - Correção do seed v3
- **024** - `fix_payment_methods_seed_v4.sql` - Correção do seed v4
- **025** - `force_payment_method_fk.sql` - Forçar foreign key de método de pagamento
- **026** - `backfill_orphan_transactions.sql` - Backfill de transações órfãs
- **027** - `add_payment_methods_policy.sql` - Adição de políticas para métodos de pagamento
- **028** - `open_payment_methods_access.sql` - Abertura de acesso aos métodos de pagamento
- **029** - `reset_payment_methods.sql` - Reset dos métodos de pagamento
- **030** - `disable_rls_payment_methods.sql` - Desabilitar RLS para métodos de pagamento
- **031** - `grant_permissions.sql` - Concessão de permissões

## Cartões de Crédito e Faturas (032-042)
- **032** - `create_credit_card_invoices.sql` - Criação da tabela de faturas de cartão
- **033** - `create_credit_card_transactions.sql` - Criação da tabela de transações de cartão
- **034** - `credit_card_functions.sql` - Funções para cartões de crédito
- **035** - `fix_credit_cards_rls.sql` - Correção de RLS para cartões
- **036** - `fix_invoices_transactions_rls.sql` - Correção de RLS para faturas e transações
- **037** - `fix_delete_credit_cards.sql` - Correção de deleção de cartões
- **038** - `force_fix_rls.sql` - Correção forçada de RLS
- **039** - `create_force_delete_rpc.sql` - Criação de RPC para deleção forçada
- **040** - `fix_delete_transactions.sql` - Correção de deleção de transações
- **041** - `force_delete_transaction.sql` - Deleção forçada de transação
- **042** - `fix_invoice_dates.sql` - Correção de datas de faturas

## Contas a Pagar e Integrações (043-051)
- **043** - `create_payables_table.sql` - Criação da tabela de contas a pagar
- **044** - `fix_payables_permissions.sql` - Correção de permissões de contas a pagar
- **045** - `add_payment_columns.sql` - Adição de colunas de pagamento
- **046** - `ensure_invoice_category.sql` - Garantir categoria de fatura
- **047** - `recreate_default_categories.sql` - Recriação de categorias padrão para usuários
- **048** - `add_invoice_link_to_transactions.sql` - Adição de link de fatura às transações
- **049** - `add_primary_card_to_users.sql` - Adição de cartão principal aos usuários
- **050** - `add_payable_link_to_transactions.sql` - Adição de link de conta a pagar às transações
- **051** - `fix_payment_invoice_category_icon.sql` - Correção do ícone de categoria de pagamento/fatura

---

## Resumo
- **Total de migrations:** 51
- **Última atualização:** 14/12/2025 12:30
- **Status:** ✅ Organizado, consolidado e sequencial
- **Estrutura:** Pasta única em `web/supabase/migrations`

## Notas
- Todas as migrations estão numeradas sequencialmente de 001 a 051
- A ordem reflete a sequência cronológica de criação
- Duplicatas foram removidas durante a organização
- **Consolidação:** As duas pastas de migrations foram consolidadas em uma única pasta
- **Backup:** A pasta antiga foi salva em `supabase/migrations_backup`
- **Pasta ativa:** `web/supabase/migrations` (única fonte de verdade)

