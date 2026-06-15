import { NextRequest } from "next/server";
import {
  ACOES_AUDITORIA,
  MODULOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type PermutaPayload = {
  id?: number | string;
  pref_saida?: string;
  matricula_saida?: string;
  nome_saida?: string;
  cargo_saida?: string;
  pref_entrada?: string;
  matricula_entrada?: string;
  nome_entrada?: string;
  cargo_entrada?: string;
  carga_horaria_entrada?: string;
  exercicio_entrada?: string;
  cpf_entrada?: string;
  pis_entrada?: string;
  data_nascimento_entrada?: string;
  email_entrada?: string;
  unidade_origem?: string;
  inicio_hmrg?: string;
  observacao?: string;
  status?: string;
};

const STATUS_PERMUTA = ["em_andamento", "concluida", "negada"];
const STATUS_RAPIDO = ["concluida", "negada"];

const CAMPOS_AUDITORIA_PERMUTA = [
  "pref_saida",
  "matricula_saida",
  "nome_saida",
  "cargo_saida",
  "pref_entrada",
  "matricula_entrada",
  "nome_entrada",
  "cargo_entrada",
  "carga_horaria_entrada",
  "exercicio_entrada",
  "cpf_entrada",
  "pis_entrada",
  "data_nascimento_entrada",
  "email_entrada",
  "unidade_origem",
  "inicio_hmrg",
  "observacao",
  "status",
] as const;

const LABELS_AUDITORIA_PERMUTA: Record<string, string> = {
  pref_saida: "Prefixo de quem sai",
  matricula_saida: "Matricula de quem sai",
  nome_saida: "Nome de quem sai",
  cargo_saida: "Cargo de quem sai",
  pref_entrada: "Prefixo de quem entra",
  matricula_entrada: "Matricula de quem entra",
  nome_entrada: "Nome de quem entra",
  cargo_entrada: "Cargo de quem entra",
  carga_horaria_entrada: "Carga horaria de quem entra",
  exercicio_entrada: "Admissao de quem entra",
  cpf_entrada: "CPF de quem entra",
  pis_entrada: "PIS de quem entra",
  data_nascimento_entrada: "Data de nascimento de quem entra",
  email_entrada: "E-mail de quem entra",
  unidade_origem: "Unidade de origem",
  inicio_hmrg: "Inicio no HMRG",
  observacao: "Observacao",
  status: "Status",
};

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

  if (Number.isNaN(data.getTime())) return null;

  return texto;
}

function validarMatricula(matricula: string | null, label: string) {
  if (!matricula) return `${label} e obrigatoria.`;
  if (!/^\d+$/.test(matricula)) return `${label} deve conter somente numeros.`;
  if (matricula.length !== 8) return `${label} deve ter 8 digitos.`;
  if (!matricula.startsWith("40")) return `${label} deve comecar com 40.`;

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

function formatarValorAuditoria(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "VAZIO";
  if (typeof valor === "boolean") return valor ? "SIM" : "NAO";

  return String(valor);
}

function montarAlteracoesDetalhadas(
  antes: Record<string, any> | null,
  depois: Record<string, any> | null
) {
  if (!antes || !depois) return [];

  return CAMPOS_AUDITORIA_PERMUTA.flatMap((campo) => {
    const valorAntes = antes[campo] ?? null;
    const valorDepois = depois[campo] ?? null;

    if (String(valorAntes) === String(valorDepois)) return [];

    return [
      {
        campo,
        label: LABELS_AUDITORIA_PERMUTA[campo] || campo,
        antes: formatarValorAuditoria(valorAntes),
        depois: formatarValorAuditoria(valorDepois),
      },
    ];
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

function validarPayload(body: PermutaPayload) {
  const prefSaida = limparTexto(body.pref_saida);
  const matriculaSaida = limparTexto(body.matricula_saida);
  const nomeSaida = limparTextoMaiusculo(body.nome_saida);
  const cargoSaida = limparTextoMaiusculo(body.cargo_saida);
  const prefEntrada = limparTexto(body.pref_entrada);
  const matriculaEntrada = limparTexto(body.matricula_entrada);
  const nomeEntrada = limparTextoMaiusculo(body.nome_entrada);
  const cargoEntrada = limparTextoMaiusculo(body.cargo_entrada);
  const cargaHorariaEntrada = limparTexto(body.carga_horaria_entrada);
  const exercicioEntrada = limparData(body.exercicio_entrada);
  const cpfEntrada = limparTexto(body.cpf_entrada);
  const pisEntrada = limparTexto(body.pis_entrada);
  const dataNascimentoEntrada = limparData(body.data_nascimento_entrada);
  const emailEntrada = limparEmail(body.email_entrada);
  const unidadeOrigem = limparTextoMaiusculo(body.unidade_origem);
  const inicioHmrg = limparData(body.inicio_hmrg);
  const observacao = limparTextoMaiusculo(body.observacao);
  const status = limparTextoObrigatorio(body.status).toLowerCase();
  const cargaNormalizada = normalizarCargaHoraria(cargaHorariaEntrada);

  const erroMatriculaSaida = validarMatricula(
    matriculaSaida,
    "Matricula de quem sai"
  );
  const erroMatriculaEntrada = validarMatricula(
    matriculaEntrada,
    "Matricula de quem entra"
  );

  if (erroMatriculaSaida) return { erro: erroMatriculaSaida, dados: null };
  if (erroMatriculaEntrada) return { erro: erroMatriculaEntrada, dados: null };

  if (matriculaSaida === matriculaEntrada) {
    return {
      erro: "As matriculas de quem sai e de quem entra devem ser diferentes.",
      dados: null,
    };
  }

  if (!nomeSaida) return { erro: "O nome de quem sai e obrigatorio.", dados: null };
  if (!cargoSaida) return { erro: "O cargo de quem sai e obrigatorio.", dados: null };
  if (!nomeEntrada) {
    return { erro: "O nome de quem entra e obrigatorio.", dados: null };
  }
  if (!cargoEntrada) {
    return { erro: "O cargo de quem entra e obrigatorio.", dados: null };
  }
  if (cargaNormalizada.erro) {
    return { erro: cargaNormalizada.erro, dados: null };
  }
  if (!exercicioEntrada) {
    return { erro: "A admissao de quem entra e obrigatoria.", dados: null };
  }
  if (!unidadeOrigem) {
    return { erro: "A unidade de origem e obrigatoria.", dados: null };
  }
  if (!inicioHmrg) {
    return { erro: "O inicio no HMRG e obrigatorio.", dados: null };
  }
  if (!STATUS_PERMUTA.includes(status)) {
    return { erro: "Status invalido.", dados: null };
  }

  return {
    erro: null,
    dados: {
      prefSaida,
      matriculaSaida,
      nomeSaida,
      cargoSaida,
      prefEntrada,
      matriculaEntrada,
      nomeEntrada,
      cargoEntrada,
      cargaHorariaEntrada: cargaNormalizada.valor,
      exercicioEntrada,
      cpfEntrada,
      pisEntrada,
      dataNascimentoEntrada,
      emailEntrada,
      unidadeOrigem,
      inicioHmrg,
      observacao,
      status,
    },
  };
}

function montarDetalhesBasicos(data: Record<string, any>) {
  return {
    permutaId: data.id,
    matriculaSaida: data.matricula_saida,
    nomeSaida: data.nome_saida,
    matriculaEntrada: data.matricula_entrada,
    nomeEntrada: data.nome_entrada,
    unidadeOrigem: data.unidade_origem,
    inicioHmrg: data.inicio_hmrg,
    status: data.status,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, usuarioLogado, erro } = await buscarUsuarioLogado();

    if (erro) return erro;

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.PERMUTAS)) {
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
      .from("permutas_controle")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(100);

    if (status) query = query.eq("status", status);

    if (termoBusca) {
      query = query.or(
        `matricula_saida.ilike.*${termoBusca}*,nome_saida.ilike.*${termoBusca}*,cargo_saida.ilike.*${termoBusca}*,matricula_entrada.ilike.*${termoBusca}*,nome_entrada.ilike.*${termoBusca}*,cargo_entrada.ilike.*${termoBusca}*,cpf_entrada.ilike.*${termoBusca}*,unidade_origem.ilike.*${termoBusca}*,observacao.ilike.*${termoBusca}*`
      );
    }

    const { data, error } = await query;

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, permutas: data ?? [] });
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

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.PERMUTAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as PermutaPayload;
    const validacao = validarPayload(body);

    if (validacao.erro || !validacao.dados) {
      return Response.json(
        { success: false, error: validacao.erro },
        { status: 400 }
      );
    }

    const d = validacao.dados;
    const emailLogado = user!.email!.toLowerCase();
    const agora = new Date().toISOString();

    const novaPermuta = {
      pref_saida: d.prefSaida,
      matricula_saida: d.matriculaSaida,
      nome_saida: d.nomeSaida,
      cargo_saida: d.cargoSaida,
      pref_entrada: d.prefEntrada,
      matricula_entrada: d.matriculaEntrada,
      nome_entrada: d.nomeEntrada,
      cargo_entrada: d.cargoEntrada,
      carga_horaria_entrada: d.cargaHorariaEntrada,
      exercicio_entrada: d.exercicioEntrada,
      cpf_entrada: d.cpfEntrada,
      pis_entrada: d.pisEntrada,
      data_nascimento_entrada: d.dataNascimentoEntrada,
      email_entrada: d.emailEntrada,
      unidade_origem: d.unidadeOrigem,
      inicio_hmrg: d.inicioHmrg,
      observacao: d.observacao,
      status: d.status,
      criado_em: agora,
      criado_por_id: user!.id,
      criado_por_email: emailLogado,
      atualizado_em: agora,
      atualizado_por_id: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("permutas_controle")
      .insert(novaPermuta)
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
      acao: ACOES_AUDITORIA.PERMUTA_CRIADA,
      modulo: MODULOS_AUDITORIA.PERMUTA,
      detalhes: montarDetalhesBasicos(data),
    });

    return Response.json({
      success: true,
      permuta: data,
      message: "Permuta salva com sucesso.",
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

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.PERMUTAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as PermutaPayload;
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { success: false, error: "ID da permuta invalido." },
        { status: 400 }
      );
    }

    const { data: permutaAtual, error: erroBusca } = await supabase
      .from("permutas_controle")
      .select("*")
      .eq("id", id)
      .single();

    if (erroBusca || !permutaAtual) {
      return Response.json(
        { success: false, error: "Permuta nao encontrada." },
        { status: 404 }
      );
    }

    const validacao = validarPayload(body);

    if (validacao.erro || !validacao.dados) {
      return Response.json(
        { success: false, error: validacao.erro },
        { status: 400 }
      );
    }

    const d = validacao.dados;
    const emailLogado = user!.email!.toLowerCase();
    const agora = new Date().toISOString();

    const dadosAtualizados = {
      pref_saida: d.prefSaida,
      matricula_saida: d.matriculaSaida,
      nome_saida: d.nomeSaida,
      cargo_saida: d.cargoSaida,
      pref_entrada: d.prefEntrada,
      matricula_entrada: d.matriculaEntrada,
      nome_entrada: d.nomeEntrada,
      cargo_entrada: d.cargoEntrada,
      carga_horaria_entrada: d.cargaHorariaEntrada,
      exercicio_entrada: d.exercicioEntrada,
      cpf_entrada: d.cpfEntrada,
      pis_entrada: d.pisEntrada,
      data_nascimento_entrada: d.dataNascimentoEntrada,
      email_entrada: d.emailEntrada,
      unidade_origem: d.unidadeOrigem,
      inicio_hmrg: d.inicioHmrg,
      observacao: d.observacao,
      status: d.status,
      atualizado_em: agora,
      atualizado_por_id: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("permutas_controle")
      .update(dadosAtualizados)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const alteracoes = montarAlteracoesDetalhadas(permutaAtual, data);

    await registrarAuditoria({
      usuarioId: user!.id,
      usuarioEmail: emailLogado,
      acao: ACOES_AUDITORIA.PERMUTA_EDITADA,
      modulo: MODULOS_AUDITORIA.PERMUTA,
      detalhes: {
        ...montarDetalhesBasicos(data),
        camposAlterados: alteracoes.map((item) => item.campo),
        alteracoes,
      },
    });

    if (String(permutaAtual.status) !== String(data.status)) {
      await registrarAuditoria({
        usuarioId: user!.id,
        usuarioEmail: emailLogado,
        acao: ACOES_AUDITORIA.PERMUTA_STATUS_ALTERADO,
        modulo: MODULOS_AUDITORIA.PERMUTA,
        detalhes: {
          ...montarDetalhesBasicos(data),
          statusAnterior: permutaAtual.status,
          statusNovo: data.status,
        },
      });
    }

    return Response.json({
      success: true,
      permuta: data,
      message: "Permuta atualizada com sucesso.",
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

    if (!temPermissao(usuarioLogado?.perfil, PERMISSOES.PERMUTAS)) {
      return Response.json(
        { success: false, error: "Sem permissao." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as PermutaPayload;
    const id = Number(body.id);
    const status = limparTextoObrigatorio(body.status).toLowerCase();

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { success: false, error: "ID da permuta invalido." },
        { status: 400 }
      );
    }

    if (!STATUS_RAPIDO.includes(status)) {
      return Response.json(
        { success: false, error: "Status invalido para acao rapida." },
        { status: 400 }
      );
    }

    const { data: permutaAtual, error: erroBusca } = await supabase
      .from("permutas_controle")
      .select("*")
      .eq("id", id)
      .single();

    if (erroBusca || !permutaAtual) {
      return Response.json(
        { success: false, error: "Permuta nao encontrada." },
        { status: 404 }
      );
    }

    if (permutaAtual.status !== "em_andamento") {
      return Response.json(
        {
          success: false,
          error: "Apenas permutas em andamento podem ter status rapido.",
        },
        { status: 400 }
      );
    }

    const emailLogado = user!.email!.toLowerCase();
    const agora = new Date().toISOString();

    const { data, error } = await supabase
      .from("permutas_controle")
      .update({
        status,
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
      acao: ACOES_AUDITORIA.PERMUTA_STATUS_ALTERADO,
      modulo: MODULOS_AUDITORIA.PERMUTA,
      detalhes: {
        ...montarDetalhesBasicos(data),
        statusAnterior: permutaAtual.status,
        statusNovo: data.status,
      },
    });

    return Response.json({
      success: true,
      permuta: data,
      message: "Status da permuta atualizado com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
