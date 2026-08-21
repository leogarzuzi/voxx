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

function texto(valor: unknown) {
  return String(valor || "").trim();
}

function somenteDigitos(valor: unknown) {
  return String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);
}

function limparBusca(valor: string | null) {
  return String(valor || "")
    .trim()
    .replace(/[,%*()]/g, " ")
    .replace(/\s+/g, " ");
}

function competenciaValida(valor: string | null) {
  const valorNormalizado = texto(valor);
  return /^\d{4}-\d{2}$/.test(valorNormalizado) ? valorNormalizado : "";
}

function proximaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return mes === 12
    ? `${ano + 1}-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function normalizarTipoPlantao(valor: unknown) {
  const tipo = texto(valor);
  return tipo === "24 horas" ? "24" : tipo;
}

function tipoValido(valor: string): valor is TipoPlantao {
  return valor === "SD" || valor === "SN" || valor === "24";
}

function competenciaAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function dataNoMesAtual(dataTexto: string) {
  return Boolean(dataTexto) && dataTexto.slice(0, 7) === competenciaAtual();
}

function mesmoDiaMesmoTipo(
  dataA: string,
  tipoA: string,
  dataB: string,
  tipoB: string,
) {
  return Boolean(
    dataA && dataB && tipoA && tipoB && dataA === dataB && tipoA === tipoB,
  );
}

function dadosComprovanteBancoHoras(registro: any): DadosComprovanteMemorando {
  return {
    modalidade: "banco_horas",
    protocolo: texto(registro.protocolo),
    status: texto(registro.status) || "recebido",
    participantes: [
      {
        papel: "Funcionário solicitante",
        nome: texto(registro.nome),
        matricula: texto(registro.matricula),
      },
    ],
    plantoes: [
      {
        papel: "Plantão original",
        data: texto(registro.data_plantao_original),
        tipo: normalizarTipoPlantao(registro.tipo_plantao_original),
      },
      {
        papel: "Novo plantão",
        data: texto(registro.data_novo_plantao),
        tipo: normalizarTipoPlantao(registro.tipo_novo_plantao),
      },
    ],
  };
}

async function gerarProtocolo(supabase: any) {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const anoCurto = String(agora.getFullYear()).slice(-2);
  const prefixo = `HMRG/BH${mes}${anoCurto}-`;

  const { count, error } = await supabase
    .from("banco_horas_controle")
    .select("id", { count: "exact", head: true })
    .like("protocolo", `${prefixo}%`);

  if (error) {
    throw new Error("Não foi possível gerar o protocolo do banco de horas.");
  }

  const sequencial = String((count || 0) + 1).padStart(4, "0");
  return `${prefixo}${sequencial}`;
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

    if (erro) return erro;

    const { searchParams } = new URL(request.url);
    const comprovanteId = texto(searchParams.get("comprovante"));
    if (comprovanteId) {
      const { data: registro, error } = await supabase
        .from("banco_horas_controle")
        .select(
          "protocolo, status, matricula, nome, data_plantao_original, tipo_plantao_original, data_novo_plantao, tipo_novo_plantao",
        )
        .eq("id", comprovanteId)
        .single();

      if (error || !registro) {
        return Response.json(
          { success: false, error: "Banco de horas não encontrado." },
          { status: 404 },
        );
      }

      const pdf = await gerarComprovanteMemorandoPdf(
        dadosComprovanteBancoHoras(registro),
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
      Math.max(Number(searchParams.get("pageSize") || "100"), 1),
      150,
    );
    const busca = limparBusca(searchParams.get("busca"));
    const status = texto(searchParams.get("status"));
    const competencia = competenciaValida(searchParams.get("competencia"));
    const inicio = (pagina - 1) * limite;
    const fim = inicio + limite - 1;

    let query = supabase.from("banco_horas_controle").select(
      `
        id,
        protocolo,
        status,
        recebido_em,
        matricula,
        nome,
        funcao,
        email,
        data_plantao_original,
        tipo_plantao_original,
        data_novo_plantao,
        tipo_novo_plantao,
        criado_por_nome,
        cancelado_em,
        cancelado_por_nome,
        criado_em,
        atualizado_em
      `,
      { count: "exact" },
    );

    if (status) query = query.eq("status", status);

    if (competencia) {
      query = query
        .gte("data_plantao_original", `${competencia}-01`)
        .lt("data_plantao_original", `${proximaCompetencia(competencia)}-01`);
    }

    if (busca.length >= 2) {
      const digitos = busca.replace(/\D/g, "");
      query = query.or(
        [
          `protocolo.ilike.*${busca}*`,
          `nome.ilike.*${busca}*`,
          `funcao.ilike.*${busca}*`,
          `criado_por_nome.ilike.*${busca}*`,
          digitos.length >= 3 ? `matricula.ilike.*${digitos}*` : "",
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
          error: "Não foi possível carregar o banco de horas.",
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
      { success: false, error: "Não foi possível consultar o banco de horas." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { usuario, erro } = await obterUsuarioAtivo(supabase);

    if (erro) return erro;

    const usuarioLogado = usuario!.dados;
    const user = usuario!.auth;
    const body = await request.json();

    const matricula = somenteDigitos(body.matricula);
    const dataOriginal = texto(body.data_plantao_original);
    const tipoOriginal = normalizarTipoPlantao(body.tipo_plantao_original);
    const dataNovoPlantao = texto(body.data_novo_plantao);
    const tipoNovoPlantao = normalizarTipoPlantao(body.tipo_novo_plantao);
    const emailInformado = texto(body.email).toLowerCase();

    if (matricula.length !== 8) {
      return Response.json(
        { success: false, error: "A matrícula deve conter 8 dígitos." },
        { status: 400 },
      );
    }

    if (!dataOriginal || !dataNovoPlantao) {
      return Response.json(
        { success: false, error: "As datas dos plantões são obrigatórias." },
        { status: 400 },
      );
    }

    if (!tipoValido(tipoOriginal) || !tipoValido(tipoNovoPlantao)) {
      return Response.json(
        { success: false, error: "Tipo de plantão inválido." },
        { status: 400 },
      );
    }
    if (!dataNoMesAtual(dataOriginal) || !dataNoMesAtual(dataNovoPlantao)) {
      return Response.json(
        {
          success: false,
          error:
            "O banco de horas só pode ser solicitado para plantões do mês atual.",
        },
        { status: 400 },
      );
    }

    if (
      mesmoDiaMesmoTipo(
        dataOriginal,
        tipoOriginal,
        dataNovoPlantao,
        tipoNovoPlantao,
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "No mesmo dia, o tipo do plantão precisa ser diferente.",
        },
        { status: 400 },
      );
    }

    const { data: colaborador, error: erroColaborador } = await supabase
      .from("colaboradores")
      .select("matricula, nome, cargo, email")
      .eq("matricula", matricula)
      .maybeSingle();

    if (erroColaborador) {
      return Response.json(
        { success: false, error: "Não foi possível validar o colaborador." },
        { status: 500 },
      );
    }

    if (!colaborador) {
      return Response.json(
        {
          success: false,
          error:
            "Esta matrícula não se encontra ativa na base de colaboradores.",
        },
        { status: 400 },
      );
    }

    const protocolo = await gerarProtocolo(supabase);
    const nomeUsuario = texto(usuarioLogado.nome) || texto(user.email);
    const email = normalizarEmail(emailInformado || colaborador.email);

    if (!emailTemFormatoValido(email)) {
      return Response.json(
        { success: false, error: "Informe um e-mail válido para o funcionário." },
        { status: 400 },
      );
    }

    const { data: bancoHoras, error: erroInsert } = await supabase
      .from("banco_horas_controle")
      .insert({
        protocolo,
        matricula,
        nome: texto(colaborador.nome),
        funcao: texto(colaborador.cargo),
        email,
        data_plantao_original: dataOriginal,
        tipo_plantao_original: tipoOriginal,
        data_novo_plantao: dataNovoPlantao,
        tipo_novo_plantao: tipoNovoPlantao,
        status: "recebido",
        criado_por_id: user.id,
        criado_por_email: texto(user.email).toLowerCase(),
        criado_por_nome: nomeUsuario,
      })
      .select("id, protocolo")
      .single();

    if (erroInsert) {
      return Response.json(
        {
          success: false,
          error:
            erroInsert.message || "Não foi possível salvar o banco de horas.",
        },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: ACOES_AUDITORIA.BANCO_HORAS_CRIADO,
      modulo: MODULOS_AUDITORIA.CENTRAL_MEMORANDOS,
      detalhes: {
        bancoHorasId: bancoHoras.id,
        protocolo: bancoHoras.protocolo,
        matricula,
        nome: texto(colaborador.nome),
        funcao: texto(colaborador.cargo),
        dataPlantaoOriginal: dataOriginal,
        tipoPlantaoOriginal: tipoOriginal,
        dataNovoPlantao,
        tipoNovoPlantao,
        status: "recebido",
      },
    });

    let emailEnviado = true;
    try {
      await notificarMemorandoCriado({
        destinatarios: [email],
        dados: dadosComprovanteBancoHoras({
          protocolo: bancoHoras.protocolo,
          status: "recebido",
          matricula,
          nome: colaborador.nome,
          data_plantao_original: dataOriginal,
          tipo_plantao_original: tipoOriginal,
          data_novo_plantao: dataNovoPlantao,
          tipo_novo_plantao: tipoNovoPlantao,
        }),
      });
    } catch (erroEmail) {
      emailEnviado = false;
      console.error("Banco de horas registrado, mas o e-mail falhou:", erroEmail);
    }

    return Response.json({
      success: true,
      bancoHoras,
      emailEnviado,
      avisoEmail: emailEnviado
        ? null
        : "O banco de horas foi registrado, mas não foi possível enviar a confirmação por e-mail.",
      message: `Banco de horas registrado com sucesso. Protocolo: ${bancoHoras.protocolo}`,
    });
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível registrar o banco de horas." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { usuario, erro } = await obterUsuarioAtivo(supabase);

    if (erro) return erro;

    const usuarioLogado = usuario!.dados;
    const user = usuario!.auth;
    const body = await request.json();

    const id = texto(body.id);
    const dataOriginal = texto(body.data_plantao_original);
    const tipoOriginal = normalizarTipoPlantao(body.tipo_plantao_original);
    const dataNovoPlantao = texto(body.data_novo_plantao);
    const tipoNovoPlantao = normalizarTipoPlantao(body.tipo_novo_plantao);
    const email = texto(body.email).toLowerCase();

    if (!id) {
      return Response.json(
        { success: false, error: "ID do banco de horas obrigatório." },
        { status: 400 },
      );
    }

    if (!dataOriginal || !dataNovoPlantao) {
      return Response.json(
        { success: false, error: "As datas dos plantões são obrigatórias." },
        { status: 400 },
      );
    }

    if (!tipoValido(tipoOriginal) || !tipoValido(tipoNovoPlantao)) {
      return Response.json(
        { success: false, error: "Tipo de plantão inválido." },
        { status: 400 },
      );
    }

    if (!dataNoMesAtual(dataOriginal) || !dataNoMesAtual(dataNovoPlantao)) {
      return Response.json(
        {
          success: false,
          error:
            "O banco de horas só pode ser solicitado para plantões do mês atual.",
        },
        { status: 400 },
      );
    }

    if (
      mesmoDiaMesmoTipo(
        dataOriginal,
        tipoOriginal,
        dataNovoPlantao,
        tipoNovoPlantao,
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "No mesmo dia, o tipo do plantão precisa ser diferente.",
        },
        { status: 400 },
      );
    }

    const { data: atual, error: erroBusca } = await supabase
      .from("banco_horas_controle")
      .select(
        "id, protocolo, status, matricula, nome, funcao, email, data_plantao_original, tipo_plantao_original, data_novo_plantao, tipo_novo_plantao",
      )
      .eq("id", id)
      .single();

    if (erroBusca || !atual) {
      return Response.json(
        { success: false, error: "Banco de horas não encontrado." },
        { status: 404 },
      );
    }

    if (atual.status !== "recebido") {
      return Response.json(
        {
          success: false,
          error: "Apenas solicitações recebidas podem ser alteradas.",
        },
        { status: 400 },
      );
    }

    const agora = new Date().toISOString();
    const nomeUsuario = texto(usuarioLogado.nome) || texto(usuarioLogado.email);
    const dadosAtualizacao = {
      email,
      data_plantao_original: dataOriginal,
      tipo_plantao_original: tipoOriginal,
      data_novo_plantao: dataNovoPlantao,
      tipo_novo_plantao: tipoNovoPlantao,
      status: "alterado",
      atualizado_em: agora,
      alterado_em: agora,
      alterado_por_id: user.id,
      alterado_por_email: texto(user.email).toLowerCase(),
      alterado_por_nome: nomeUsuario,
    };

    const alteracoes: Record<string, { antes: unknown; depois: unknown }> = {};
    const comparar = (campo: keyof typeof dadosAtualizacao, antes: unknown) => {
      const depois = dadosAtualizacao[campo];
      if (String(antes ?? "") !== String(depois ?? "")) {
        alteracoes[campo] = { antes, depois };
      }
    };

    comparar("email", atual.email);
    comparar("data_plantao_original", atual.data_plantao_original);
    comparar("tipo_plantao_original", atual.tipo_plantao_original);
    comparar("data_novo_plantao", atual.data_novo_plantao);
    comparar("tipo_novo_plantao", atual.tipo_novo_plantao);
    comparar("status", atual.status);

    const { data, error } = await supabase
      .from("banco_horas_controle")
      .update(dadosAtualizacao)
      .eq("id", id)
      .select("id, protocolo, status")
      .single();

    if (error) {
      return Response.json(
        { success: false, error: "Não foi possível alterar o banco de horas." },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: ACOES_AUDITORIA.BANCO_HORAS_EDITADO,
      modulo: MODULOS_AUDITORIA.CENTRAL_MEMORANDOS,
      detalhes: {
        bancoHorasId: atual.id,
        protocolo: atual.protocolo,
        matricula: atual.matricula,
        nome: atual.nome,
        camposAlterados: Object.keys(alteracoes),
        alteracoes,
        statusAnterior: atual.status,
        statusNovo: "alterado",
      },
    });

    return Response.json({
      success: true,
      bancoHoras: data,
      message: "Banco de horas alterado com sucesso.",
    });
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível alterar o banco de horas." },
      { status: 500 },
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { usuario, erro } = await obterUsuarioAtivo(supabase);

    if (erro) return erro;

    const usuarioLogado = usuario!.dados;
    const user = usuario!.auth;
    const body = await request.json();
    const id = texto(body.id);
    const statusNovo = texto(body.status).toLowerCase();

    if (!id) {
      return Response.json(
        { success: false, error: "ID do banco de horas obrigatório." },
        { status: 400 },
      );
    }

    if (statusNovo !== "cancelado") {
      return Response.json(
        { success: false, error: "Status inválido." },
        { status: 400 },
      );
    }

    const { data: atual, error: erroBusca } = await supabase
      .from("banco_horas_controle")
      .select("id, protocolo, status, matricula, nome")
      .eq("id", id)
      .single();

    if (erroBusca || !atual) {
      return Response.json(
        { success: false, error: "Banco de horas não encontrado." },
        { status: 404 },
      );
    }

    if (atual.status !== "recebido") {
      return Response.json(
        {
          success: false,
          error: "Apenas solicitações recebidas podem ser canceladas.",
        },
        { status: 400 },
      );
    }

    const agora = new Date().toISOString();
    const nomeUsuario = texto(usuarioLogado.nome) || texto(usuarioLogado.email);

    const { data, error } = await supabase
      .from("banco_horas_controle")
      .update({
        status: "cancelado",
        cancelado_em: agora,
        cancelado_por_id: user.id,
        cancelado_por_email: texto(user.email).toLowerCase(),
        cancelado_por_nome: nomeUsuario,
        atualizado_em: agora,
      })
      .eq("id", id)
      .select("id, protocolo, status")
      .single();

    if (error) {
      return Response.json(
        {
          success: false,
          error: "Não foi possível cancelar o banco de horas.",
        },
        { status: 500 },
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: ACOES_AUDITORIA.BANCO_HORAS_CANCELADO,
      modulo: MODULOS_AUDITORIA.CENTRAL_MEMORANDOS,
      detalhes: {
        bancoHorasId: atual.id,
        protocolo: atual.protocolo,
        matricula: atual.matricula,
        nome: atual.nome,
        statusAnterior: atual.status,
        statusNovo: "cancelado",
      },
    });

    return Response.json({
      success: true,
      bancoHoras: data,
      message: "Banco de horas cancelado com sucesso.",
    });
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível cancelar o banco de horas." },
      { status: 500 },
    );
  }
}
