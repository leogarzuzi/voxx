import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type RegistroHistorico = {
  id: string;
  modulo: string;
  titulo: string;
  descricao: string;
  data: string | null;
  status?: string | null;
};

type DadosPrincipais = {
  nome: string | null;
  matricula: string | null;
  cpf: string | null;
  cargo: string | null;
  cargaHoraria: string | null;
  admissao: string | null;
  statusAtual: string | null;
};

const LIMITE_POR_MODULO = 5;

function limparBusca(valor: string | null) {
  return String(valor || "")
    .trim()
    .replace(/[,%*()]/g, " ")
    .replace(/\s+/g, " ");
}

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function texto(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return null;

  return String(valor);
}

function dataRegistro(registro: Record<string, any>) {
  return (
    texto(registro.criado_em) ||
    texto(registro.atualizado_em) ||
    texto(registro.created_at) ||
    texto(registro.computado_em) ||
    texto(registro.inicio_hmrg) ||
    texto(registro.inicio_nova_unidade) ||
    texto(registro.data_desligamento) ||
    texto(registro.exercicio) ||
    texto(registro.exercicio_entrada) ||
    texto(registro.data_inicial) ||
    null
  );
}

function montarFiltroBusca(busca: string, camposTexto: string[], camposNumericos: string[] = []) {
  const partes = camposTexto.map((campo) => `${campo}.ilike.*${busca}*`);
  const digitos = somenteDigitos(busca);

  if (digitos.length >= 3) {
    partes.push(...camposNumericos.map((campo) => `${campo}.ilike.*${digitos}*`));
  }

  return partes.join(",");
}

async function consultarTabela(
  supabase: any,
  tabela: string,
  select: string,
  filtro: string,
  ordem = "criado_em"
) {
  try {
    let query = supabase.from(tabela).select(select).or(filtro).limit(20);

    query = query.order(ordem, { ascending: false });

    const { data, error } = await query;

    if (error) return [];

    return data ?? [];
  } catch {
    return [];
  }
}

function limitarHistorico(registros: RegistroHistorico[]) {
  return registros
    .sort((a, b) => {
      const dataA = a.data ? new Date(a.data).getTime() : 0;
      const dataB = b.data ? new Date(b.data).getTime() : 0;

      return dataB - dataA;
    })
    .slice(0, LIMITE_POR_MODULO);
}

function escolherDadosPrincipais(
  colaboradores: any[],
  colaboradoresGestaoRh: any[],
  demaisRegistros: any[]
): DadosPrincipais | null {
  const origem = colaboradores[0] || colaboradoresGestaoRh[0] || demaisRegistros[0];

  if (!origem) return null;

  return {
    nome: texto(origem.nome || origem.nome_entrada || origem.nome_saida),
    matricula: texto(
      origem.matricula || origem.matricula_entrada || origem.matricula_saida
    ),
    cpf: texto(origem.cpf || origem.cpf_entrada),
    cargo: texto(origem.cargo || origem.cargo_entrada || origem.cargo_saida),
    cargaHoraria: texto(origem.carga_horaria || origem.carga_horaria_entrada),
    admissao: texto(origem.exercicio || origem.exercicio_entrada),
    statusAtual: colaboradores[0]
      ? "Na base de colaboradores"
      : colaboradoresGestaoRh[0]
      ? "Na base Gestão e RH"
      : null,
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

    const { data: usuarioLogado } = await supabase
      .from("usuarios")
      .select("status")
      .eq("email", user.email.toLowerCase())
      .single();

    if (!usuarioLogado || usuarioLogado.status !== "ativo") {
      return Response.json(
        { success: false, error: "Usuario sem acesso ativo." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const busca = limparBusca(searchParams.get("busca"));

    if (busca.length < 2) {
      return Response.json(
        { success: false, error: "Informe ao menos 2 caracteres." },
        { status: 400 }
      );
    }

    const filtroPadrao = montarFiltroBusca(
      busca,
      ["nome", "matricula", "cpf"],
      ["matricula", "cpf"]
    );

    const [
      colaboradores,
      colaboradoresGestaoRh,
      admissoesControle,
      admissoesBase,
      desligamentos,
      transferencias,
      permutas,
      atestados,
    ] = await Promise.all([
      consultarTabela(
        supabase,
        "colaboradores",
        "id,pref,matricula,nome,cargo,carga_horaria,exercicio,cpf,email,created_at",
        filtroPadrao,
        "nome"
      ),
      consultarTabela(
        supabase,
        "colaboradores_gestao_rh",
        "id,pref,matricula,nome,cargo,carga_horaria,exercicio,cpf,created_at",
        filtroPadrao,
        "nome"
      ),
      consultarTabela(
        supabase,
        "admissoes_controle",
        "id,pref,matricula,nome,cargo,ch_final,exercicio,cpf,email,status_sede,criado_em",
        filtroPadrao
      ),
      consultarTabela(
        supabase,
        "admissoes",
        "id,pref,matricula,nome,cargo,ch_final,exercicio,cpf,email,status_processamento",
        filtroPadrao,
        "id"
      ),
      consultarTabela(
        supabase,
        "desligamentos_controle",
        "id,pref,matricula,nome,cargo,carga_horaria,exercicio,cpf,email,data_desligamento,tipo_desligamento,status_sede,status_base,criado_em",
        filtroPadrao
      ),
      consultarTabela(
        supabase,
        "transferencias_controle",
        "id,pref,matricula,nome,cargo,carga_horaria,exercicio,cpf,email,tipo_movimento,cedente,cessionario,inicio_nova_unidade,status,criado_em",
        montarFiltroBusca(
          busca,
          ["nome", "matricula", "cpf", "cargo", "cedente", "cessionario"],
          ["matricula", "cpf"]
        )
      ),
      consultarTabela(
        supabase,
        "permutas_controle",
        "id,pref_saida,matricula_saida,nome_saida,cargo_saida,pref_entrada,matricula_entrada,nome_entrada,cargo_entrada,carga_horaria_entrada,exercicio_entrada,cpf_entrada,email_entrada,unidade_origem,inicio_hmrg,status,criado_em",
        montarFiltroBusca(
          busca,
          [
            "nome_saida",
            "matricula_saida",
            "cargo_saida",
            "nome_entrada",
            "matricula_entrada",
            "cargo_entrada",
            "cpf_entrada",
            "unidade_origem",
          ],
          ["matricula_saida", "matricula_entrada", "cpf_entrada"]
        )
      ),
      consultarTabela(
        supabase,
        "atestados",
        "id,pref,matricula,nome,funcao,data_inicial,data_final,cid,observacao,mes",
        montarFiltroBusca(busca, ["nome", "matricula", "funcao"], ["matricula"]),
        "id"
      ),
    ]);

    const historico = {
      colaboradores: limitarHistorico(
        colaboradores.map((item: any) => ({
          id: `colaboradores-${item.id}`,
          modulo: "Base de colaboradores",
          titulo: texto(item.nome) || "Colaborador",
          descricao: `Matricula ${texto(item.matricula) || "-"} | Cargo ${
            texto(item.cargo) || "-"
          }`,
          data: dataRegistro(item),
          status: "Na base",
        }))
      ),
      gestaoRh: limitarHistorico(
        colaboradoresGestaoRh.map((item: any) => ({
          id: `gestao-rh-${item.id}`,
          modulo: "Gestão e RH",
          titulo: texto(item.nome) || "Colaborador",
          descricao: `Matricula ${texto(item.matricula) || "-"} | Cargo ${
            texto(item.cargo) || "-"
          }`,
          data: dataRegistro(item),
          status: "Na base Gestão e RH",
        }))
      ),
      admissoes: limitarHistorico(
        [...admissoesControle, ...admissoesBase].map((item: any) => ({
          id: `admissoes-${item.id}`,
          modulo: "Admissões",
          titulo: texto(item.nome) || "Admissão",
          descricao: `Matricula ${texto(item.matricula) || "-"} | Cargo ${
            texto(item.cargo) || "-"
          }`,
          data: dataRegistro(item),
          status: texto(item.status_sede || item.status_processamento),
        }))
      ),
      desligamentos: limitarHistorico(
        desligamentos.map((item: any) => ({
          id: `desligamentos-${item.id}`,
          modulo: "Desligamentos",
          titulo: texto(item.nome) || "Desligamento",
          descricao: `${texto(item.tipo_desligamento) || "Desligamento"} | ${
            texto(item.cargo) || "-"
          }`,
          data: dataRegistro(item),
          status: texto(item.status_base || item.status_sede),
        }))
      ),
      transferencias: limitarHistorico(
        transferencias.map((item: any) => ({
          id: `transferencias-${item.id}`,
          modulo: "Transferências",
          titulo: texto(item.nome) || "Transferência",
          descricao: `${texto(item.tipo_movimento) || "-"} | ${
            texto(item.cedente) || "-"
          } -> ${texto(item.cessionario) || "-"}`,
          data: dataRegistro(item),
          status: texto(item.status),
        }))
      ),
      permutas: limitarHistorico(
        permutas.map((item: any) => ({
          id: `permutas-${item.id}`,
          modulo: "Permutas",
          titulo: `${texto(item.nome_saida) || "-"} / ${
            texto(item.nome_entrada) || "-"
          }`,
          descricao: `Sai ${texto(item.matricula_saida) || "-"} | Entra ${
            texto(item.matricula_entrada) || "-"
          }`,
          data: dataRegistro(item),
          status: texto(item.status),
        }))
      ),
      atestados: limitarHistorico(
        atestados.map((item: any) => ({
          id: `atestados-${item.id}`,
          modulo: "Atestados",
          titulo: texto(item.nome) || "Atestado",
          descricao: `${texto(item.funcao) || "-"} | CID ${
            texto(item.cid) || "-"
          }`,
          data: dataRegistro(item),
          status: texto(item.mes),
        }))
      ),
    };

    const demaisRegistros = [
      ...admissoesControle,
      ...admissoesBase,
      ...desligamentos,
      ...transferencias,
      ...permutas,
      ...atestados,
    ];
    const dadosPrincipais = escolherDadosPrincipais(
      colaboradores,
      colaboradoresGestaoRh,
      demaisRegistros
    );
    const totalEncontrado =
      colaboradores.length +
      colaboradoresGestaoRh.length +
      admissoesControle.length +
      admissoesBase.length +
      desligamentos.length +
      transferencias.length +
      permutas.length +
      atestados.length;

    return Response.json({
      success: true,
      encontrado: totalEncontrado > 0,
      dadosPrincipais,
      historico,
    });
  } catch {
    return Response.json(
      { success: false, error: "Nao foi possivel consultar o colaborador." },
      { status: 500 }
    );
  }
}
