import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  createSupabaseAdminClient,
  usuarioAtualTemPermissao,
} from "@/lib/perfisServer";
import { PERMISSOES } from "@/lib/perfis";

export const dynamic = "force-dynamic";

function limparBusca(valor: string | null) {
  return String(valor ?? "")
    .trim()
    .replace(/[,%*()]/g, " ")
    .replace(/\s+/g, " ");
}

function competenciaValida(valor: string | null) {
  const texto = String(valor ?? "").trim();
  return /^\d{4}-\d{2}$/.test(texto) ? texto : "";
}

function proximaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return mes === 12
    ? `${ano + 1}-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const clienteSessao = await createSupabaseServerClient();
    if (
      !(await usuarioAtualTemPermissao(
        clienteSessao,
        PERMISSOES.CENTRAL_MEMORANDOS,
      ))
    ) {
      return Response.json(
        { success: false, error: "Sem permissão para acessar os registros." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const modalidade = searchParams.get("modalidade");
    if (!modalidade || !["substituicao", "troca"].includes(modalidade)) {
      return Response.json(
        { success: false, error: "Modalidade inválida." },
        { status: 400 },
      );
    }

    const busca = limparBusca(searchParams.get("busca"));
    const status = searchParams.get("status");
    const competencia = competenciaValida(searchParams.get("competencia"));
    const pagina = Math.max(Number(searchParams.get("page") || "1"), 1);
    const limite = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "100"), 1),
      100,
    );
    const inicio = (pagina - 1) * limite;
    const fim = inicio + limite - 1;
    const supabase = createSupabaseAdminClient();

    if (modalidade === "substituicao") {
      let query = supabase
        .from("substituicoes_medicas")
        .select(
          "id,protocolo,nome_solicitante,matricula_solicitante,funcao_solicitante,email_solicitante,data_plantao,tipo_plantao,nome_substituto,matricula_substituto,funcao_substituto,status,criado_em,cancelado_em",
          { count: "exact" },
        );

      if (status === "recebido" || status === "cancelado")
        query = query.eq("status", status);
      if (competencia)
        query = query
          .gte("data_plantao", `${competencia}-01`)
          .lt("data_plantao", `${proximaCompetencia(competencia)}-01`);
      if (busca.length >= 2) {
        const numeros = busca.replace(/\D/g, "");
        query = query.or(
          [
            `protocolo.ilike.*${busca}*`,
            `nome_solicitante.ilike.*${busca}*`,
            `nome_substituto.ilike.*${busca}*`,
            numeros.length >= 3
              ? `matricula_solicitante.ilike.*${numeros}*`
              : "",
            numeros.length >= 3
              ? `matricula_substituto.ilike.*${numeros}*`
              : "",
          ]
            .filter(Boolean)
            .join(","),
        );
      }

      const { data, error, count } = await query
        .order("criado_em", { ascending: false })
        .range(inicio, fim);
      if (error) throw error;
      return Response.json({
        success: true,
        registros: data ?? [],
        total: count ?? 0,
      });
    }

    let query = supabase
      .from("trocas_plantao_medicas")
      .select(
        "id,protocolo,nome_solicitante,matricula_solicitante,funcao_solicitante,email_solicitante,data_plantao_solicitante,tipo_plantao_solicitante,nome_solicitado,matricula_solicitado,funcao_solicitado,data_plantao_solicitado,tipo_plantao_solicitado,status,criado_em,cancelado_em",
        { count: "exact" },
      );

    if (status === "recebido" || status === "cancelado")
      query = query.eq("status", status);
    if (competencia)
      query = query
        .gte("data_plantao_solicitante", `${competencia}-01`)
        .lt(
          "data_plantao_solicitante",
          `${proximaCompetencia(competencia)}-01`,
        );
    if (busca.length >= 2) {
      const numeros = busca.replace(/\D/g, "");
      query = query.or(
        [
          `protocolo.ilike.*${busca}*`,
          `nome_solicitante.ilike.*${busca}*`,
          `nome_solicitado.ilike.*${busca}*`,
          numeros.length >= 3 ? `matricula_solicitante.ilike.*${numeros}*` : "",
          numeros.length >= 3 ? `matricula_solicitado.ilike.*${numeros}*` : "",
        ]
          .filter(Boolean)
          .join(","),
      );
    }

    const { data, error, count } = await query
      .order("criado_em", { ascending: false })
      .range(inicio, fim);
    if (error) throw error;
    return Response.json({
      success: true,
      registros: data ?? [],
      total: count ?? 0,
    });
  } catch (error) {
    console.error("Erro ao listar solicitações médicas internas:", error);
    return Response.json(
      { success: false, error: "Não foi possível carregar os registros." },
      { status: 500 },
    );
  }
}
