import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES, temPermissao } from "@/lib/perfis";

export const dynamic = "force-dynamic";

const TAMANHO_LOTE = 1000;
const LIMITE_TOTAL = 10000;

const CAMPOS_PERMITIDOS: Record<string, string> = {
  pref: "pref",
  matricula: "matricula",
  nome: "nome",
  cargo: "cargo",
  carga_horaria: "carga_horaria",
  exercicio: "exercicio",
  cpf: "cpf",
};

type FiltroBaseDados = {
  campo: string;
  valores: string[];
};

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

    // busca o perfil e status do usuário logado
    const { data: usuarioLogado } = await supabase
      .from("usuarios")
      .select("perfil, status")
      .eq("email", emailLogado)
      .single();

    // somente usuário ativo com permissão de Gestão e RH pode acessar
    if (
      !usuarioLogado ||
      usuarioLogado.status !== "ativo" ||
      !temPermissao(usuarioLogado.perfil, PERMISSOES.BASE_DADOS_GESTAO_RH)
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const carregarTodos = searchParams.get("todos") === "1";
    const filtrosParam = searchParams.get("filtros");

    const termoBusca = busca.replaceAll(",", " ").trim();

    let filtros: FiltroBaseDados[] = [];

    if (filtrosParam) {
      try {
        filtros = JSON.parse(filtrosParam);
      } catch {
        return Response.json(
          { success: false, error: "Filtros inválidos." },
          { status: 400 }
        );
      }
    }

    // monta a consulta principal
    function montarQuery() {
      let query = supabase
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
          created_at
        `
        )
        .order("nome", { ascending: true });

      // busca rápida por campos principais
      if (termoBusca) {
        query = query.or(
          `nome.ilike.*${termoBusca}*,matricula.ilike.*${termoBusca}*,cpf.ilike.*${termoBusca}*,cargo.ilike.*${termoBusca}*`
        );
      }

      // filtros estilo Excel
      for (const filtro of filtros) {
        const coluna = CAMPOS_PERMITIDOS[filtro.campo];

        if (!coluna) continue;

        const valoresValidos = filtro.valores
          .map((valor) => String(valor).trim())
          .filter(Boolean);

        if (valoresValidos.length > 0) {
          query = query.in(coluna, valoresValidos);
        }
      }

      return query;
    }

    // modo normal: carrega até 100
    if (!carregarTodos) {
      const { data, error } = await montarQuery().limit(100);

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
        modo: "limitado",
      });
    }

    // modo completo: carrega todos em lotes
    const colaboradores: any[] = [];

    let inicio = 0;
    let continuar = true;

    while (continuar && colaboradores.length < LIMITE_TOTAL) {
      const fim = inicio + TAMANHO_LOTE - 1;

      const { data, error } = await montarQuery().range(inicio, fim);

      if (error) {
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      const lote = data ?? [];

      colaboradores.push(...lote);

      if (lote.length < TAMANHO_LOTE) {
        continuar = false;
      }

      inicio += TAMANHO_LOTE;
    }

    return Response.json({
      success: true,
      colaboradores,
      total: colaboradores.length,
      modo: "todos",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}