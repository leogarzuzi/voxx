import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES, temPermissao } from "@/lib/perfis";

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
  const nome = limparTexto(body.nome);
  const chEdital = limparTexto(body.ch_edital);
  const alteracaoCh = limparTexto(body.alteracao_ch);

  if (!nome) {
    return {
      erro: "O nome é obrigatório.",
      dados: null,
    };
  }

  const erroMatricula = validarApenasNumeros(
    "Matrícula",
    matricula,
    "40524579"
  );

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

  return {
    erro: null,
    dados: {
      matricula,
      nome,
      chEdital,
      alteracaoCh,
      chFinal: calcularChFinal(chEdital, alteracaoCh),
    },
  };
}

// lista admissões do controle
export async function GET(request: NextRequest) {
  try {
    const { supabase, usuarioLogado, erro } = await buscarUsuarioLogado();

    if (erro) return erro;

    if (
      !temPermissao(
        usuarioLogado?.perfil,
        PERMISSOES.ADMISSOES_VISUALIZAR
      )
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
      !temPermissao(usuarioLogado?.perfil, PERMISSOES.ADMISSOES_CRIAR)
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

    const { matricula, nome, chEdital, alteracaoCh, chFinal } =
      validacao.dados;

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
      cargo: limparTexto(body.cargo),

      ch_edital: chEdital,
      alteracao_ch: alteracaoCh,
      ch_final: chFinal,

      sirg: limparBooleano(body.sirg),
      horario: limparTexto(body.horario),
      exercicio: limparTexto(body.exercicio),
      data_nascimento: limparTexto(body.data_nascimento),
      cpf: limparTexto(body.cpf),
      pis: limparTexto(body.pis),
      edital: limparTexto(body.edital),
      email: limparTexto(body.email),
      carta_banco: limparBooleano(body.carta_banco),
      acesso_ponto: limparBooleano(body.acesso_ponto),
      registro_ponto: limparTexto(body.registro_ponto),

      base_destino: normalizarBaseDestino(body.base_destino),

      enviar_email_colaborador: limparBooleano(
        body.enviar_email_colaborador
      ),

      observacao: limparTexto(body.observacao),

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
      !temPermissao(usuarioLogado?.perfil, PERMISSOES.ADMISSOES_EDITAR)
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

    const { matricula, nome, chEdital, alteracaoCh, chFinal } =
      validacao.dados;

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

    const emailLogado = user!.email!.toLowerCase();

    const admissaoAtualizada = {
      pref: limparTexto(body.pref),
      matricula,
      nome,
      cargo: limparTexto(body.cargo),

      ch_edital: chEdital,
      alteracao_ch: alteracaoCh,
      ch_final: chFinal,

      sirg: limparBooleano(body.sirg),
      horario: limparTexto(body.horario),
      exercicio: limparTexto(body.exercicio),
      data_nascimento: limparTexto(body.data_nascimento),
      cpf: limparTexto(body.cpf),
      pis: limparTexto(body.pis),
      edital: limparTexto(body.edital),
      email: limparTexto(body.email),
      carta_banco: limparBooleano(body.carta_banco),
      acesso_ponto: limparBooleano(body.acesso_ponto),
      registro_ponto: limparTexto(body.registro_ponto),

      base_destino: normalizarBaseDestino(body.base_destino),

      enviar_email_colaborador: limparBooleano(
        body.enviar_email_colaborador
      ),

      observacao: limparTexto(body.observacao),

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