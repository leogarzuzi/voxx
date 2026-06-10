import { createClient } from "@supabase/supabase-js";

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

  const { error } = await supabase
    .from("auditoria")
    .insert({
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