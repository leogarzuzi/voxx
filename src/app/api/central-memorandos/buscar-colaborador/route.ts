import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 8);
}

function texto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "";
  return String(valor).trim();
}

export async function GET(request: NextRequest) {
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

    const { data: usuarioLogado } = await supabase
      .from("usuarios")
      .select("status")
      .eq("email", user.email.toLowerCase())
      .single();

    if (!usuarioLogado || usuarioLogado.status !== "ativo") {
      return Response.json(
        { success: false, error: "Usuário sem acesso ativo." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matricula = somenteDigitos(searchParams.get("matricula") || "");

    if (matricula.length !== 8) {
      return Response.json(
        {
          success: false,
          error: "Informe uma matrícula válida com 8 dígitos.",
        },
        { status: 400 }
      );
    }

    const { data: colaborador, error } = await supabase
      .from("colaboradores")
      .select("id, matricula, nome, cargo, email")
      .eq("matricula", matricula)
      .maybeSingle();

    if (error) {
      return Response.json(
        {
          success: false,
          error: "Não foi possível consultar a matrícula.",
        },
        { status: 500 }
      );
    }

    if (!colaborador) {
      return Response.json({
        success: true,
        encontrado: false,
        error:
          "Esta matrícula não se encontra ativa na base de colaboradores. Caso a informação esteja correta, procure o RH.",
      });
    }

    return Response.json({
      success: true,
      encontrado: true,
      colaborador: {
        id: colaborador.id,
        matricula: texto(colaborador.matricula),
        nome: texto(colaborador.nome),
        funcao: texto(colaborador.cargo),
        email: texto(colaborador.email),
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: "Não foi possível consultar o colaborador.",
      },
      { status: 500 }
    );
  }
}
