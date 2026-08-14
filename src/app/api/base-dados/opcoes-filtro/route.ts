import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

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
  pis: "pis",
  data_nascimento: "data_nascimento",
  email: "email",
  observacao: "observacao",
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

    // segurança real da API: usuário ativo + permissão no perfis.ts
    if (
      !usuarioLogado ||
      usuarioLogado.status !== "ativo" ||
      !(await temPermissaoNoBanco(
        supabase,
        usuarioLogado.perfil,
        PERMISSOES.BASE_DADOS_COLABORADORES
      ))
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const campo = searchParams.get("campo") || "";
    const coluna = CAMPOS_PERMITIDOS[campo];

    if (!coluna) {
      return Response.json(
        { success: false, error: "Campo inválido." },
        { status: 400 }
      );
    }

    const filtrosParam = searchParams.get("filtros");

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

    const valores: string[] = [];

    let inicio = 0;
    let continuar = true;

    // busca em lotes para pegar todas as opções possíveis
    while (continuar && valores.length < LIMITE_TOTAL) {
      const fim = inicio + TAMANHO_LOTE - 1;

      let query = supabase
        .from("colaboradores")
        .select(coluna)
        .not(coluna, "is", null)
        .order(coluna, { ascending: true })
        .range(inicio, fim);

      // aplica os filtros ativos, exceto o próprio campo que está sendo aberto
      for (const filtro of filtros) {
        if (filtro.campo === campo) continue;

        const colunaFiltro = CAMPOS_PERMITIDOS[filtro.campo];

        if (!colunaFiltro) continue;

        const valoresValidos = filtro.valores
          .map((valor) => String(valor).trim())
          .filter(Boolean);

        if (valoresValidos.length > 0) {
          query = query.in(colunaFiltro, valoresValidos);
        }
      }

      const { data, error } = await query;

      if (error) {
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      const lote = data ?? [];

      for (const item of lote as any[]) {
        const valor = item[coluna];

        if (valor !== null && valor !== undefined) {
          const valorTratado = String(valor).trim();

          if (valorTratado) {
            valores.push(valorTratado);
          }
        }
      }

      if (lote.length < TAMANHO_LOTE) {
        continuar = false;
      }

      inicio += TAMANHO_LOTE;
    }

    const valoresUnicos = Array.from(new Set(valores)).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    return Response.json({
      success: true,
      campo,
      coluna,
      valores: valoresUnicos,
      total: valoresUnicos.length,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
