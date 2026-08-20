begin;

alter table public.substituicoes_medicas
  add column if not exists email_substituto text;

alter table public.trocas_plantao_medicas
  add column if not exists email_solicitado text;

alter table public.substituicoes_medicas
  drop constraint if exists substituicoes_medicas_email_substituto_check,
  add constraint substituicoes_medicas_email_substituto_check check (
    email_substituto is null
    or (
      email_substituto = lower(email_substituto)
      and email_substituto ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    )
  );

alter table public.trocas_plantao_medicas
  drop constraint if exists trocas_plantao_medicas_email_solicitado_check,
  add constraint trocas_plantao_medicas_email_solicitado_check check (
    email_solicitado is null
    or (
      email_solicitado = lower(email_solicitado)
      and email_solicitado ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    )
  );

commit;
