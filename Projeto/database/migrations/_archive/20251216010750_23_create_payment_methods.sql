-- Create payment_methods table
create table public.payment_methods (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    user_id uuid default auth.uid(), -- null means global/system
    name text not null,
    slug text not null, -- used for code logic
    type text not null check (type in ('standard', 'custom')),
    is_active boolean not null default true,
    
    constraint payment_methods_pkey primary key (id)
);

-- Enable RLS
alter table public.payment_methods enable row level security;

-- Policies
-- Read: Users can read system methods (user_id is null) OR their own methods
create policy "Users can read system and own payment methods"
on public.payment_methods for select
to authenticated
using (
    user_id is null or user_id = auth.uid()
);

-- Insert/Update/Delete: Users can only manage their own
create policy "Users can manage own payment methods"
on public.payment_methods for all
to authenticated
using (user_id = auth.uid());

-- Seed initial data (System defaults)
insert into public.payment_methods (user_id, name, slug, type) values
(null, 'Dinheiro', 'dinheiro', 'standard'),
(null, 'Pix', 'pix', 'standard'),
(null, 'Cartão de Débito', 'cartao_debito', 'standard'),
(null, 'Cartão de Crédito', 'cartao_credito', 'standard'),
(null, 'Boleto', 'boleto', 'standard'),
(null, 'Transferência', 'transferencia', 'standard'),
(null, 'Cheque', 'cheque', 'standard'),
(null, 'Outros', 'outros', 'standard');
