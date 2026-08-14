import { NextRequest } from "next/server";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function limparTexto(valor: unknown) {
  if (valor === null || valor === undefined) return "";

  return String(valor).trim();
}

function validarMatricula(matricula: string) {
  if (!matricula) {
    return "A matricula e obrigatoria.";
  }

  if (!/^\d+$/.test(matricula)) {
    return "Matricula deve conter somente numeros.";
  }

  if (matricula.length !== 8) {
    return "Matricula deve ter 8 digitos.";
  }

  if (!matricula.startsWith("40")) {
    return "Matricula deve comecar com 40.";
  }

  return null;
}

function normalizarColaboradorDaBase(colaborador: any, baseOrigem: string) {
  return {
    base_origem: baseOrigem,
    pref: colaborador.pref ?? null,
    matricula: colaborador.matricula ?? null,
    nome: colaborador.nome ?? null,
    cargo: colaborador.cargo ?? null,
    carga_horaria: colaborador.carga_horaria ?? null,
    exercicio: colaborador.exercicio ?? null,
    cpf: colaborador.cpf ?? null,
    pis: colaborador.pis ?? null,
    data_nascimento: colaborador.data_nascimento ?? null,
    email: colaborador.email ?? null,
  };
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

    if (!(await temPermissaoNoBanco(supabase, usuarioLogado.perfil, PERMISSOES.TRANSFERENCIAS))) {
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

    const { data: colaboradorBase, error: erroBase } = await supabase
      .from("colaboradores")
      .select(
        `
        pref,
        matricula,
        nome,
        cargo,
        carga_horaria,
        exercicio,
        cpf,
        pis,
        data_nascimento,
        email
      `
      )
      .eq("matricula", matricula)
      .maybeSingle();

    if (erroBase) {
      return Response.json(
        { success: false, error: erroBase.message },
        { status: 500 }
      );
    }

    const { data: colaboradorGestaoRh, error: erroGestaoRh } = await supabase
      .from("colaboradores_gestao_rh")
      .select(
        `
        pref,
        matricula,
        nome,
        cargo,
        carga_horaria,
        exercicio,
        cpf
      `
      )
      .eq("matricula", matricula)
      .maybeSingle();

    if (erroGestaoRh) {
      return Response.json(
        { success: false, error: erroGestaoRh.message },
        { status: 500 }
      );
    }

    const encontrados = [];

    if (colaboradorBase) {
      encontrados.push(
        normalizarColaboradorDaBase(colaboradorBase, "colaboradores")
      );
    }

    if (colaboradorGestaoRh) {
      encontrados.push(
        normalizarColaboradorDaBase(colaboradorGestaoRh, "gestao_rh")
      );
    }

    if (encontrados.length === 0) {
      return Response.json({
        success: true,
        encontrado: false,
        message: "Nenhum colaborador encontrado para esta matrícula.",
      });
    }

    const basesEncontradas = encontrados.map((item) => item.base_origem);

    if (encontrados.length > 1) {
      return Response.json(
        {
          success: false,
          error:
            "Inconsistencia encontrada: a matricula consta na Base de Dados e na Gestao RH ao mesmo tempo.",
          basesEncontradas,
          quantidade: encontrados.length,
        },
        { status: 409 }
      );
    }

    return Response.json({
      success: true,
      encontrado: true,
      colaborador: {
        ...encontrados[0],
        bases_encontradas: basesEncontradas,
      },
      basesEncontradas,
      quantidade: encontrados.length,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
