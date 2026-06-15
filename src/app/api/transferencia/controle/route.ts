import { NextRequest } from "next/server";
import {
  ACOES_AUDITORIA,
  MODULOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type TransferenciaPayload = {
  id?: number | string;
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
  tipo_movimento?: string;
  cedente?: string;
  cessionario?: string;
  inicio_nova_unidade?: string;
  observacao?: string;
  status?: string;
};

const TIPOS_MOVIMENTO = ["entrada", "saida"];
const STATUS_TRANSFERENCIA = ["em_andamento", "concluida", "negada"];
const STATUS_RAPIDO = ["concluida", "negada"];

const CAMPOS_AUDITORIA_TRANSFERENCIA = [
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
  "tipo_movimento",
  "cedente",
  "cessionario",
  "inicio_nova_unidade",
  "observacao",
  "status",
] as const;

const LABELS_AUDITORIA_TRANSFERENCIA: Record<string, string> = {
  pref: "Prefixo",
  matricula: "Matricula",
  nome: "Nome",
  cargo: "Cargo",
  carga_horaria: "Carga horaria",
  exercicio: "Admissao",
  cpf: "CPF",
  pis: "PIS",
  data_nascimento: "Data de nascimento",
  email: "E-mail",
  tipo_movimento: "Tipo de movimento",
  cedente: "Cedente",
  cessionario: "Cessionario",
  inicio_nova_unidade: "Inicio na nova unidade",
  observacao: "Observacao",
  status: "Status",
};

function formatarValorAuditoria(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return "VAZIO";
  }

  if (typeof valor === "boolean") {
    return valor ? "SIM" : "NAO";
  }

  return String(valor);
}

function montarAlteracoesDetalhadas(
  antes: Record<string, any> | null,
  depois: Record<string, any> | null
) {
  if (!antes || !depois) return [];

  return CAMPOS_AUDITORIA_TRANSFERENCIA.flatMap((campo) => {
    const valorAntes = antes[campo] ?? null;
    const valorDepois = depois[campo] ?? null;

    if (String(valorAntes) === String(valorDepois)) {
      return [];
    }

    return [
      {
        campo,
        label: LABELS_AUDITORIA_TRANSFERENCIA[campo] || campo,
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

function limparTextoObrigatorio(valor: unknown) {
  return limparTexto(valor) || "";
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

function normalizarCargaHoraria(valor: string | null) {
  if (!valor) return { erro: "A carga horaria e obrigatoria.", valor: null };

  const texto = valor.trim();
  const match = texto.match(/^(\d{1,2})(?:\s*HORAS?)?$/i);

  if (!match) {
    return {
      erro: "Carga horaria deve conter somente numeros entre 10 e 40.",
      valor: null,
    };
  }

  const quantidade = Number(match[1]);

  if (!Number.isInteger(quantidade) || quantidade < 10 || quantidade > 40) {
    return {
      erro: "Carga horaria deve ser um numero entre 10 e 40.",
      valor: null,
    };
  }

  return { erro: null, valor: `${quantidade} HORAS` };
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
        { success: false, error: "Nao autenticado." },
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
        { success: false, error: "Usuario sem acesso ativo." },
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

function validarPayload(body: TransferenciaPayload) {
  const matricula = limparTexto(body.matricula);
  const nome = limparTextoMaiusculo(body.nome);
  const cargo = limparTextoMaiusculo(body.cargo);
  const cargaHoraria = limparTexto(body.carga_horaria);
  const exercicio = limparData(body.exercicio);
  const tipoMovimento = limparTextoObrigatorio(
    body.tipo_movimento
  ).toLowerCase();
  const cedente = limparTextoMaiusculo(body.cedente);
  const cessionario = limparTextoMaiusculo(body.cessionario);
  const inicioNovaUnidade = limparData(body.inicio_nova_unidade);
  const status = limparTextoObrigatorio(body.status).toLowerCase();

  const erroMatricula = validarMatricula(matricula);
  const cargaHorariaNormalizada = normalizarCargaHoraria(cargaHoraria);

  if (erroMatricula) {
    return {
      erro: erroMatricula,
      dados: null,
    };
  }

  if (!nome) {
    return {
      erro: "O nome e obrigatorio.",
      dados: null,
    };
  }

  if (!cargo) {
    return {
      erro: "O cargo e obrigatorio.",
      dados: null,
    };
  }

  if (cargaHorariaNormalizada.erro) {
    return {
      erro: cargaHorariaNormalizada.erro,
      dados: null,
    };
  }

  if (!exercicio) {
    return {
      erro: "O exercicio e obrigatorio.",
      dados: null,
    };
  }

  if (!TIPOS_MOVIMENTO.includes(tipoMovimento)) {
    return {
      erro: "Tipo de movimento invalido.",
      dados: null,
    };
  }

  if (!cedente) {
    return {
      erro: "O cedente e obrigatorio.",
      dados: null,
    };
  }

  if (!cessionario) {
    return {
      erro: "O cessionario e obrigatorio.",
      dados: null,
    };
  }

  if (!inicioNovaUnidade) {
    return {
      erro: "O inicio na nova unidade e obrigatorio.",
      dados: null,
    };
  }

  if (!STATUS_TRANSFERENCIA.includes(status)) {
    return {
      erro: "Status invalido.",
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
      cargaHoraria: cargaHorariaNormalizada.valor,
      exercicio,
      cpf: limparTexto(body.cpf),
      pis: limparTexto(body.pis),
      dataNascimento: limparData(body.data_nascimento),
      email: limparEmail(body.email),
      tipoMovimento,
      cedente,
      cessionario,
      inicioNovaUnidade,
      observacao: limparTextoMaiusculo(body.observacao),
      status,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, usuarioLogado, erro } = await buscarUsuarioLogado();

    if (erro) return erro;

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.TRANSFERENCIAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const termoBusca = busca.replaceAll(",", " ").trim();

    let query = supabase
      .from("transferencias_controle")
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
        tipo_movimento,
        cedente,
        cessionario,
        inicio_nova_unidade,
        observacao,
        status,
        computado_base,
        computado_em,
        computado_por_id,
        computado_por_email,
        criado_em,
        criado_por_id,
        criado_por_email,
        atualizado_em,
        atualizado_por_id,
        atualizado_por_email
      `
      )
      .order("criado_em", { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq("status", status);
    }

    if (termoBusca) {
      query = query.or(
        `matricula.ilike.*${termoBusca}*,nome.ilike.*${termoBusca}*,cpf.ilike.*${termoBusca}*,cargo.ilike.*${termoBusca}*,cedente.ilike.*${termoBusca}*,cessionario.ilike.*${termoBusca}*,observacao.ilike.*${termoBusca}*`
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
      transferencias: data ?? [],
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.TRANSFERENCIAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as TransferenciaPayload;
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
      tipoMovimento,
      cedente,
      cessionario,
      inicioNovaUnidade,
      observacao,
      status,
    } = validacao.dados;

    const emailLogado = user!.email!.toLowerCase();
    const agora = new Date().toISOString();

    const novaTransferencia = {
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
      tipo_movimento: tipoMovimento,
      cedente,
      cessionario,
      inicio_nova_unidade: inicioNovaUnidade,
      observacao,
      status,
      criado_em: agora,
      criado_por_id: user!.id,
      criado_por_email: emailLogado,
      atualizado_em: agora,
      atualizado_por_id: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("transferencias_controle")
      .insert(novaTransferencia)
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
      acao: ACOES_AUDITORIA.TRANSFERENCIA_CRIADA,
      modulo: MODULOS_AUDITORIA.TRANSFERENCIA,
      detalhes: {
        transferenciaId: data.id,
        matricula: data.matricula,
        nome: data.nome,
        tipoMovimento: data.tipo_movimento,
        cedente: data.cedente,
        cessionario: data.cessionario,
        inicioNovaUnidade: data.inicio_nova_unidade,
        status: data.status,
      },
    });

    return Response.json({
      success: true,
      transferencia: data,
      message: "Transferencia salva com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.TRANSFERENCIAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as TransferenciaPayload;
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { success: false, error: "ID da transferencia invalido." },
        { status: 400 }
      );
    }

    const { data: transferenciaAntes, error: erroTransferenciaAntes } =
      await supabase
        .from("transferencias_controle")
        .select("*")
        .eq("id", id)
        .single();

    if (erroTransferenciaAntes) {
      return Response.json(
        { success: false, error: erroTransferenciaAntes.message },
        { status: 500 }
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
      tipoMovimento,
      cedente,
      cessionario,
      inicioNovaUnidade,
      observacao,
      status,
    } = validacao.dados;

    const emailLogado = user!.email!.toLowerCase();
    const agora = new Date().toISOString();

    const transferenciaAtualizada = {
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
      tipo_movimento: tipoMovimento,
      cedente,
      cessionario,
      inicio_nova_unidade: inicioNovaUnidade,
      observacao,
      status,
      atualizado_em: agora,
      atualizado_por_id: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("transferencias_controle")
      .update(transferenciaAtualizada)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const alteracoes = montarAlteracoesDetalhadas(transferenciaAntes, data);

    await registrarAuditoria({
      usuarioId: user!.id,
      usuarioEmail: emailLogado,
      acao: ACOES_AUDITORIA.TRANSFERENCIA_EDITADA,
      modulo: MODULOS_AUDITORIA.TRANSFERENCIA,
      detalhes: {
        transferenciaId: data.id,
        matricula: data.matricula,
        nome: data.nome,
        camposAlterados: alteracoes.map((item) => item.label),
        alteracoes,
      },
    });

    if (String(transferenciaAntes.status) !== String(data.status)) {
      await registrarAuditoria({
        usuarioId: user!.id,
        usuarioEmail: emailLogado,
        acao: ACOES_AUDITORIA.TRANSFERENCIA_STATUS_ALTERADO,
        modulo: MODULOS_AUDITORIA.TRANSFERENCIA,
        detalhes: {
          transferenciaId: data.id,
          matricula: data.matricula,
          nome: data.nome,
          statusAnterior: transferenciaAntes.status,
          statusNovo: data.status,
        },
      });
    }

    return Response.json({
      success: true,
      transferencia: data,
      message: "Transferencia atualizada com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.TRANSFERENCIAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Pick<
      TransferenciaPayload,
      "id" | "status"
    >;
    const id = Number(body.id);
    const statusNovo = limparTextoObrigatorio(body.status).toLowerCase();

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { success: false, error: "ID da transferencia invalido." },
        { status: 400 }
      );
    }

    if (!STATUS_RAPIDO.includes(statusNovo)) {
      return Response.json(
        { success: false, error: "Status rapido invalido." },
        { status: 400 }
      );
    }

    const { data: transferenciaAntes, error: erroTransferenciaAntes } =
      await supabase
        .from("transferencias_controle")
        .select("*")
        .eq("id", id)
        .single();

    if (erroTransferenciaAntes) {
      return Response.json(
        { success: false, error: erroTransferenciaAntes.message },
        { status: 500 }
      );
    }

    if (transferenciaAntes.status !== "em_andamento") {
      return Response.json(
        {
          success: false,
          error:
            "Somente transferencias em andamento podem ser concluidas ou negadas.",
        },
        { status: 409 }
      );
    }

    const emailLogado = user!.email!.toLowerCase();
    const agora = new Date().toISOString();

    const { data, error } = await supabase
      .from("transferencias_controle")
      .update({
        status: statusNovo,
        atualizado_em: agora,
        atualizado_por_id: user!.id,
        atualizado_por_email: emailLogado,
      })
      .eq("id", id)
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
      acao: ACOES_AUDITORIA.TRANSFERENCIA_STATUS_ALTERADO,
      modulo: MODULOS_AUDITORIA.TRANSFERENCIA,
      detalhes: {
        transferenciaId: data.id,
        matricula: data.matricula,
        nome: data.nome,
        statusAnterior: transferenciaAntes.status,
        statusNovo: data.status,
      },
    });

    return Response.json({
      success: true,
      transferencia: data,
      message: "Status da transferencia atualizado com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
