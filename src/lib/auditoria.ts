import { createClient } from "@supabase/supabase-js";

export const MODULOS_AUDITORIA = {
  ADMISSAO: "admissao",
  SOLICITACOES_ACESSO: "solicitacoes_acesso",
  CONFERENCIA_FOLHA: "conferencia_folha",
  DESLIGAMENTO: "desligamento",
} as const;

export const ACOES_AUDITORIA = {
  ADMISSAO_CRIADA: "ADMISSAO_CRIADA",
  ADMISSAO_EDITADA: "ADMISSAO_EDITADA",

  APROVACAO_ACESSO: "APROVACAO_ACESSO",
  CONFERENCIA_FOLHA_EXECUTADA: "CONFERENCIA_FOLHA_EXECUTADA",
  DESLIGAMENTO_CRIADO: "DESLIGAMENTO_CRIADO",
  DESLIGAMENTO_EDITADO: "DESLIGAMENTO_EDITADO",
  DESLIGAMENTO_DATA_ASO_ALTERADA: "DESLIGAMENTO_DATA_ASO_ALTERADA",
  DESLIGAMENTO_DATA_HOMOLOGACAO_ALTERADA: "DESLIGAMENTO_DATA_HOMOLOGACAO_ALTERADA",
  DESLIGAMENTO_ENVIADO_SEDE: "DESLIGAMENTO_ENVIADO_SEDE",
  DESLIGAMENTO_COMPUTADO_BASE: "DESLIGAMENTO_COMPUTADO_BASE",
} as const;

export async function registrarAuditoria({
  usuarioEmail,
  usuarioId,
  acao,
  modulo,
  detalhes,
}: {
  usuarioEmail?: string | null;
  usuarioId?: string | null;
  acao: string;
  modulo: string;
  detalhes?: Record<string, any>;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("auditoria").insert({
    usuario_email: usuarioEmail,
    usuario_id: usuarioId,
    acao,
    modulo,
    detalhes,
  });

  if (error) {
    console.error("Erro ao registrar auditoria:", error);
  }
}