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

type AdmissaoPayload = {
  id?: number;
  pref?: string;
  matricula?: string;
  nome?: string;
  cargo?: string;
  ch_edital?: string;
  alteracao_ch?: string;
  sirg?: boolean;
  horario?: string;
  exercicio?: string;
  data_nascimento?: string;
  cpf?: string;
  pis?: string;
  edital?: string;
  email?: string;
  carta_banco?: boolean;
  acesso_ponto?: boolean;
  registro_ponto?: string;
  base_destino?: string;
  enviar_email_colaborador?: boolean;
  observacao?: string;
};

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

function limparBooleano(valor: unknown) {
  return valor === true;
}

function normalizarBaseDestino(valor: unknown) {
  const texto = String(valor || "").trim();

  if (texto === "gestao_rh") {
    return "gestao_rh";
  }

  return "colaboradores";
}

function validarApenasNumeros(
  label: string,
  valor: string | null,
  exemplo: string
) {
  if (!valor) return null;

  if (!/^\d+$/.test(valor)) {
    return `${label} deve conter apenas números. Ex: ${exemplo}.`;
  }

  return null;
}

function validarMatricula(matricula: string | null) {
  if (!matricula) return null;

  if (!/^40\d{6}$/.test(matricula)) {
    return "Matrícula deve ter 8 dígitos e começar com 40. Ex: 40524579.";
  }

  return null;
}

function validarMaioridade(dataNascimento: string | null) {
  if (!dataNascimento) return null;

  const nascimento = new Date(`${dataNascimento}T00:00:00`);

  if (Number.isNaN(nascimento.getTime())) {
    return "Data de nascimento inválida.";
  }

  const hoje = new Date();

  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade -= 1;
  }

  if (idade < 18) {
    return "O colaborador precisa ter pelo menos 18 anos.";
  }

  return null;
}

function calcularChFinal(chEdital: string | null, alteracaoCh: string | null) {
  if (!chEdital && !alteracaoCh) return null;

  const edital = chEdital ? Number(chEdital) : 0;
  const alteracao = alteracaoCh ? Number(alteracaoCh) : 0;

  return String(edital + alteracao);
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

function validarPayload(body: AdmissaoPayload) {
  const matricula = limparTexto(body.matricula);
  const nome = limparTextoMaiusculo(body.nome);
  const cargo = limparTextoMaiusculo(body.cargo);
  const chEdital = limparTexto(body.ch_edital);
  const alteracaoCh = limparTexto(body.alteracao_ch);
  const dataNascimento = limparTexto(body.data_nascimento);
  const edital = limparTextoMaiusculo(body.edital);
  const observacao = limparTextoMaiusculo(body.observacao);
  const horario = limparTextoMaiusculo(body.horario);
  const registroPonto = limparTextoMaiusculo(body.registro_ponto);

  if (!nome) {
    return {
      erro: "O nome é obrigatório.",
      dados: null,
    };
  }

  const erroMatricula = validarMatricula(matricula);

  if (erroMatricula) {
    return {
      erro: erroMatricula,
      dados: null,
    };
  }

  const erroChEdital = validarApenasNumeros(
    "CH do edital",
    chEdital,
    "40"
  );

  if (erroChEdital) {
    return {
      erro: erroChEdital,
      dados: null,
    };
  }

  const erroAlteracaoCh = validarApenasNumeros(
    "Alteração de CH",
    alteracaoCh,
    "10"
  );

  if (erroAlteracaoCh) {
    return {
      erro: erroAlteracaoCh,
      dados: null,
    };
  }

  const erroMaioridade = validarMaioridade(dataNascimento);

  if (erroMaioridade) {
    return {
      erro: erroMaioridade,
      dados: null,
    };
  }

  return {
    erro: null,
    dados: {
      matricula,
      nome,
      cargo,
      chEdital,
      alteracaoCh,
      chFinal: calcularChFinal(chEdital, alteracaoCh),
      dataNascimento,
      edital,
      observacao,
      horario,
      registroPonto,
    },
  };
}

// lista admissões do controle
export async function GET(request: NextRequest) {
  try {
    const { supabase, usuarioLogado, erro } = await buscarUsuarioLogado();

    if (erro) return erro;

    if (
      !(await temPermissaoNoBanco(
        supabase,
        usuarioLogado?.perfil,
        PERMISSOES.ADMISSOES_VISUALIZAR
      ))
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const termoBusca = busca.replaceAll(",", " ").trim();

    let query = supabase
      .from("admissoes_controle")
      .select(
        `
        id,
        carimbo,
        pref,
        matricula,
        nome,
        cargo,
        ch_edital,
        alteracao_ch,
        ch_final,
        sirg,
        horario,
        exercicio,
        data_nascimento,
        cpf,
        pis,
        edital,
        email,
        carta_banco,
        acesso_ponto,
        registro_ponto,
        base_destino,
        enviar_email_colaborador,
        email_colaborador_enviado,
        email_colaborador_enviado_em,
        observacao,
        status_sede,
        enviado_sede_em,
        enviado_sede_por_email,
        status_script,
        subido_base_em,
        subido_base_por_email,
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
      admissoes: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// salva nova admissão
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (
      !(await temPermissaoNoBanco(supabase, usuarioLogado?.perfil, PERMISSOES.ADMISSOES_CRIAR))
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as AdmissaoPayload;

    const validacao = validarPayload(body);

    if (validacao.erro || !validacao.dados) {
      return Response.json(
        { success: false, error: validacao.erro },
        { status: 400 }
      );
    }

    const {
      matricula,
      nome,
      cargo,
      chEdital,
      alteracaoCh,
      chFinal,
      dataNascimento,
      edital,
      observacao,
      horario,
      registroPonto,
    } = validacao.dados;

    if (matricula) {
      const { data: admissaoExistente, error: erroBuscaDuplicidade } =
        await supabase
          .from("admissoes_controle")
          .select("id, nome, matricula")
          .eq("matricula", matricula)
          .maybeSingle();

      if (erroBuscaDuplicidade) {
        return Response.json(
          { success: false, error: erroBuscaDuplicidade.message },
          { status: 500 }
        );
      }

      if (admissaoExistente) {
        return Response.json(
          {
            success: false,
            error: `Já existe uma admissão cadastrada para a matrícula ${matricula}.`,
          },
          { status: 409 }
        );
      }
    }

    const emailLogado = user!.email!.toLowerCase();

    const novaAdmissao = {
      pref: limparTexto(body.pref),
      matricula,
      nome,
      cargo,

      ch_edital: chEdital,
      alteracao_ch: alteracaoCh,
      ch_final: chFinal,

      sirg: limparBooleano(body.sirg),
      horario,
      exercicio: limparTexto(body.exercicio),
      data_nascimento: dataNascimento,
      cpf: limparTexto(body.cpf),
      pis: limparTexto(body.pis),
      edital,
      email: limparEmail(body.email),
      carta_banco: limparBooleano(body.carta_banco),
      acesso_ponto: limparBooleano(body.acesso_ponto),
      registro_ponto: registroPonto,

      base_destino: normalizarBaseDestino(body.base_destino),

      enviar_email_colaborador: limparBooleano(
        body.enviar_email_colaborador
      ),

      observacao,

      status_sede: "pendente",
      status_script: "pendente",

      criado_por: user!.id,
      criado_por_email: emailLogado,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("admissoes_controle")
      .insert(novaAdmissao)
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
      acao: ACOES_AUDITORIA.ADMISSAO_CRIADA,
      modulo: MODULOS_AUDITORIA.ADMISSAO,
      detalhes: {
        admissaoId: data.id,
        nome: data.nome,
        matricula: data.matricula,
        cargo: data.cargo,
        baseDestino: data.base_destino,
      },
    });
    
    return Response.json({
      success: true,
      admissao: data,
      message: "Admissão salva com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// edita admissão já cadastrada
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, usuarioLogado, erro } =
      await buscarUsuarioLogado();

    if (erro) return erro;

    if (
      !(await temPermissaoNoBanco(supabase, usuarioLogado?.perfil, PERMISSOES.ADMISSOES_EDITAR))
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as AdmissaoPayload;

    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { success: false, error: "ID da admissão inválido." },
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
      matricula,
      nome,
      cargo,
      chEdital,
      alteracaoCh,
      chFinal,
      dataNascimento,
      edital,
      observacao,
      horario,
      registroPonto,
    } = validacao.dados;

    if (matricula) {
      const { data: admissaoExistente, error: erroBuscaDuplicidade } =
        await supabase
          .from("admissoes_controle")
          .select("id, nome, matricula")
          .eq("matricula", matricula)
          .neq("id", id)
          .maybeSingle();

      if (erroBuscaDuplicidade) {
        return Response.json(
          { success: false, error: erroBuscaDuplicidade.message },
          { status: 500 }
        );
      }

      if (admissaoExistente) {
        return Response.json(
          {
            success: false,
            error: `Já existe outra admissão cadastrada para a matrícula ${matricula}.`,
          },
          { status: 409 }
        );
      }
    }

    const { data: admissaoAntes, error: erroAdmissaoAntes } = await supabase
      .from("admissoes_controle")
      .select("*")
      .eq("id", id)
      .single();

    if (erroAdmissaoAntes) {
      return Response.json(
        { success: false, error: erroAdmissaoAntes.message },
        { status: 500 }
      );
    }

    const emailLogado = user!.email!.toLowerCase();

    const admissaoAtualizada = {
      pref: limparTexto(body.pref),
      matricula,
      nome,
      cargo,

      ch_edital: chEdital,
      alteracao_ch: alteracaoCh,
      ch_final: chFinal,

      sirg: limparBooleano(body.sirg),
      horario,
      exercicio: limparTexto(body.exercicio),
      data_nascimento: dataNascimento,
      cpf: limparTexto(body.cpf),
      pis: limparTexto(body.pis),
      edital,
      email: limparEmail(body.email),
      carta_banco: limparBooleano(body.carta_banco),
      acesso_ponto: limparBooleano(body.acesso_ponto),
      registro_ponto: registroPonto,

      base_destino: normalizarBaseDestino(body.base_destino),

      enviar_email_colaborador: limparBooleano(
        body.enviar_email_colaborador
      ),

      observacao,

      atualizado_em: new Date().toISOString(),
      atualizado_por: user!.id,
      atualizado_por_email: emailLogado,
    };

    const { data, error } = await supabase
      .from("admissoes_controle")
      .update(admissaoAtualizada)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const camposAuditaveis = [
      "pref",
      "matricula",
      "nome",
      "cargo",
      "ch_edital",
      "alteracao_ch",
      "ch_final",
      "sirg",
      "horario",
      "exercicio",
      "data_nascimento",
      "cpf",
      "pis",
      "edital",
      "email",
      "registro_ponto",
      "base_destino",
      "enviar_email_colaborador",
      "observacao",
    ];

    const camposAlterados = camposAuditaveis.filter((campo) => {
      const antes = admissaoAntes?.[campo] ?? null;
      const depois = data?.[campo] ?? null;

      return String(antes) !== String(depois);
    });

    if (camposAlterados.length > 0) {
      const camposAuditaveis = [
  "pref",
  "matricula",
  "nome",
  "cargo",
  "ch_edital",
  "alteracao_ch",
  "ch_final",
  "sirg",
  "horario",
  "exercicio",
  "data_nascimento",
  "cpf",
  "pis",
  "edital",
  "email",
  "registro_ponto",
  "base_destino",
  "enviar_email_colaborador",
  "observacao",
];

const camposAlterados = camposAuditaveis.filter((campo) => {
  const antes = admissaoAntes?.[campo] ?? null;
  const depois = data?.[campo] ?? null;

  return String(antes) !== String(depois);
});

if (camposAlterados.length > 0) {
  await registrarAuditoria({
    usuarioId: user!.id,
    usuarioEmail: emailLogado,
    acao: ACOES_AUDITORIA.ADMISSAO_EDITADA,
    modulo: MODULOS_AUDITORIA.ADMISSAO,
    detalhes: {
      admissaoId: data.id,
      nome: data.nome,
      matricula: data.matricula,
      camposAlterados,
    },
  });
}
    }

    return Response.json({
      success: true,
      admissao: data,
      message: "Admissão atualizada com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
