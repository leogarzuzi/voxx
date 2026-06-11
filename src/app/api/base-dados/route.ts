import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // busca o usuário logado no Supabase Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    const emailLogado = user.email.toLowerCase();

    // confere se o usuário está ativo e tem permissão para acessar a base
    const { data: usuarioLogado } = await supabase
      .from("usuarios")
      .select("perfil, status")
      .eq("email", emailLogado)
      .single();

    if (
      !usuarioLogado ||
      usuarioLogado.status !== "ativo" ||
      !["Admin", "Gerente"].includes(usuarioLogado.perfil)
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";

    // consulta principal da base de colaboradores
    let query = supabase
      .from("colaboradores")
      .select(
        `
        id,
        pref,
        matricula,
        nome,
        cargo,
        carga_horaria,
        exercicio,
        cpf,
        pis,
        data_nascimento,
        email,
        observacao,
        created_at
      `
      )
      .order("nome", { ascending: true })
      .limit(100);

    // busca rápida por campos principais
    if (busca) {
      const termo = busca.replaceAll(",", " ").trim();

      query = query.or(
        `nome.ilike.*${termo}*,matricula.ilike.*${termo}*,cpf.ilike.*${termo}*,cargo.ilike.*${termo}*,email.ilike.*${termo}*`
      );
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
      colaboradores: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}