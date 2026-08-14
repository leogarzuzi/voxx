create extension if not exists pgcrypto;

create table if not exists public.perfis_acesso (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_normalizado text not null unique,
  ativo boolean not null default true,
  protegido boolean not null default false,
  permissoes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_acesso_nome_preenchido check (length(trim(nome)) between 2 and 60),
  constraint perfis_acesso_permissoes_objeto check (jsonb_typeof(permissoes) = 'object')
);

alter table public.perfis_acesso enable row level security;

drop policy if exists "perfis ativos visiveis para autenticados" on public.perfis_acesso;
create policy "perfis ativos visiveis para autenticados"
on public.perfis_acesso for select
to authenticated
using (ativo = true or exists (
  select 1 from public.usuarios
  where lower(email) = lower(auth.jwt() ->> 'email')
    and perfil = 'Admin'
    and status = 'ativo'
));

insert into public.perfis_acesso
  (nome, nome_normalizado, ativo, protegido, permissoes)
values
  ('Admin', 'admin', true, true, '{
    "solicitacoes": true, "dashboard": true, "conferenciaFolha": true,
    "admissoesDashboard": true, "desligamentosDashboard": true,
    "desligamentos": true, "atestados": true,
    "transferencias": true, "permutas": true, "auditoria": true,
    "usuarios": true, "perfis": true, "centralMemorandos": true,
    "baseDadosColaboradores": true, "baseDadosGestaoRh": true,
    "admissoesVisualizar": true, "admissoesCriar": true,
    "admissoesEditar": true, "admissoesEnviarSede": true,
    "admissoesSubirBase": true, "novosAdmitidosVisualizar": true,
    "novosAdmitidosEditar": true
  }'::jsonb),
  ('Gerente', 'gerente', true, false, '{
    "dashboard": true, "conferenciaFolha": true, "admissoesDashboard": true,
    "desligamentosDashboard": true, "desligamentos": true, "atestados": true,
    "transferencias": true, "permutas": true,
    "baseDadosColaboradores": true, "baseDadosGestaoRh": true,
    "admissoesVisualizar": true, "admissoesCriar": true,
    "admissoesEditar": true, "admissoesEnviarSede": true,
    "admissoesSubirBase": true, "novosAdmitidosVisualizar": true,
    "novosAdmitidosEditar": true
  }'::jsonb),
  ('Admissão', 'admissao', true, false, '{
    "transferencias": true, "permutas": true,
    "baseDadosColaboradores": true, "admissoesVisualizar": true,
    "admissoesCriar": true, "admissoesEditar": true,
    "admissoesEnviarSede": true, "admissoesSubirBase": true,
    "novosAdmitidosVisualizar": true
  }'::jsonb),
  ('Transferência', 'transferencia', true, false, '{
    "transferencias": true, "permutas": true,
    "baseDadosColaboradores": true, "baseDadosGestaoRh": true
  }'::jsonb),
  ('Desligamento', 'desligamento', true, false, '{
    "desligamentos": true, "transferencias": true, "permutas": true,
    "baseDadosColaboradores": true,
    "baseDadosGestaoRh": true
  }'::jsonb),
  ('Atendimento', 'atendimento', true, false, '{
    "baseDadosColaboradores": true, "novosAdmitidosVisualizar": true,
    "novosAdmitidosEditar": true
  }'::jsonb)
on conflict (nome_normalizado) do nothing;

update public.usuarios set perfil = 'Admissão' where perfil = 'Admissao';
update public.usuarios set perfil = 'Transferência' where perfil = 'Transferencia';
