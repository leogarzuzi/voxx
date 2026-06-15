import { NextRequest } from "next/server";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function limparTexto(valor: unknown) {
  if (valor === null || valor === undefined) return "";

  return String(valor).trim();
}

function validarMatricula(matricula: string) {
  if (!matricula) return "A matricula e obrigatoria.";
  if (!/^\d+$/.test(matricula)) return "Matricula deve conter somente numeros.";
  if (matricula.length !== 8) return "Matricula deve ter 8 digitos.";
  if (!matricula.startsWith("40")) return "Matricula deve comecar com 40.";

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json(
        { success: false, error: "Nao autenticado." },
        { status: 401 }
      );
    }

    const emailLogado = user.email.toLowerCase();

    const { data: usuarioLogado } = await supabase
      .from("usuarios")
      .select("perfil, status")
      .eq("email", emailLogado)
      .single();

    if (!usuarioLogado || usuarioLogado.status !== "ativo") {
      return Response.json(
        { success: false, error: "Usuario sem acesso ativo." },
        { status: 403 }
      );
    }

    if (!temPermissao(usuarioLogado.perfil, PERMISSOES.PERMUTAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matricula = limparTexto(searchParams.get("matricula"));
    const erroMatricula = validarMatricula(matricula);

    if (erroMatricula) {
      return Response.json(
        { success: false, error: erroMatricula },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("colaboradores")
      .select(
        `
        pref,
        matricula,
        nome,
        cargo
      `
      )
      .eq("matricula", matricula)
      .maybeSingle();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json({
        success: true,
        encontrado: false,
        message: "Nenhum colaborador encontrado para esta matricula.",
      });
    }

    return Response.json({
      success: true,
      encontrado: true,
      colaborador: data,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
