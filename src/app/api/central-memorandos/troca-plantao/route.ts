import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";
import {
  ACOES_AUDITORIA,
  MODULOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";
import {
  gerarComprovanteMemorandoPdf,
  nomeArquivoComprovante,
  type DadosComprovanteMemorando,
} from "@/lib/comprovanteMemorandoPdf";
import { emailTemFormatoValido, normalizarEmail } from "@/lib/emailSeguro";
import { notificarMemorandoCriado } from "@/lib/notificacoesMemorandos";

export const dynamic = "force-dynamic";

type TipoPlantao = "SD" | "SN" | "24";

function somenteDigitos(valor: unknown) {
  return String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);
}

function texto(valor: unknown) {
  return String(valor || "").trim();
}

function normalizarTipoPlantao(valor: unknown) {
  const tipo = texto(valor);
  return tipo === "24 horas" ? "24" : tipo;
}

function tipoValido(valor: string): valor is TipoPlantao {
  return valor === "SD" || valor === "SN" || valor === "24";
}

function mesmaCh(tipoA: TipoPlantao, tipoB: TipoPlantao) {
  const chA = tipoA === "24" ? 24 : 12;
  const chB = tipoB === "24" ? 24 : 12;

  return chA === chB;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function categoriaFuncao(funcao: string) {
  const normalizada = normalizarTexto(funcao);

  if (normalizada.includes("MEDIC")) return "MEDICO";
  if (normalizada.includes("TECNIC") && normalizada.includes("ENFERM")) {
    return "TECNICO_ENFERMAGEM";
  }
  if (normalizada.includes("AUXILIAR") && normalizada.includes("ENFERM")) {
    return "AUXILIAR_ENFERMAGEM";
  }
  if (normalizada.includes("ENFERMEIR")) return "ENFERMEIRO";

  return normalizada.replace(/\s+/g, " ").trim();
}

function mesmoMes(dataA: string, dataB: string) {
  if (!dataA || !dataB) return false;
  return dataA.slice(0, 7) === dataB.slice(0, 7);
}

function mesmoDiaMesmoTipo(
  dataA: string,
  tipoA: string,
  dataB: string,
  tipoB: string,
) {
  if (!dataA || !dataB || !tipoA || !tipoB) return false;
  return dataA === dataB && tipoA === tipoB;
}

function dataNoMesAtual(dataTexto: string) {
  const data = new Date(`${dataTexto}T12:00:00`);
  const agora = new Date();

  return (
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth()
  );
}

function limparBusca(valor: string | null) {
  return String(valor || "")
    .trim()
    .replace(/[,%*()]/g, " ")
    .replace(/\s+/g, " ");
}

function competenciaValida(valor: string | null) {
  const textoCompetencia = texto(valor);
  return /^\d{4}-\d{2}$/.test(textoCompetencia) ? textoCompetencia : "";
}

function proximaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return mes === 12
    ? `${ano + 1}-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function dadosComprovanteTroca(registro: any): DadosComprovanteMemorando {
  return {
    modalidade: "troca_plantao",
    protocolo: texto(registro.protocolo),
    status: texto(registro.status) || "recebido",
    participantes: [
      {
        papel: "Solicitante",
        nome: texto(registro.nome_solicitante),
        matricula: texto(registro.matricula_solicitante),
      },
      {
        papel: "Solicitado",
        nome: texto(registro.nome_solicitado),
        matricula: texto(registro.matricula_solicitado),
      },
    ],
    plantoes: [
      {
        papel: "Plantão do solicitante",
        data: texto(registro.data_plantao_solicitante),
        tipo: normalizarTipoPlantao(registro.tipo_plantao_solicitante),
      },
      {
        papel: "Plantão do solicitado",
        data: texto(registro.data_plantao_solicitado),
        tipo: normalizarTipoPlantao(registro.tipo_plantao_solicitado),
      },
    ],
  };
}

async function obterUsuarioAtivo(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      usuario: null,
      erro: Response.json(
        { success: false, error: "Não autenticado." },
        { status: 401 },
      ),
    };
  }

  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("nome, email, perfil, status")
    .eq("email", user.email.toLowerCase())
    .single();

  if (!usuarioLogado || usuarioLogado.status !== "ativo") {
    return {
      usuario: null,
      erro: Response.json(
        { success: false, error: "Usuário sem acesso ativo." },
        { status: 403 },
      ),
    };
  }

  if (
    !(await temPermissaoNoBanco(
      supabase,
      usuarioLogado.perfil,
      PERMISSOES.CENTRAL_MEMORANDOS,
    ))
  ) {
    return {
      usuario: null,
      erro: Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 },
      ),
    };
  }

  return {
    usuario: {
      auth: user,
      dados: usuarioLogado,
    },
    erro: null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { erro } = await obterUsuarioAtivo(supabase);

    if (erro) {
      return erro;
    }

    const { searchParams } = new URL(request.url);

    const comprovanteId = texto(searchParams.get("comprovante"));
    if (comprovanteId) {
      const { data: registro, error } = await supabase
        .from("trocas_plantao")
        .select(
          "protocolo, status, matricula_solicitante, nome_solicitante, data_plantao_solicitante, tipo_plantao_solicitante, matricula_solicitado, nome_solicitado, data_plantao_solicitado, tipo_plantao_solicitado",
        )
        .eq("id", comprovanteId)
        .single();

      if (error || !registro) {
        return Response.json(
          { success: false, error: "Troca de plantão não encontrada." },
          { status: 404 },
        );
      }

      const pdf = await gerarComprovanteMemorandoPdf(
        dadosComprovanteTroca(registro),
      );
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${nomeArquivoComprovante(registro.protocolo)}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const pagina = Math.max(Number(searchParams.get("page") || "1"), 1);
    const limite = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "50"), 1),
      100,
    );

    const busca = limparBusca(searchParams.get("busca"));
    const nome = limparBusca(searchParams.get("nome"));
    const status = texto(searchParams.get("status"));
    const mesReferencia = texto(searchParams.get("mes"));
    const competencia = competenciaValida(searchParams.get("competencia"));
    const dataPlantao = texto(searchParams.get("data"));

    const inicio = (pagina - 1) * limite;
    const fim = inicio + limite - 1;

    let query = supabase.from("trocas_plantao").select(
      `
        id,
        protocolo,
        mes_referencia,
        numero_mensal,
        matricula_solicitante,
        nome_solicitante,
        funcao_solicitante,
        email_solicitante,
        data_plantao_solicitante,
        tipo_plantao_solicitante,
        matricula_solicitado,
        nome_solicitado,
        funcao_solicitado,
        data_plantao_solicitado,
        tipo_plantao_solicitado,
        status,
        recebido_em,
        alterado_em,
        cancelado_em,
        criado_por_nome,
        alterado_por_nome,
        cancelado_por_nome,
        observacao_alteracao,
        observacao_cancelamento,
        criado_em,
        atualizado_em
      `,
      { count: "exact" },
    );

    if (status) {
      query = query.eq("status", status);
    }

    if (mesReferencia) {
      query = query.eq("mes_referencia", mesReferencia);
    }

    if (competencia) {
      query = query
        .gte("data_plantao_solicitante", `${competencia}-01`)
        .lt(
          "data_plantao_solicitante",
          `${proximaCompetencia(competencia)}-01`,
        );
    }

    if (dataPlantao) {
      query = query.or(
        `data_plantao_solicitante.eq.${dataPlantao},data_plantao_solicitado.eq.${dataPlantao}`,
      );
    }

    if (nome.length >= 2) {
      query = query.or(
        `nome_solicitante.ilike.*${nome}*,nome_solicitado.ilike.*${nome}*`,
      );
    }

    if (busca.length >= 2) {
      const digitos = busca.replace(/\D/g, "");

      query = query.or(
        [
          `protocolo.ilike.*${busca}*`,
          `nome_solicitante.ilike.*${busca}*`,
          `nome_solicitado.ilike.*${busca}*`,
          `criado_por_nome.ilike.*${busca}*`,
          digitos.length >= 3 ? `matricula_solicitante.ilike.*${digitos}*` : "",
          digitos.length >= 3 ? `matricula_solicitado.ilike.*${digitos}*` : "",
        ]
          .filter(Boolean)
          .join(","),
      );
    }

    const { data, error, count } = await query
      .order("recebido_em", { ascending: false })
      .range(inicio, fim);

    if (error) {
      return Response.json(
        {
          success: false,
          error: "Não foi possível carregar as trocas de plantão.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      registros: data ?? [],
      total: count ?? 0,
      pagina,
      limite,
      totalPaginas: Math.ceil((count ?? 0) / limite),
    });
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível consultar as trocas." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { usuario, erro } = await obterUsuarioAtivo(supabase);

    if (erro) {
      return erro;
    }

    const usuarioLogado = usuario!.dados;
    const user = usuario!.auth;

    const body = await request.json();

    const matriculaSolicitante = somenteDigitos(body.matricula_solicitante);
    const matriculaSolicitado = somenteDigitos(body.matricula_solicitado);

    const tipoSolicitante = normalizarTipoPlantao(
      body.tipo_plantao_solicitante,
    );
    const tipoSolicitado = normalizarTipoPlantao(body.tipo_plantao_solicitado);

    const dataSolicitante = texto(body.data_plantao_solicitante);
    const dataSolicitado = texto(body.data_plantao_solicitado);

    if (matriculaSolicitante.length !== 8 || matriculaSolicitado.length !== 8) {
      return Response.json(
        { success: false, error: "As matrículas devem conter 8 dígitos." },
        { status: 400 },
      );
    }

    if (matriculaSolicitante === matriculaSolicitado) {
      return Response.json(
        {
          success: false,
          error: "Solicitante e solicitado não podem ter a mesma matrícula.",
        },
        { status: 400 },
      );
    }

    if (!tipoValido(tipoSolicitante) || !tipoValido(tipoSolicitado)) {
      return Response.json(
        { success: false, error: "Tipo de plantão inválido." },
        { status: 400 },
      );
    }

    if (!mesmaCh(tipoSolicitante, tipoSolicitado)) {
      return Response.json(
        {
          success: false,
          error:
            "A troca precisa respeitar a equivalência de carga horária: SD/SN com SD/SN, ou 24 com 24.",
        },
        { status: 400 },
      );
    }

    if (!dataSolicitante || !dataSolicitado) {
      return Response.json(
        { success: false, error: "As datas dos plantões são obrigatórias." },
        { status: 400 },
      );
    }

    if (!mesmoMes(dataSolicitante, dataSolicitado)) {
      return Response.json(
        {
          success: false,
          error: "A troca precisa acontecer dentro do mesmo mes de referencia.",
        },
        { status: 400 },
      );
    }

    if (
      mesmoDiaMesmoTipo(
        dataSolicitante,
        tipoSolicitante,
        dataSolicitado,
        tipoSolicitado,
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "No mesmo dia, o tipo de plantao precisa ser diferente.",
        },
        { status: 400 },
      );
    }

    const podeDataForaCompetencia =
      usuarioLogado.perfil === "Admin" || usuarioLogado.perfil === "Gerente";

    if (
      !podeDataForaCompetencia &&
      (!dataNoMesAtual(dataSolicitante) || !dataNoMesAtual(dataSolicitado))
    ) {
      return Response.json(
        {
          success: false,
          error:
            "As datas dos plantões precisam estar dentro do mês e ano atual.",
        },
        { status: 400 },
      );
    }

    const { data: colaboradores, error: erroColaboradores } = await supabase
      .from("colaboradores")
      .select("matricula, nome, cargo, email")
      .in("matricula", [matriculaSolicitante, matriculaSolicitado]);

    if (erroColaboradores) {
      return Response.json(
        { success: false, error: "Não foi possível validar os colaboradores." },
        { status: 500 },
      );
    }

    const solicitante = colaboradores?.find(
      (item: any) => item.matricula === matriculaSolicitante,
    );

    const solicitado = colaboradores?.find(
      (item: any) => item.matricula === matriculaSolicitado,
    );

    if (!solicitante || !solicitado) {
      return Response.json(
        {
          success: false,
          error:
            "Uma das matrículas não se encontra ativa na base de colaboradores.",
        },
        { status: 400 },
      );
    }

    const funcaoSolicitante = texto(solicitante.cargo);
    const funcaoSolicitado = texto(solicitado.cargo);

    if (
      categoriaFuncao(funcaoSolicitante) !== categoriaFuncao(funcaoSolicitado)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "A troca não pode ser solicitada entre colaboradores de funções diferentes.",
        },
        { status: 400 },
      );
    }

    const emailSolicitante = normalizarEmail(
      body.email_solicitante || solicitante.email,
    );
    const emailSolicitado = normalizarEmail(body.email_solicitado);

    if (!emailTemFormatoValido(emailSolicitante)) {
      return Response.json(
        { success: false, error: "Informe um e-mail válido para o solicitante." },
        { status: 400 },
      );
    }
    if (emailSolicitado && !emailTemFormatoValido(emailSolicitado)) {
      return Response.json(
        { success: false, error: "O e-mail opcional do solicitado é inválido." },
        { status: 400 },
      );
    }

    const { data: troca, error: erroInsert } = await supabase
      .from("trocas_plantao")
      .insert({
        matricula_solicitante: matriculaSolicitante,
        nome_solicitante: texto(solicitante.nome),
        funcao_solicitante: funcaoSolicitante,
        email_solicitante: emailSolicitante,

        data_plantao_solicitante: dataSolicitante,
        tipo_plantao_solicitante: tipoSolicitante,

        matricula_solicitado: matriculaSolicitado,
        nome_solicitado: texto(solicitado.nome),
        funcao_solicitado: funcaoSolicitado,

        data_plantao_solicitado: dataSolicitado,
        tipo_plantao_solicitado: tipoSolicitado,

        status: "recebido",
        criado_por_nome: texto(usuarioLogado.nome) || texto(user.email),
      })
      .select("id, protocolo")
      .single();

    if (erroInsert) {
      console.error("Erro ao salvar troca de plantão:", erroInsert);

      return Response.json(
        {
          success: false,
          error:
            erroInsert.message || "Não foi possível salvar a troca de plantão.",
          details: erroInsert,
        },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: ACOES_AUDITORIA.TROCA_PLANTAO_CRIADA,
      modulo: MODULOS_AUDITORIA.CENTRAL_MEMORANDOS,
      detalhes: {
        trocaPlantaoId: troca.id,
        protocolo: troca.protocolo,
        matriculaSolicitante,
        matriculaSolicitado,
        dataPlantaoSolicitante: dataSolicitante,
        tipoPlantaoSolicitante: tipoSolicitante,
        dataPlantaoSolicitado: dataSolicitado,
        tipoPlantaoSolicitado: tipoSolicitado,
        status: "recebido",
      },
    });

    let emailEnviado = true;
    try {
      await notificarMemorandoCriado({
        destinatarios: [emailSolicitante, emailSolicitado],
        dados: dadosComprovanteTroca({
          protocolo: troca.protocolo,
          status: "recebido",
          matricula_solicitante: matriculaSolicitante,
          nome_solicitante: solicitante.nome,
          data_plantao_solicitante: dataSolicitante,
          tipo_plantao_solicitante: tipoSolicitante,
          matricula_solicitado: matriculaSolicitado,
          nome_solicitado: solicitado.nome,
          data_plantao_solicitado: dataSolicitado,
          tipo_plantao_solicitado: tipoSolicitado,
        }),
      });
    } catch (erroEmail) {
      emailEnviado = false;
      console.error("Troca registrada, mas o e-mail falhou:", erroEmail);
    }

    return Response.json({
      success: true,
      troca,
      emailEnviado,
      avisoEmail: emailEnviado
        ? null
        : "A troca foi registrada, mas não foi possível enviar a confirmação por e-mail.",
      message: `Troca de plantão registrada com sucesso. Protocolo: ${troca.protocolo}`,
    });
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível registrar a troca." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { usuario, erro } = await obterUsuarioAtivo(supabase);

    if (erro) {
      return erro;
    }

    const usuarioLogado = usuario!.dados;
    const user = usuario!.auth;
    const body = await request.json();

    const id = texto(body.id);
    const tipoSolicitante = normalizarTipoPlantao(
      body.tipo_plantao_solicitante,
    );
    const tipoSolicitado = normalizarTipoPlantao(body.tipo_plantao_solicitado);
    const dataSolicitante = texto(body.data_plantao_solicitante);
    const dataSolicitado = texto(body.data_plantao_solicitado);
    const emailSolicitante = texto(body.email_solicitante).toLowerCase();

    if (!id) {
      return Response.json(
        { success: false, error: "ID da troca obrigatorio." },
        { status: 400 },
      );
    }

    if (!dataSolicitante || !dataSolicitado) {
      return Response.json(
        { success: false, error: "As datas dos plantoes sao obrigatorias." },
        { status: 400 },
      );
    }

    if (!tipoValido(tipoSolicitante) || !tipoValido(tipoSolicitado)) {
      return Response.json(
        { success: false, error: "Tipo de plantao invalido." },
        { status: 400 },
      );
    }

    if (!mesmaCh(tipoSolicitante, tipoSolicitado)) {
      return Response.json(
        {
          success: false,
          error:
            "A troca precisa respeitar a equivalencia de carga horaria: SD/SN com SD/SN, ou 24 com 24.",
        },
        { status: 400 },
      );
    }

    const { data: trocaAtual, error: erroBusca } = await supabase
      .from("trocas_plantao")
      .select(
        `
        id,
        protocolo,
        status,
        matricula_solicitante,
        nome_solicitante,
        funcao_solicitante,
        email_solicitante,
        data_plantao_solicitante,
        tipo_plantao_solicitante,
        matricula_solicitado,
        nome_solicitado,
        funcao_solicitado,
        data_plantao_solicitado,
        tipo_plantao_solicitado
      `,
      )
      .eq("id", id)
      .single();

    if (erroBusca || !trocaAtual) {
      return Response.json(
        { success: false, error: "Troca de plantao nao encontrada." },
        { status: 404 },
      );
    }

    if (trocaAtual.status !== "recebido") {
      return Response.json(
        {
          success: false,
          error: "Apenas trocas recebidas podem ser alteradas.",
        },
        { status: 400 },
      );
    }

    if (!mesmoMes(dataSolicitante, dataSolicitado)) {
      return Response.json(
        {
          success: false,
          error: "A troca precisa acontecer dentro do mesmo mes de referencia.",
        },
        { status: 400 },
      );
    }

    if (
      mesmoDiaMesmoTipo(
        dataSolicitante,
        tipoSolicitante,
        dataSolicitado,
        tipoSolicitado,
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "No mesmo dia, o tipo de plantao precisa ser diferente.",
        },
        { status: 400 },
      );
    }

    const podeDataForaCompetencia =
      usuarioLogado.perfil === "Admin" || usuarioLogado.perfil === "Gerente";

    if (
      !podeDataForaCompetencia &&
      (!dataNoMesAtual(dataSolicitante) || !dataNoMesAtual(dataSolicitado))
    ) {
      return Response.json(
        {
          success: false,
          error:
            "As datas dos plantoes precisam estar dentro do mes e ano atual.",
        },
        { status: 400 },
      );
    }

    const agora = new Date().toISOString();
    const nomeUsuario = texto(usuarioLogado.nome) || texto(usuarioLogado.email);

    const dadosAtualizacao = {
      email_solicitante: emailSolicitante,
      data_plantao_solicitante: dataSolicitante,
      tipo_plantao_solicitante: tipoSolicitante,
      data_plantao_solicitado: dataSolicitado,
      tipo_plantao_solicitado: tipoSolicitado,
      status: "alterado",
      alterado_em: agora,
      alterado_por_nome: nomeUsuario,
      atualizado_em: agora,
    };

    const alteracoes: Record<string, { antes: unknown; depois: unknown }> = {};

    const comparar = (campo: keyof typeof dadosAtualizacao, antes: unknown) => {
      const depois = dadosAtualizacao[campo];

      if (String(antes ?? "") !== String(depois ?? "")) {
        alteracoes[campo] = { antes, depois };
      }
    };

    comparar("email_solicitante", trocaAtual.email_solicitante);
    comparar("data_plantao_solicitante", trocaAtual.data_plantao_solicitante);
    comparar("tipo_plantao_solicitante", trocaAtual.tipo_plantao_solicitante);
    comparar("data_plantao_solicitado", trocaAtual.data_plantao_solicitado);
    comparar("tipo_plantao_solicitado", trocaAtual.tipo_plantao_solicitado);
    comparar("status", trocaAtual.status);

    const { data, error } = await supabase
      .from("trocas_plantao")
      .update(dadosAtualizacao)
      .eq("id", id)
      .select("id, protocolo, status")
      .single();

    if (error) {
      return Response.json(
        { success: false, error: "Nao foi possivel alterar a troca." },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: ACOES_AUDITORIA.TROCA_PLANTAO_EDITADA,
      modulo: MODULOS_AUDITORIA.CENTRAL_MEMORANDOS,
      detalhes: {
        trocaPlantaoId: trocaAtual.id,
        protocolo: trocaAtual.protocolo,
        matriculaSolicitante: trocaAtual.matricula_solicitante,
        matriculaSolicitado: trocaAtual.matricula_solicitado,
        camposAlterados: Object.keys(alteracoes),
        alteracoes,
        statusAnterior: trocaAtual.status,
        statusNovo: "alterado",
      },
    });

    return Response.json({
      success: true,
      troca: data,
      message: "Troca de plantao alterada com sucesso.",
    });
  } catch {
    return Response.json(
      { success: false, error: "Nao foi possivel alterar a troca." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { usuario, erro } = await obterUsuarioAtivo(supabase);

    if (erro) {
      return erro;
    }

    const usuarioLogado = usuario!.dados;
    const user = usuario!.auth;
    const body = await request.json();
    const id = texto(body.id);
    const statusNovo = texto(body.status).toLowerCase();
    const observacao = texto(body.observacao);

    if (!id) {
      return Response.json(
        { success: false, error: "ID da troca obrigatorio." },
        { status: 400 },
      );
    }

    if (statusNovo !== "cancelado") {
      return Response.json(
        { success: false, error: "Status invalido." },
        { status: 400 },
      );
    }

    const { data: trocaAtual, error: erroBusca } = await supabase
      .from("trocas_plantao")
      .select(
        "id, protocolo, status, matricula_solicitante, matricula_solicitado",
      )
      .eq("id", id)
      .single();

    if (erroBusca || !trocaAtual) {
      return Response.json(
        { success: false, error: "Troca de plantao nao encontrada." },
        { status: 404 },
      );
    }

    if (trocaAtual.status !== "recebido") {
      return Response.json(
        {
          success: false,
          error: "Apenas trocas recebidas podem ser canceladas.",
        },
        { status: 400 },
      );
    }

    const agora = new Date().toISOString();
    const nomeUsuario = texto(usuarioLogado.nome) || texto(usuarioLogado.email);

    const dadosAtualizacao: Record<string, string> = {
      status: statusNovo,
      atualizado_em: agora,
    };

    dadosAtualizacao.cancelado_em = agora;
    dadosAtualizacao.cancelado_por_nome = nomeUsuario;
    dadosAtualizacao.observacao_cancelamento = observacao;

    const { data, error } = await supabase
      .from("trocas_plantao")
      .update(dadosAtualizacao)
      .eq("id", id)
      .select("id, protocolo, status")
      .single();

    if (error) {
      return Response.json(
        { success: false, error: "Nao foi possivel atualizar a troca." },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: ACOES_AUDITORIA.TROCA_PLANTAO_CANCELADA,
      modulo: MODULOS_AUDITORIA.CENTRAL_MEMORANDOS,
      detalhes: {
        trocaPlantaoId: trocaAtual.id,
        protocolo: trocaAtual.protocolo,
        matriculaSolicitante: trocaAtual.matricula_solicitante,
        matriculaSolicitado: trocaAtual.matricula_solicitado,
        statusAnterior: trocaAtual.status,
        statusNovo,
        observacao,
      },
    });

    return Response.json({
      success: true,
      troca: data,
      message: "Status atualizado com sucesso.",
    });
  } catch {
    return Response.json(
      { success: false, error: "Nao foi possivel atualizar a troca." },
      { status: 500 },
    );
  }
}
