
import React, { useState, useEffect } from 'react';
import { Database, Check, Copy, AlertTriangle, ArrowRight, Save, Key, Globe, FileCode, Info, ShieldAlert, X } from 'lucide-react';
import { saveSupabaseConfig, getActiveConfig, STORAGE_URL_KEY, STORAGE_KEY_KEY } from '../services/supabaseClient';

interface SetupDatabaseProps {
    onBack?: () => void;
}

const SetupDatabase: React.FC<SetupDatabaseProps> = ({ onBack }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tenta carregar a configuração ativa (seja de env, localStorage ou default)
    const active = getActiveConfig();
    if (active.url && active.key) {
        setUrl(active.url);
        setKey(active.key);
    }
  }, []);

  const sqlScript = `-- SCRIPT DE SEGURANÇA AVANÇADA (MULTI-TENANT + SUPER ADMIN)
-- Execute este script no SQL Editor do Supabase para configurar as tabelas e políticas.

create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. ESTRUTURA DE PERFIS
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  company_name text,
  role text default 'admin' check (role in ('admin', 'guest', 'super_admin')),
  plan text default 'free',
  account_id uuid, -- ID DA EMPRESA
  preferences jsonb default '{}'::jsonb,
  permissions jsonb default '{"canEdit": true, "canDelete": true}'::jsonb,
  allowed_condos text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

create index if not exists idx_profiles_account_id on public.profiles(account_id);

-- --- FUNÇÕES AUXILIARES DE SEGURANÇA ---
create or replace function public.get_my_account_id()
returns uuid as $$
  select account_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable;

create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$ language sql security definer stable;

-- --- POLÍTICAS DE PERFIL ---
drop policy if exists "View profiles" on public.profiles;
create policy "View profiles" on public.profiles 
for select using (
  public.is_super_admin() OR account_id = public.get_my_account_id() OR id = auth.uid()
);

drop policy if exists "Update profiles" on public.profiles;
create policy "Update profiles" on public.profiles 
for update using (
  public.is_super_admin() OR id = auth.uid()
);

-- ==============================================================================
-- 2. TABELAS DE DADOS
-- ==============================================================================

-- --- CONDOMÍNIOS ---
create table if not exists public.condos (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  cnpj text,
  address text, -- Campo mantido para retrocompatibilidade ou display
  cep text,
  contact_phone text,
  manager_email text,
  additional_emails text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.condos enable row level security;

-- ATUALIZAÇÃO: Colunas separadas de endereço
alter table public.condos add column if not exists street text;
alter table public.condos add column if not exists number text;
alter table public.condos add column if not exists complement text;
alter table public.condos add column if not exists district text;
alter table public.condos add column if not exists city text;
alter table public.condos add column if not exists state text;

-- ATUALIZAÇÃO: Índice único para evitar CNPJ duplicado
CREATE UNIQUE INDEX IF NOT EXISTS idx_condos_cnpj ON public.condos (cnpj) WHERE cnpj IS NOT NULL AND cnpj != '';

drop policy if exists "Access condos" on public.condos;
create policy "Access condos" on public.condos 
for all using (
  public.is_super_admin() OR owner_id in (select id from public.profiles where account_id = public.get_my_account_id())
);

-- --- CATEGORIAS ---
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id),
  name text not null,
  is_system boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.categories enable row level security;

DELETE FROM public.categories a USING public.categories b
WHERE a.id > b.id AND a.name = b.name AND (a.owner_id = b.owner_id OR (a.owner_id IS NULL AND b.owner_id IS NULL));

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_name ON public.categories (name) WHERE owner_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_owner_name ON public.categories (name, owner_id) WHERE owner_id IS NOT NULL;

drop policy if exists "Access categories" on public.categories;
create policy "Access categories" on public.categories 
for all using (
  is_system = true OR public.is_super_admin() OR owner_id in (select id from public.profiles where account_id = public.get_my_account_id())
);

insert into public.categories (name, is_system) values 
  ('Elétrica', true), 
  ('Hidráulica', true), 
  ('Geral', true),
  ('CFTV', true),
  ('Controle de Acesso', true),
  ('Portões e Cancelas', true),
  ('Elevadores', true),
  ('Piscina', true),
  ('Sistema Elétrico', true),
  ('Gerador', true),
  ('Bombas e Recalque', true),
  ('Sistema Hidráulico', true),
  ('Sistema de Gás', true),
  ('Sistema de Incêndio', true),
  ('Fachada', true),
  ('Cobertura e Telhado', true),
  ('Impermeabilização', true),
  ('Garagens', true),
  ('Jardins e Paisagismo', true),
  ('Academia', true),
  ('Playground', true),
  ('Antenas e TV', true),
  ('Ar-Condicionado e Ventilação', true)
on conflict do nothing;

-- --- FORNECEDORES ---
create table if not exists public.providers (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  cnpj text,
  categories text[],
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.providers enable row level security;
alter table public.providers add column if not exists whatsapp text;

drop policy if exists "Access providers" on public.providers;
create policy "Access providers" on public.providers 
for all using (
  public.is_super_admin() OR owner_id in (select id from public.profiles where account_id = public.get_my_account_id())
);

-- --- MANUTENÇÕES ---
create table if not exists public.maintenances (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  condo_id uuid references public.condos(id) on delete cascade not null,
  category text not null,
  maintenance_type text not null,
  title text not null,
  description text,
  provider_id uuid references public.providers(id) on delete set null,
  provider_name text,
  provider_contact text,
  provider_email text,
  provider_phone text,
  estimated_cost numeric default 0,
  cost numeric default 0,
  frequency_type text,
  frequency_days integer,
  last_execution_date date,
  next_execution_date date,
  status text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.maintenances enable row level security;
alter table public.maintenances add column if not exists estimated_cost numeric default 0;

drop policy if exists "Access maintenances" on public.maintenances;
create policy "Access maintenances" on public.maintenances 
for all using (
  public.is_super_admin() OR owner_id in (select id from public.profiles where account_id = public.get_my_account_id())
);

-- ==============================================================================
-- 3. AUTOMAÇÃO DE CADASTRO
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, company_name, account_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'company', 
    coalesce((new.raw_user_meta_data->>'account_id')::uuid, new.id)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = () => {
      if(url && key) {
          saveSupabaseConfig(url, key);
      } else if (onBack) {
          onBack();
      } else {
          window.location.reload();
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Database className="text-blue-400" /> Configuração do Banco de Dados
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Gerencie a conexão e estrutura do seu Supabase.
                </p>
            </div>
            <div className="flex gap-2 items-center">
                <div className="flex gap-1 text-[10px] font-bold mr-4">
                    <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>1</span>
                    <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>2</span>
                </div>
                {onBack && (
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>

        {step === 1 && (
            <div className="p-8 space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                    <Info className="shrink-0" />
                    <p>O sistema já preencheu os campos abaixo com os valores detectados no seu ambiente. Clique em "Próximo" para confirmar.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Project URL</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://seu-projeto.supabase.co"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">API Key (Anon/Public)</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Sua chave anônima do Supabase"
                                value={key}
                                onChange={e => setKey(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                    {onBack && <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">Voltar</button>}
                    <button 
                        disabled={!url || !key}
                        onClick={() => setStep(2)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 ml-auto"
                    >
                        Próximo <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="p-8 space-y-6">
                 <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
                    <h2 className="text-lg font-bold text-indigo-800 mb-1 flex items-center gap-2"><ShieldAlert size={18}/> Estrutura SQL</h2>
                    <p className="text-sm text-indigo-700">
                        Se este for um novo banco, copie o script abaixo e execute-o no <strong>SQL Editor</strong> do seu painel Supabase.
                    </p>
                 </div>

                 <div className="relative">
                     <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs font-mono h-64 overflow-y-auto border border-slate-700">
                         {sqlScript}
                     </pre>
                     <button 
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded backdrop-blur-sm transition"
                     >
                         {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                     </button>
                 </div>

                 <div className="flex justify-between pt-4 items-center border-t border-slate-100">
                     <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Voltar</button>
                     <button 
                        onClick={handleSaveConfig}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                     >
                        <Save size={18} /> Salvar Configurações
                     </button>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SetupDatabase;
