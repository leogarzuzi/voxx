-- Correção emergencial: a tabela estava devolvendo registros para a chave anon.
-- Esta migração remove todas as políticas anteriores da tabela e exige usuário
-- autenticado, ativo e com acesso à Central de Memorandos.

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
    left join public.perfis_acesso p
      on lower(p.nome) = lower(u.perfil)
    where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and u.status = 'ativo'
      and p.ativo = true
      and coalesce((p.permissoes ->> permissao)::boolean, false) = true
  );
$$;

revoke all on function public.usuario_ativo_com_permissao(text) from public;
grant execute on function public.usuario_ativo_com_permissao(text) to authenticated;

alter table public.trocas_plantao enable row level security;
alter table public.trocas_plantao force row level security;
revoke all on table public.trocas_plantao from anon;
grant select, insert, update on table public.trocas_plantao to authenticated;

do $$
declare
  politica record;
begin
  for politica in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'trocas_plantao'
  loop
    execute format(
      'drop policy if exists %I on public.trocas_plantao',
      politica.policyname
    );
  end loop;
end
$$;

create policy "trocas somente para usuarios autorizados"
on public.trocas_plantao
for all
to authenticated
using (public.usuario_ativo_com_permissao('centralMemorandos'))
with check (public.usuario_ativo_com_permissao('centralMemorandos'));

-- Solicitações agora passam exclusivamente pelas APIs do servidor.
alter table public.solicitacoes_acesso enable row level security;
alter table public.solicitacoes_acesso force row level security;
revoke all on table public.solicitacoes_acesso from anon, authenticated;

-- O contador é interno e só pode ser manipulado pelo trigger de protocolo.
-- A função roda com os privilégios de seu proprietário e usa search_path fixo
-- para evitar sequestro de objetos em uma função SECURITY DEFINER.
alter function public.gerar_protocolo_troca_plantao()
  security definer;

alter function public.gerar_protocolo_troca_plantao()
  set search_path = pg_catalog, public;

alter table public.trocas_plantao_contadores enable row level security;
alter table public.trocas_plantao_contadores force row level security;
revoke all on table public.trocas_plantao_contadores from anon, authenticated;
