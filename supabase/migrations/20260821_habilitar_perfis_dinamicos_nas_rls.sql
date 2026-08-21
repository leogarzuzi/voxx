begin;

-- Perfis personalizados são definidos em perfis_acesso.permissoes. Esta função
-- centraliza a validação do usuário autenticado sem depender de nomes fixos de
-- perfil e pode ser reutilizada pelas políticas abaixo.
create or replace function public.usuario_ativo_com_permissao(permissao text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.perfis_acesso p
      on lower(p.nome) = lower(u.perfil)
    where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and u.status = 'ativo'
      and p.ativo = true
      and coalesce((p.permissoes ->> permissao)::boolean, false)
  );
$$;

revoke all on function public.usuario_ativo_com_permissao(text) from public;
grant execute on function public.usuario_ativo_com_permissao(text) to authenticated;

create or replace function public.usuario_ativo_com_alguma_permissao(
  permissoes_solicitadas text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.perfis_acesso p
      on lower(p.nome) = lower(u.perfil)
    where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and u.status = 'ativo'
      and p.ativo = true
      and exists (
        select 1
        from pg_catalog.unnest(permissoes_solicitadas) as permissao(nome)
        where coalesce((p.permissoes ->> permissao.nome)::boolean, false)
      )
  );
$$;

revoke all on function public.usuario_ativo_com_alguma_permissao(text[]) from public;
grant execute on function public.usuario_ativo_com_alguma_permissao(text[]) to authenticated;

-- Base principal: também é consultada por módulos que precisam localizar um
-- colaborador e pelo dashboard geral.
alter table public.colaboradores enable row level security;
alter table public.colaboradores force row level security;
revoke all on table public.colaboradores from anon;
grant select on table public.colaboradores to authenticated;

drop policy if exists "perfis dinamicos leem colaboradores" on public.colaboradores;
create policy "perfis dinamicos leem colaboradores"
on public.colaboradores
for select
to authenticated
using (
  public.usuario_ativo_com_alguma_permissao(array[
    'baseDadosColaboradores',
    'dashboard',
    'transferencias',
    'permutas',
    'desligamentos',
    'centralMemorandos'
  ])
);

-- Base restrita de Gestão e RH, usada pela própria base e pelas buscas de
-- transferência e desligamento.
alter table public.colaboradores_gestao_rh enable row level security;
alter table public.colaboradores_gestao_rh force row level security;
revoke all on table public.colaboradores_gestao_rh from anon;
grant select on table public.colaboradores_gestao_rh to authenticated;

drop policy if exists "perfis dinamicos leem colaboradores gestao rh" on public.colaboradores_gestao_rh;
create policy "perfis dinamicos leem colaboradores gestao rh"
on public.colaboradores_gestao_rh
for select
to authenticated
using (
  public.usuario_ativo_com_alguma_permissao(array[
    'baseDadosGestaoRh',
    'transferencias',
    'desligamentos'
  ])
);

-- Controle de admissões: cada operação respeita sua permissão específica.
alter table public.admissoes_controle enable row level security;
alter table public.admissoes_controle force row level security;
revoke all on table public.admissoes_controle from anon;
grant select, insert, update on table public.admissoes_controle to authenticated;
revoke delete on table public.admissoes_controle from authenticated;

drop policy if exists "perfis dinamicos leem admissoes controle" on public.admissoes_controle;
create policy "perfis dinamicos leem admissoes controle"
on public.admissoes_controle
for select
to authenticated
using (
  public.usuario_ativo_com_alguma_permissao(array[
    'admissoesVisualizar',
    'admissoesCriar',
    'admissoesEditar'
  ])
);

drop policy if exists "perfis dinamicos criam admissoes controle" on public.admissoes_controle;
create policy "perfis dinamicos criam admissoes controle"
on public.admissoes_controle
for insert
to authenticated
with check (public.usuario_ativo_com_permissao('admissoesCriar'));

drop policy if exists "perfis dinamicos alteram admissoes controle" on public.admissoes_controle;
create policy "perfis dinamicos alteram admissoes controle"
on public.admissoes_controle
for update
to authenticated
using (public.usuario_ativo_com_permissao('admissoesEditar'))
with check (public.usuario_ativo_com_permissao('admissoesEditar'));

-- Tabelas operacionais cujas APIs já validam a mesma permissão antes de cada
-- leitura ou alteração.
alter table public.transferencias_controle enable row level security;
alter table public.transferencias_controle force row level security;
revoke all on table public.transferencias_controle from anon;
grant select, insert, update on table public.transferencias_controle to authenticated;
revoke delete on table public.transferencias_controle from authenticated;
drop policy if exists "perfis dinamicos acessam transferencias" on public.transferencias_controle;
create policy "perfis dinamicos acessam transferencias"
on public.transferencias_controle
for all
to authenticated
using (public.usuario_ativo_com_permissao('transferencias'))
with check (public.usuario_ativo_com_permissao('transferencias'));

alter table public.permutas_controle enable row level security;
alter table public.permutas_controle force row level security;
revoke all on table public.permutas_controle from anon;
grant select, insert, update on table public.permutas_controle to authenticated;
revoke delete on table public.permutas_controle from authenticated;
drop policy if exists "perfis dinamicos acessam permutas" on public.permutas_controle;
create policy "perfis dinamicos acessam permutas"
on public.permutas_controle
for all
to authenticated
using (public.usuario_ativo_com_permissao('permutas'))
with check (public.usuario_ativo_com_permissao('permutas'));

alter table public.desligamentos_controle enable row level security;
alter table public.desligamentos_controle force row level security;
revoke all on table public.desligamentos_controle from anon;
grant select, insert, update on table public.desligamentos_controle to authenticated;
revoke delete on table public.desligamentos_controle from authenticated;
drop policy if exists "perfis dinamicos acessam desligamentos" on public.desligamentos_controle;
create policy "perfis dinamicos acessam desligamentos"
on public.desligamentos_controle
for all
to authenticated
using (public.usuario_ativo_com_permissao('desligamentos'))
with check (public.usuario_ativo_com_permissao('desligamentos'));

alter table public.banco_horas_controle enable row level security;
alter table public.banco_horas_controle force row level security;
revoke all on table public.banco_horas_controle from anon;
grant select, insert, update on table public.banco_horas_controle to authenticated;
revoke delete on table public.banco_horas_controle from authenticated;
drop policy if exists "perfis dinamicos acessam banco horas" on public.banco_horas_controle;
create policy "perfis dinamicos acessam banco horas"
on public.banco_horas_controle
for all
to authenticated
using (public.usuario_ativo_com_permissao('centralMemorandos'))
with check (public.usuario_ativo_com_permissao('centralMemorandos'));

-- Fontes históricas usadas apenas pelos dashboards.
alter table public.admissoes enable row level security;
alter table public.admissoes force row level security;
revoke all on table public.admissoes from anon;
grant select on table public.admissoes to authenticated;
drop policy if exists "perfis dinamicos leem dashboard admissoes" on public.admissoes;
create policy "perfis dinamicos leem dashboard admissoes"
on public.admissoes
for select
to authenticated
using (
  public.usuario_ativo_com_alguma_permissao(array[
    'dashboard',
    'admissoesDashboard'
  ])
);

alter table public.desligamentos enable row level security;
alter table public.desligamentos force row level security;
revoke all on table public.desligamentos from anon;
grant select on table public.desligamentos to authenticated;
drop policy if exists "perfis dinamicos leem dashboard desligamentos" on public.desligamentos;
create policy "perfis dinamicos leem dashboard desligamentos"
on public.desligamentos
for select
to authenticated
using (
  public.usuario_ativo_com_alguma_permissao(array[
    'dashboard',
    'desligamentosDashboard'
  ])
);

alter table public.atestados enable row level security;
alter table public.atestados force row level security;
revoke all on table public.atestados from anon;
grant select on table public.atestados to authenticated;
drop policy if exists "perfis dinamicos leem dashboard atestados" on public.atestados;
create policy "perfis dinamicos leem dashboard atestados"
on public.atestados
for select
to authenticated
using (
  public.usuario_ativo_com_alguma_permissao(array[
    'dashboard',
    'atestados'
  ])
);

-- A auditoria é somente leitura para quem possui o módulo; os registros são
-- inseridos exclusivamente pelo backend com service_role.
alter table public.auditoria enable row level security;
alter table public.auditoria force row level security;
revoke all on table public.auditoria from anon;
grant select on table public.auditoria to authenticated;
drop policy if exists "perfis dinamicos leem auditoria" on public.auditoria;
create policy "perfis dinamicos leem auditoria"
on public.auditoria
for select
to authenticated
using (public.usuario_ativo_com_permissao('auditoria'));

-- A página de usuários lista as contas somente quando o perfil possui o módulo.
-- Alterações continuam passando pela API administrativa do backend.
alter table public.usuarios enable row level security;
alter table public.usuarios force row level security;
revoke all on table public.usuarios from anon;
grant select on table public.usuarios to authenticated;
drop policy if exists "perfis dinamicos leem usuarios" on public.usuarios;
create policy "perfis dinamicos leem usuarios"
on public.usuarios
for select
to authenticated
using (public.usuario_ativo_com_permissao('usuarios'));

commit;
