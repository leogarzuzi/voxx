create or replace function public.categoria_funcao_troca(valor text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  normalizada text;
begin
  normalizada := translate(
    upper(trim(coalesce(valor, ''))),
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'AAAAAEEEEIIIIOOOOOUUUUC'
  );
  normalizada := regexp_replace(normalizada, '\s+', ' ', 'g');

  if normalizada like '%MEDIC%' then
    return 'MEDICO';
  end if;

  if normalizada like '%TECNIC%' and normalizada like '%ENFERM%' then
    return 'TECNICO_ENFERMAGEM';
  end if;

  if normalizada like '%AUXILIAR%' and normalizada like '%ENFERM%' then
    return 'AUXILIAR_ENFERMAGEM';
  end if;

  if normalizada like '%ENFERMEIR%' then
    return 'ENFERMEIRO';
  end if;

  return normalizada;
end;
$$;

alter table public.trocas_plantao
  drop constraint if exists trocas_plantao_funcoes_iguais;

alter table public.trocas_plantao
  add constraint trocas_plantao_funcoes_iguais
  check (
    public.categoria_funcao_troca(funcao_solicitante)
    = public.categoria_funcao_troca(funcao_solicitado)
  );

