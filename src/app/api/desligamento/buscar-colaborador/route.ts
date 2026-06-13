import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function limparTexto(valor: unknown) {
  if (valor === null || valor === undefined) return "";

  return String(valor).trim();
}

function validarMatricula(matricula: string) {
  if (!matricula) {
    return "A matrícula é obrigatória.";
  }

  if (!/^40\d{6}$/.test(matricula)) {
    return "Matrícula deve ter 8 dígitos e começar com 40. Ex: 40524579.";
  }

  return null;
}

function temAcessoDesligamento(perfil?: string | null) {
  const perfisPermitidos = [
    "Admin",
    "Gerente",
    "Admissão",
    "Admissao",
    "Desligamento",
  ];

  return !!perfil && perfisPermitidos.includes(perfil);
}

function normalizarColaboradorDaBase(colaborador: any, baseOrigem: string) {
  return {
    id_origem: colaborador.id,
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

    registro_ponto: colaborador.registro_ponto ?? null,
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
        { success: false, error: "Não autenticado." },
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
        { success: false, error: "Usuário sem acesso ativo." },
        { status: 403 }
      );
    }

    if (!temAcessoDesligamento(usuarioLogado.perfil)) {
      return Response.json(
        { success: false, error: "Sem permissão." },
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
        registro_ponto
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
        id,
        pref,
        matricula,
        nome,
        cargo,
        carga_horaria,
        exercicio,
        cpf,
        registro_ponto
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
        colaborador: null,
        basesEncontradas: [],
        message: "Nenhum colaborador ativo encontrado para esta matrícula.",
      });
    }

    const basesEncontradas = encontrados.map((item) => item.base_origem);

if (encontrados.length > 1) {
  return Response.json(
    {
      success: false,
      error:
        "Inconsistência encontrada: a matrícula consta na Base de Dados e na Gestão RH ao mesmo tempo.",
      basesEncontradas,
      quantidade: encontrados.length,
    },
    { status: 409 }
  );
}

const colaboradorPrincipal = encontrados[0];

return Response.json({
  success: true,
  encontrado: true,
  colaborador: {
    ...colaboradorPrincipal,
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