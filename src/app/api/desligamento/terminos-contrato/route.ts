import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

export const dynamic = "force-dynamic";

const TAMANHO_LOTE = 1000;
const LIMITE_TOTAL = 50000;

type ColaboradorBase = {
  id: number;
  pref: string | null;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  carga_horaria: string | null;
  exercicio: string | null;
  cpf: string | null;
  pis?: string | null;
  data_nascimento?: string | null;
  email?: string | null;
  observacao?: string | null;
};

type StatusTerminoContrato =
  | "vencido"
  | "vence_hoje"
  | "futuro";

type TerminoContratoCalculado = {
  id: number;
  pref: string | null;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  carga_horaria: string | null;
  exercicio: string | null;
  cpf: string | null;
  pis: string | null;
  data_nascimento: string | null;
  email: string | null;
  observacao: string | null;
  base_origem: "colaboradores" | "gestao_rh";
  regra_contrato: string;
  ano_contrato: number;
  anos_maximos: number;
  data_termino: string | null;
  dias_restantes: number;
  status_termino: StatusTerminoContrato;
  status_termino_label: string;
};

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type TabelaColaboradores = "colaboradores" | "colaboradores_gestao_rh";

async function buscarUsuarioLogado() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      supabase,
      user: null,
      usuarioLogado: null,
      erro: Response.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      ),
    };
  }

  const emailLogado = user.email.toLowerCase();

  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  if (!usuarioLogado || usuarioLogado.status !== "ativo") {
    return {
      supabase,
      user,
      usuarioLogado,
      erro: Response.json(
        { success: false, error: "Usuário sem acesso ativo." },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    user,
    usuarioLogado,
    erro: null,
  };
}

async function buscarColaboradoresContrato(
  supabase: SupabaseServerClient,
  tabela: TabelaColaboradores,
  campos: string
) {
  const colaboradores: ColaboradorBase[] = [];
  let inicio = 0;
  let continuar = true;

  while (continuar && colaboradores.length < LIMITE_TOTAL) {
    const fim = inicio + TAMANHO_LOTE - 1;

    const { data, error } = await supabase
      .from(tabela)
      .select(campos)
      .in("pref", ["47", "95"])
      .range(inicio, fim);

    if (error) {
      throw new Error(error.message);
    }

    const lote = (data ?? []) as unknown as ColaboradorBase[];

    colaboradores.push(...lote);

    if (lote.length < TAMANHO_LOTE) {
      continuar = false;
    }

    inicio += TAMANHO_LOTE;
  }

  return colaboradores;
}

function parseData(valor: string | null | undefined) {
  if (!valor) return null;

  const texto = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [ano, mes, dia] = texto.slice(0, 10).split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  return null;
}

function formatarData(data: Date | null) {
  if (!data) return null;

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function inicioDoDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function fimDoDia(data: Date) {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    23,
    59,
    59,
    999
  );
}

function somarAnos(data: Date, anos: number) {
  const novaData = new Date(data);
  novaData.setFullYear(novaData.getFullYear() + anos);
  return novaData;
}

function diferencaDias(dataFinal: Date, dataInicial: Date) {
  const umDia = 1000 * 60 * 60 * 24;

  const inicio = new Date(
    dataInicial.getFullYear(),
    dataInicial.getMonth(),
    dataInicial.getDate()
  );

  const fim = new Date(
    dataFinal.getFullYear(),
    dataFinal.getMonth(),
    dataFinal.getDate()
  );

  return Math.ceil((fim.getTime() - inicio.getTime()) / umDia);
}

function regraContrato(pref: string | null | undefined) {
  const prefixo = String(pref || "").trim();

  if (prefixo === "47") {
    return {
      anosMaximos: 2,
      regra: "Processo seletivo 1 + 1 ano",
    };
  }

  if (prefixo === "95") {
    return {
      anosMaximos: 6,
      regra: "Processo seletivo até 6 anos",
    };
  }

  return null;
}

function classificarTermino(
  diasRestantes: number
): { status: StatusTerminoContrato; label: string } {
  if (diasRestantes < 0) {
    return {
      status: "vencido",
      label: "Vencido",
    };
  }

  if (diasRestantes === 0) {
    return {
      status: "vence_hoje",
      label: "Vence hoje",
    };
  }

  return {
    status: "futuro",
    label: "A vencer",
  };
}

function calcularTerminoContrato(colaborador: ColaboradorBase) {
  const regra = regraContrato(colaborador.pref);
  const dataAdmissao = parseData(colaborador.exercicio);

  if (!regra || !dataAdmissao) return null;

  const hoje = inicioDoDia(new Date());
  const dataTermino = somarAnos(dataAdmissao, regra.anosMaximos);
  const diasRestantes = diferencaDias(dataTermino, hoje);
  const classificacao = classificarTermino(diasRestantes);

  return {
    dataTermino,
    diasRestantes,
    anoContrato: regra.anosMaximos,
    anosMaximos: regra.anosMaximos,
    regra: regra.regra,
    status: classificacao.status,
    statusLabel: classificacao.label,
  };
}

function montarTermino(
  colaborador: ColaboradorBase,
  baseOrigem: "colaboradores" | "gestao_rh"
): TerminoContratoCalculado | null {
  const termino = calcularTerminoContrato(colaborador);

  if (!termino) return null;

  return {
    id: colaborador.id,
    pref: colaborador.pref,
    matricula: colaborador.matricula,
    nome: colaborador.nome,
    cargo: colaborador.cargo,
    carga_horaria: colaborador.carga_horaria,
    exercicio: colaborador.exercicio,
    cpf: colaborador.cpf,
    pis: colaborador.pis ?? null,
    data_nascimento: colaborador.data_nascimento ?? null,
    email: colaborador.email ?? null,
    observacao: colaborador.observacao ?? null,
    base_origem: baseOrigem,

    regra_contrato: termino.regra,
    ano_contrato: termino.anoContrato,
    anos_maximos: termino.anosMaximos,
    data_termino: formatarData(termino.dataTermino),
    dias_restantes: termino.diasRestantes,
    status_termino: termino.status,
    status_termino_label: termino.statusLabel,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, usuarioLogado, erro } = await buscarUsuarioLogado();

    if (erro) return erro;

    if (!(await temPermissaoNoBanco(supabase, usuarioLogado?.perfil, PERMISSOES.DESLIGAMENTOS))) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const hoje = inicioDoDia(new Date());
    const mesParametro = Number(searchParams.get("mes"));
    const anoParametro = Number(searchParams.get("ano"));

    const mesFiltro =
      Number.isInteger(mesParametro) && mesParametro >= 1 && mesParametro <= 12
        ? mesParametro
        : hoje.getMonth() + 1;

    const anoFiltro =
      Number.isInteger(anoParametro) && anoParametro >= 1900
        ? anoParametro
        : hoje.getFullYear();

    const dataInicioFiltro = inicioDoDia(
      new Date(anoFiltro, mesFiltro - 1, 1)
    );
    const dataFimFiltro = fimDoDia(new Date(anoFiltro, mesFiltro, 0));

    const { data: desligamentosPendentes, error: erroPendentes } =
      await supabase
        .from("desligamentos_controle")
        .select("matricula")
        .eq("status_base", "pendente");

    if (erroPendentes) {
      return Response.json(
        { success: false, error: erroPendentes.message },
        { status: 500 }
      );
    }

    const matriculasPendentes = new Set(
      (desligamentosPendentes ?? [])
        .map((item) => String(item.matricula || "").trim())
        .filter(Boolean)
    );

    const colaboradores = await buscarColaboradoresContrato(
      supabase,
      "colaboradores",
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
        observacao
      `
    );

    const colaboradoresGestaoRh = await buscarColaboradoresContrato(
      supabase,
      "colaboradores_gestao_rh",
      `
        id,
        pref,
        matricula,
        nome,
        cargo,
        carga_horaria,
        exercicio,
        cpf
      `
    );

    const terminosColaboradores = colaboradores
      .filter((colaborador) => {
        const matricula = String(colaborador.matricula || "").trim();
        return matricula && !matriculasPendentes.has(matricula);
      })
      .map((colaborador) => montarTermino(colaborador, "colaboradores"))
      .filter((termino) => termino !== null);

    const terminosGestaoRh = colaboradoresGestaoRh
      .filter((colaborador) => {
        const matricula = String(colaborador.matricula || "").trim();
        return matricula && !matriculasPendentes.has(matricula);
      })
      .map((colaborador) => montarTermino(colaborador, "gestao_rh"))
      .filter((termino) => termino !== null);

    const terminos = [...terminosColaboradores, ...terminosGestaoRh]
      .filter((termino) => {
        const dataTermino = parseData(termino.data_termino);

        if (!dataTermino) return false;

        return (
          dataTermino >= dataInicioFiltro && dataTermino <= dataFimFiltro
        );
      })
      .sort((a, b) => {
        if (a.dias_restantes !== b.dias_restantes) {
          return a.dias_restantes - b.dias_restantes;
        }

        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
      });

    const resumo = {
      total: terminos.length,
      vencidos: terminos.filter(
        (termino) => termino.status_termino === "vencido"
      ).length,
      vencem_hoje: terminos.filter((termino) => termino.dias_restantes === 0)
        .length,
      futuros: terminos.filter((termino) => termino.dias_restantes > 0).length,
    };

    return Response.json({
      success: true,
      total: terminos.length,
      mes: mesFiltro,
      ano: anoFiltro,
      dataInicioFiltro: formatarData(dataInicioFiltro),
      dataFimFiltro: formatarData(dataFimFiltro),
      resumo,
      terminos,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
