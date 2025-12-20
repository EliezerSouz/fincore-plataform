-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- SUBSCRIPTION & USERS

create type subscription_status as enum ('active', 'past_due', 'canceled', 'trial');
create type subscription_plan as enum ('free', 'basic', 'premium');
create type billing_cycle as enum ('monthly', 'yearly');

create table public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  subscription_status subscription_status default 'trial',
  subscription_plan subscription_plan default 'free',
  subscription_start_date timestamptz default now(),
  subscription_due_date timestamptz,
  subscription_end_date timestamptz,
  billing_cycle billing_cycle default 'monthly',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to create public.users on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.subscription_payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  amount numeric(10,2) not null,
  payment_date timestamptz,
  due_date timestamptz not null,
  status text check (status in ('paid', 'pending', 'late')),
  payment_method text,
  reference_month date not null,
  created_at timestamptz default now()
);

-- FINANCE CORE

create type transaction_type as enum ('income', 'expense');
create type expense_type as enum ('fixed', 'variable');

create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  type transaction_type not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table public.subcategories (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories(id) not null,
  user_id uuid references public.users(id) not null,
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  type text not null, -- 'checking', 'savings', 'investment', 'cash', 'other'
  initial_balance numeric(15,2) default 0,
  current_balance numeric(15,2) default 0, -- can be calculated, but stored for performance
  color text,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  account_id uuid references public.accounts(id), -- nullable for cash/external
  subcategory_id uuid references public.subcategories(id),
  amount numeric(15,2) not null,
  type transaction_type not null,
  description text,
  competence_date date not null, -- for accounting
  payment_date date, -- when money left/entered
  is_paid boolean default false,
  expense_type expense_type default 'variable',
  created_at timestamptz default now()
);

-- CREDIT CARDS

create table public.credit_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  limit_amount numeric(15,2) not null,
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  last_digits text,
  color text,
  created_at timestamptz default now()
);

create table public.card_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  card_id uuid references public.credit_cards(id) not null,
  subcategory_id uuid references public.subcategories(id),
  amount numeric(15,2) not null,
  description text,
  purchase_date date not null,
  total_installments integer default 1,
  created_at timestamptz default now()
);

create table public.card_installments (
  id uuid default uuid_generate_v4() primary key,
  card_transaction_id uuid references public.card_transactions(id) not null,
  user_id uuid references public.users(id) not null,
  installment_number integer not null,
  amount numeric(15,2) not null,
  due_date date not null, -- card bill due date for this installment
  status text default 'pending' check (status in ('paid', 'pending')),
  created_at timestamptz default now()
);

-- INVESTMENTS

create type asset_type as enum ('stock', 'fii', 'etf', 'crypto', 'fixed_income', 'other');

create table public.assets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  ticker text not null, -- e.g. PETR4, BTC
  name text,
  type asset_type not null,
  curr_quantity numeric(15,6) default 0,
  avg_price numeric(15,2) default 0, -- price average
  created_at timestamptz default now()
);

create table public.asset_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  asset_id uuid references public.assets(id) not null,
  type text not null check (type in ('buy', 'sell')),
  quantity numeric(15,6) not null,
  price numeric(15,2) not null,
  transaction_date timestamptz not null,
  fees numeric(10,2) default 0,
  created_at timestamptz default now()
);

create table public.dividends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  asset_id uuid references public.assets(id) not null,
  amount numeric(15,2) not null,
  payment_date date not null,
  reference_date date,
  type text, -- 'dividend', 'jcp', etc
  created_at timestamptz default now()
);

-- RLS POLICIES

alter table public.users enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.card_transactions enable row level security;
alter table public.card_installments enable row level security;
alter table public.assets enable row level security;
alter table public.asset_transactions enable row level security;
alter table public.dividends enable row level security;

-- Create policy macro (not really possible in pure SQL standard w/o functions, so manual copy-paste is safer/common)

-- USERS
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- SUBSCRIPTIONS
create policy "Users can view own payments" on public.subscription_payments for select using (auth.uid() = user_id);

-- GENERIC POLICY FUNCTION FOR USER_ID OWNERSHIP
-- Using simple statements for clarity

create policy "Users can view own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id);

create policy "Users can view own subcategories" on public.subcategories for select using (auth.uid() = user_id);
create policy "Users can insert own subcategories" on public.subcategories for insert with check (auth.uid() = user_id);
create policy "Users can update own subcategories" on public.subcategories for update using (auth.uid() = user_id);
create policy "Users can delete own subcategories" on public.subcategories for delete using (auth.uid() = user_id);

create policy "Users can view own accounts" on public.accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.accounts for delete using (auth.uid() = user_id);

create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

create policy "Users can view own cards" on public.credit_cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on public.credit_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on public.credit_cards for update using (auth.uid() = user_id);
create policy "Users can delete own cards" on public.credit_cards for delete using (auth.uid() = user_id);

create policy "Users can view own card transactions" on public.card_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own card transactions" on public.card_transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own card transactions" on public.card_transactions for update using (auth.uid() = user_id);
create policy "Users can delete own card transactions" on public.card_transactions for delete using (auth.uid() = user_id);

create policy "Users can view own card installments" on public.card_installments for select using (auth.uid() = user_id);
create policy "Users can insert own card installments" on public.card_installments for insert with check (auth.uid() = user_id);
-- No update/delete usually for installments, but let's allow for corrections
create policy "Users can update own card installments" on public.card_installments for update using (auth.uid() = user_id);
create policy "Users can delete own card installments" on public.card_installments for delete using (auth.uid() = user_id);

create policy "Users can view own assets" on public.assets for select using (auth.uid() = user_id);
create policy "Users can insert own assets" on public.assets for insert with check (auth.uid() = user_id);
create policy "Users can update own assets" on public.assets for update using (auth.uid() = user_id);
create policy "Users can delete own assets" on public.assets for delete using (auth.uid() = user_id);

create policy "Users can view own asset transactions" on public.asset_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own asset transactions" on public.asset_transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own asset transactions" on public.asset_transactions for update using (auth.uid() = user_id);
create policy "Users can delete own asset transactions" on public.asset_transactions for delete using (auth.uid() = user_id);

create policy "Users can view own dividends" on public.dividends for select using (auth.uid() = user_id);
create policy "Users can insert own dividends" on public.dividends for insert with check (auth.uid() = user_id);
create policy "Users can update own dividends" on public.dividends for update using (auth.uid() = user_id);
create policy "Users can delete own dividends" on public.dividends for delete using (auth.uid() = user_id);
