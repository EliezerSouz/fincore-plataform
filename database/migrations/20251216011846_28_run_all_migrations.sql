-- ============================================
-- SCRIPT DE EXECUÇÃO DE TODAS AS MIGRATIONS
-- ============================================
-- 
-- Este script executa todas as migrations em ordem sequencial.
-- Use com cuidado! Recomendado apenas para setup inicial.
--
-- Para produção, execute as migrations individualmente via Supabase CLI:
--   cd web
--   supabase db reset
--
-- ============================================

\echo '=== Iniciando execução de todas as migrations ==='
\echo ''

-- 001-010: Core Schema
\echo '[001] Creating users table...'
\i 001_create_users_table.sql

\echo '[002] Fixing permissions...'
\i 002_fix_permissions.sql

\echo '[003] Creating accounts table...'
\i 003_create_accounts_table.sql

\echo '[004] Creating categories table...'
\i 004_create_categories_table.sql

\echo '[005] Creating transactions table...'
\i 005_create_transactions_table.sql

\echo '[006] Updating account types...'
\i 006_update_account_types.sql

\echo '[007] Adding payment method...'
\i 007_add_payment_method.sql

\echo '[008] Enhancing categories for SaaS...'
\i 008_enhance_categories_saas.sql

\echo '[009] Creating payment methods...'
\i 009_create_payment_methods.sql

\echo '[010] Adding subscription fields...'
\i 010_add_subscription_fields.sql

-- 011-020: Payment Methods & Credit Cards
\echo '[011] Updating payment methods schema...'
\i 011_update_payment_methods_schema.sql

\echo '[012] Creating credit cards...'
\i 012_create_credit_cards.sql

\echo '[013] Preventing cascade delete...'
\i 013_prevent_cascade_delete.sql

\echo '[014] Updating transactions account...'
\i 014_update_transactions_account.sql

\echo '[015] Adding account is_active...'
\i 015_add_account_is_active.sql

\echo '[016] Creating credit card invoices...'
\i 016_create_credit_card_invoices.sql

\echo '[017] Adding is_active globally...'
\i 017_add_is_active_globally.sql

\echo '[018] Creating credit card transactions...'
\i 018_create_credit_card_transactions.sql

\echo '[019] Changing account type to text...'
\i 019_change_account_type_to_text.sql

\echo '[020] Adding credit card functions...'
\i 020_credit_card_functions.sql

-- 021-030: Categories & RLS Fixes
\echo '[021] Ensuring invoice category...'
\i 021_ensure_invoice_category.sql

\echo '[022] Fixing credit cards RLS...'
\i 022_fix_credit_cards_rls.sql

\echo '[023] Recreating default categories...'
\i 023_recreate_default_categories.sql

\echo '[024] Fixing invoices/transactions RLS...'
\i 024_fix_invoices_transactions_rls.sql

\echo '[025] Fixing delete credit cards...'
\i 025_fix_delete_credit_cards.sql

\echo '[026] Force fixing RLS...'
\i 026_force_fix_rls.sql

\echo '[027] Creating force delete RPC...'
\i 027_create_force_delete_rpc.sql

\echo '[028] Fixing delete transactions...'
\i 028_fix_delete_transactions.sql

\echo '[029] Force delete transaction...'
\i 029_force_delete_transaction.sql

\echo '[030] Fixing invoice dates...'
\i 030_fix_invoice_dates.sql

-- 031-034: Payables & Invoice Links
\echo '[031] Creating payables table...'
\i 031_create_payables_table.sql

\echo '[032] Fixing payables permissions...'
\i 032_fix_payables_permissions.sql

\echo '[033] Adding payment columns...'
\i 033_add_payment_columns.sql

\echo '[034] Adding invoice link to transactions...'
\i 034_add_invoice_link_to_transactions.sql

-- 035-048: Payment Methods Final Fixes
\echo '[035] Removing payment method text...'
\i 035_remove_payment_method_text.sql

\echo '[036] Adding payment method FK...'
\i 036_add_payment_method_fk.sql

\echo '[037] Seeding payment methods...'
\i 037_seed_payment_methods.sql

\echo '[038] Fixing payment methods seed...'
\i 038_fix_payment_methods_seed.sql

\echo '[039] Fixing payment methods seed v2...'
\i 039_fix_payment_methods_seed_v2.sql

\echo '[040] Fixing payment methods seed v3...'
\i 040_fix_payment_methods_seed_v3.sql

\echo '[041] Fixing payment methods seed v4...'
\i 041_fix_payment_methods_seed_v4.sql

\echo '[042] Force payment method FK...'
\i 042_force_payment_method_fk.sql

\echo '[043] Backfilling orphan transactions...'
\i 043_backfill_orphan_transactions.sql

\echo '[044] Adding payment methods policy...'
\i 044_add_payment_methods_policy.sql

\echo '[045] Opening payment methods access...'
\i 045_open_payment_methods_access.sql

\echo '[046] Resetting payment methods...'
\i 046_reset_payment_methods.sql

\echo '[047] Disabling RLS payment methods...'
\i 047_disable_rls_payment_methods.sql

\echo '[048] Granting permissions...'
\i 048_grant_permissions.sql

\echo ''
\echo '=== Todas as migrations foram executadas com sucesso! ==='
\echo ''
