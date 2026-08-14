import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";
import {
  ACOES_AUDITORIA,
  MODULOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";

export const dynamic = "force-dynamic";

type DesligamentoPayload = {
  id?: number;
  pref?: string;
  matricula?: string;
  nome?: string;
  cargo?: string;
  carga_horaria?: string;
  exercicio?: string;
  cpf?: string;
  pis?: string;
  data_nascimento?: string;
  email?: string;
  data_desligamento?: string;
  tipo_desligamento?: string;
  data_aso?: string;
  data_homologacao?: string;
  base_origem?: string;
  observacao?: string;
};

const TIPOS_DESLIGAMENTO = [
  "TÉRMINO DE CONTRATO",
  "NÃO RENOVAÇÃO DE CONTRATO",
  "INICIATIVA DO EMPREGADO",
  "INICIATIVA DO EMPREGADOR",
  "JUSTA CAUSA",
];

const CAMPOS_AUDITORIA_DESLIGAMENTO = [
  "pref",
  "matricula",
  "nome",
  "cargo",
  "carga_horaria",
  "exercicio",
  "cpf",
  "pis",
  "data_nascimento",
  "email",
  "data_desligamento",
  "tipo_desligamento",
  "data_aso",
  "data_homologacao",
  "base_origem",
  "status_sede",
  "status_base",
  "observacao",
] as const;

const LABELS_AUDITORIA_DESLIGAMENTO: Record<string, string> = {
  pref: "Prefixo",
  matricula: "Matrícula",
  nome: "Nome",
  cargo: "Cargo",
  carga_horaria: "Carga horária",
  exercicio: "Exercício",
  cpf: "CPF",
  pis: "PIS",
  data_nascimento: "Data de nascimento",
  email: "E-mail",
  data_desligamento: "Data do desligamento",
  tipo_desligamento: "Tipo de desligamento",
  data_aso: "Data do ASO",
  data_homologacao: "Data da homologação",
  base_origem: "Base de origem",
  status_sede: "Status SEDE",
  status_base: "Status base",
  observacao: "Observação",
};

function formatarValorAuditoria(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "VAZIO";
  }

  if (typeof valor === "boolean") {
    return valor ? "SIM" : "NÃO";
  }

  return String(valor);
}

function montarAlteracoesDetalhadas(
  antes: Record<string, any> | null,
  depois: Record<string, any> | null
) {
  if (!antes || !depois) return [];

  return CAMPOS_AUDITORIA_DESLIGAMENTO.flatMap((campo) => {
    const valorAntes = antes[campo] ?? null;
    const valorDepois = depois[campo] ?? null;

    if (String(valorAntes) === String(valorDepois)) {
      return [];
    }

    return [
      {
        campo,
        label: LABELS_AUDITORIA_DESLIGAMENTO[campo] || campo,
        antes: formatarValorAuditoria(valorAntes),
        depois: formatarValorAuditoria(valorDepois),
      },
    ];
  });
}

function limparTexto(valor: unknown) {
  if (valor === null || valor === undefined) return null;

  const texto = String(valor).trim();

  return texto || null;
}

function limparTextoMaiusculo(valor: unknown) {
  const texto = limparTexto(valor);

  if (!texto) return null;

  return texto.toLocaleUpperCase("pt-BR");
}

function limparEmail(valor: unknown) {
  const texto = limparTexto(valor);

  if (!texto) return null;

  return texto.toLowerCase();
}

function limparData(valor: unknown) {
  const texto = limparTexto(valor);

  if (!texto) return null;

  const data = new Date(`${texto}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return texto;
}

function validarMatricula(matricula: string | null) {
  if (!matricula) {
    return "A matrícula é obrigatória.";
  }

  if (!/^40\d{6}$/.test(matricula)) {
    return "Matrícula deve ter 8 dígitos e começar com 40. Ex: 40524579.";
  }

  return null;
}

function normalizarBaseOrigem(valor: unknown) {
  const texto = String(valor || "").trim();

  if (texto === "gestao_rh") return "gestao_rh";
  if (texto === "ambas") return "ambas";

  return "colaboradores";
}

function montarCamposAlterados(
  antes: Record<string, any> | null,
  depois: Record<string, any> | null
) {
  if (!antes || !depois) return [];

  return CAMPOS_AUDITORIA_DESLIGAMENTO.filter((campo) => {
    const valorAntes = antes[campo] ?? null;
    const valorDepois = depois[campo] ?? null;

    return String(valorAntes) !== String(valorDepois);
  });
}

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

function validarPayload(body: DesligamentoPayload) {
  const matricula = limparTexto(body.matricula);
  const nome = limparTextoMaiusculo(body.nome);
  const cargo = limparTextoMaiusculo(body.cargo);
  const tipoDesligamento = limparTextoMaiusculo(body.tipo_desligamento);

  const dataDesligamento = limparData(body.data_desligamento);
  const dataAso = limparData(body.data_aso);
  const dataHomologacao = limparData(body.data_homologacao);
  const dataNascimento = limparData(body.data_nascimento);

  const erroMatricula = validarMatricula(matricula);

  if (erroMatricula) {
    return {
      erro: erroMatricula,
      dados: null,
    };
  }

  if (!nome) {
    return {
      erro: "O nome é obrigatório. Busque o colaborador pela matrícula antes de salvar.",
      dados: null,
    };
  }

  if (!dataDesligamento) {
    return {
      erro: "A data do desligamento é obrigatória.",
      dados: null,
    };
  }

  if (!tipoDesligamento) {
    return {
      erro: "O tipo de desligamento é obrigatório.",
      dados: null,
    };
  }

  if (!TIPOS_DESLIGAMENTO.includes(tipoDesligamento)) {
    return {
      erro: "Tipo de desligamento inválido.",
      dados: null,
    };
  }

  return {
    erro: null,
    dados: {
      pref: limparTexto(body.pref),
      matricula,
      nome,
      cargo,
      cargaHoraria: limparTexto(body.carga_horaria),
      exercicio: limparData(body.exercicio),
      cpf: limparTexto(body.cpf),
      pis: limparTexto(body.pis),
      dataNascimento,
      email: limparEmail(body.email),
      dataDesligamento,
      tipoDesligamento,
      dataAso,
      dataHomologacao,
      baseOrigem: normalizarBaseOrigem(body.base_origem),
      observacao: limparTextoMaiusculo(body.observacao),
    },
  };
}

// lista desligamentos do controle
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

    const busca = searchParams.get("busca")?.trim() || "";
    const termoBusca = busca.replaceAll(",", " ").trim();

    let query = supabase
      .from("desligamentos_controle")
      .select(
        `
        id,
        carimbo,
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
        data_desligamento,
        tipo_desligamento,
        data_aso,
        data_homologacao,
        base_origem,
        status_sede,
        status_base,
        enviado_sede_em,
        enviado_sede_por_email,
        computado_base_em,
        computado_base_por_email,
        observacao,
        criado_em,
        criado_por_email,
        atualizado_em,
        atualizado_por_email
      `
      )
      .order("criado_em", { ascending: false })
      .limit(100);

    if (termoBusca) {
      query = query.or(
        `nome.ilike.*${termoBusca}*,matricula.ilike.*${termoBusca}*,cpf.ilike.*${termoBusca}*,cargo.ilike.*${termoBusca}*,email.ilike.*${termoBusca}*`
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
      desligamentos: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// cria novo desligamento
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (!(await temPermissaoNoBanco(supabase, usuarioLogado?.perfil, PERMISSOES.DESLIGAMENTOS))) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as DesligamentoPayload;

    const validacao = validarPayload(body);

    if (validacao.erro || !validacao.dados) {
      return Response.json(
        { success: false, error: validacao.erro },
        { status: 400 }
      );
    }

    const {
      pref,
      matricula,
      nome,
      cargo,
      cargaHoraria,
      exercicio,
      cpf,
      pis,
      dataNascimento,
      email,
      dataDesligamento,
      tipoDesligamento,
      dataAso,
      dataHomologacao,
      baseOrigem,
      observacao,
    } = validacao.dados;

    const { data: desligamentoPendente, error: erroDuplicidade } =
      await supabase
        .from("desligamentos_controle")
        .select("id, nome, matricula, status_base")
        .eq("matricula", matricula)
        .eq("status_base", "pendente")
        .maybeSingle();

    if (erroDuplicidade) {
      return Response.json(
        { success: false, error: erroDuplicidade.message },
        { status: 500 }
      );
    }

    if (desligamentoPendente) {
      return Response.json(
        {
          success: false,
          error: `Já existe um desligamento pendente para a matrícula ${matricula}.`,
        },
        { status: 409 }
      );
    }

    const emailLogado = user!.email!.toLowerCase();

    const novoDesligamento = {
      pref,
      matricula,
      nome,
      cargo,
      carga_horaria: cargaHoraria,
      exercicio,
      cpf,
      pis,
      data_nascimento: dataNascimento,
      email,
      data_desligamento: dataDesligamento,
      tipo_desligamento: tipoDesligamento,
      data_aso: dataAso,
      data_homologacao: dataHomologacao,
      base_origem: baseOrigem,
      status_sede: "pendente",
      status_base: "pendente",
      observacao,

      criado_por: user!.id,
      criado_por_email: emailLogado,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("desligamentos_controle")
      .insert(novoDesligamento)
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await registrarAuditoria({
      usuarioId: user!.id,
      usuarioEmail: emailLogado,
      acao: ACOES_AUDITORIA.DESLIGAMENTO_CRIADO,
      modulo: MODULOS_AUDITORIA.DESLIGAMENTO,
      detalhes: {
        desligamentoId: data.id,
        nome: data.nome,
        matricula: data.matricula,
        cargo: data.cargo,
        tipoDesligamento: data.tipo_desligamento,
        dataDesligamento: data.data_desligamento,
        baseOrigem: data.base_origem,
      },
    });

    return Response.json({
      success: true,
      desligamento: data,
      message: "Desligamento salvo com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// edita desligamento já cadastrado
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (!(await temPermissaoNoBanco(supabase, usuarioLogado?.perfil, PERMISSOES.DESLIGAMENTOS))) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as DesligamentoPayload;

    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { success: false, error: "ID do desligamento inválido." },
        { status: 400 }
      );
    }

    const validacao = validarPayload(body);

    if (validacao.erro || !validacao.dados) {
      return Response.json(
        { success: false, error: validacao.erro },
        { status: 400 }
      );
    }

    const {
      pref,
      matricula,
      nome,
      cargo,
      cargaHoraria,
      exercicio,
      cpf,
      pis,
      dataNascimento,
      email,
      dataDesligamento,
      tipoDesligamento,
      dataAso,
      dataHomologacao,
      baseOrigem,
      observacao,
    } = validacao.dados;

    const { data: desligamentoPendente, error: erroDuplicidade } =
      await supabase
        .from("desligamentos_controle")
        .select("id, nome, matricula, status_base")
        .eq("matricula", matricula)
        .eq("status_base", "pendente")
        .neq("id", id)
        .maybeSingle();

    if (erroDuplicidade) {
      return Response.json(
        { success: false, error: erroDuplicidade.message },
        { status: 500 }
      );
    }

    if (desligamentoPendente) {
      return Response.json(
        {
          success: false,
          error: `Já existe outro desligamento pendente para a matrícula ${matricula}.`,
        },
        { status: 409 }
      );
    }

    const { data: desligamentoAntes, error: erroDesligamentoAntes } =
      await supabase
        .from("desligamentos_controle")
        .select("*")
        .eq("id", id)
        .single();

    if (erroDesligamentoAntes) {
      return Response.json(
        { success: false, error: erroDesligamentoAntes.message },
        { status: 500 }
      );
    }

    const emailLogado = user!.email!.toLowerCase();

    const desligamentoAtualizado = {
      pref,
      matricula,
      nome,
      cargo,
      carga_horaria: cargaHoraria,
      exercicio,
      cpf,
      pis,
      data_nascimento: dataNascimento,
      email,
      data_desligamento: dataDesligamento,
      tipo_desligamento: tipoDesligamento,
      data_aso: dataAso,
      data_homologacao: dataHomologacao,
      base_origem: baseOrigem,
      observacao,

      atualizado_em: new Date().toISOString(),
      atualizado_por: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("desligamentos_controle")
      .update(desligamentoAtualizado)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const alteracoes = montarAlteracoesDetalhadas(desligamentoAntes, data);

if (alteracoes.length > 0) {
  await registrarAuditoria({
    usuarioId: user!.id,
    usuarioEmail: emailLogado,
    acao: ACOES_AUDITORIA.DESLIGAMENTO_EDITADO,
    modulo: MODULOS_AUDITORIA.DESLIGAMENTO,
    detalhes: {
      desligamentoId: data.id,
      nome: data.nome,
      matricula: data.matricula,
      camposAlterados: alteracoes.map((item) => item.label),
      alteracoes,
    },
  });
}

const alteracaoAso = alteracoes.find((item) => item.campo === "data_aso");

if (alteracaoAso) {
  await registrarAuditoria({
    usuarioId: user!.id,
    usuarioEmail: emailLogado,
    acao: ACOES_AUDITORIA.DESLIGAMENTO_DATA_ASO_ALTERADA,
    modulo: MODULOS_AUDITORIA.DESLIGAMENTO,
    detalhes: {
      desligamentoId: data.id,
      nome: data.nome,
      matricula: data.matricula,
      antes: alteracaoAso.antes,
      depois: alteracaoAso.depois,
    },
  });
}

const alteracaoHomologacao = alteracoes.find(
  (item) => item.campo === "data_homologacao"
);

if (alteracaoHomologacao) {
  await registrarAuditoria({
    usuarioId: user!.id,
    usuarioEmail: emailLogado,
    acao: ACOES_AUDITORIA.DESLIGAMENTO_DATA_HOMOLOGACAO_ALTERADA,
    modulo: MODULOS_AUDITORIA.DESLIGAMENTO,
    detalhes: {
      desligamentoId: data.id,
      nome: data.nome,
      matricula: data.matricula,
      antes: alteracaoHomologacao.antes,
      depois: alteracaoHomologacao.depois,
    },
  });
}

    return Response.json({
      success: true,
      desligamento: data,
      message: "Desligamento atualizado com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
