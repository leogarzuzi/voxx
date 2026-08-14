import { NextRequest } from "next/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("perfil")
      .eq("email", user.email.toLowerCase())
      .single();

    if (!usuario || !(await temPermissaoNoBanco(supabase, usuario.perfil, PERMISSOES.CONFERENCIA_FOLHA))) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const detalhes = await request.json();

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: "CONFERENCIA_FOLHA_EXECUTADA",
      modulo: "conferencia_folha",
      detalhes,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível registrar auditoria." },
      { status: 500 }
    );
  }
}
