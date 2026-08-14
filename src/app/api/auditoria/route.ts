import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

export async function GET(request: NextRequest) {
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

  if (!usuario || !(await temPermissaoNoBanco(supabase, usuario.perfil, PERMISSOES.AUDITORIA))) {
    return Response.json(
      { success: false, error: "Sem permissão." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  const dataInicial = searchParams.get("dataInicial");
  const dataFinal = searchParams.get("dataFinal");
  const usuarioFiltro = searchParams.get("usuario");
  const acao = searchParams.get("acao");
  const modulo = searchParams.get("modulo");

  let query = supabase
    .from("auditoria")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(50);

  if (dataInicial) {
    query = query.gte("criado_em", `${dataInicial}T00:00:00`);
  }

  if (dataFinal) {
    query = query.lte("criado_em", `${dataFinal}T23:59:59`);
  }

  if (usuarioFiltro) {
    query = query.eq("usuario_email", usuarioFiltro);
  }

  if (acao) {
    query = query.eq("acao", acao);
  }

  if (modulo) {
    query = query.eq("modulo", modulo);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    logs: data ?? [],
  });
}
