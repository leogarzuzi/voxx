-- O sistema normaliza plantões de 24 horas para "24", enquanto registros
-- antigos e a constraint original utilizavam "24 horas". Ambos representam
-- a mesma carga horária e precisam coexistir durante a transição.

alter table public.trocas_plantao
  drop constraint if exists trocas_plantao_ch_equivalente;

alter table public.trocas_plantao
  add constraint trocas_plantao_ch_equivalente
  check (
    (
      tipo_plantao_solicitante in ('SD', 'SN')
      and tipo_plantao_solicitado in ('SD', 'SN')
    )
    or
    (
      tipo_plantao_solicitante in ('24', '24 horas')
      and tipo_plantao_solicitado in ('24', '24 horas')
    )
  );

