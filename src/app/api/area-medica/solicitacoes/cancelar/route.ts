import { createClient } from "@supabase/supabase-js";
import { notificarSolicitacaoMedica } from "@/lib/notificacoesMedicas";

export const dynamic = "force-dynamic";

function digitos(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

function normalizar(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function dataNormalizada(valor: unknown) {
  const texto = String(valor ?? "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return br
    ? `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`
    : "";
}

function cpfFormatado(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cpf = digitos(body.cpf);
    const nascimento = dataNormalizada(body.dataNascimento);
    const vinculoId = Number(body.vinculoId);
    const solicitacaoId = Number(body.solicitacaoId);
    const modalidade = String(body.modalidade ?? "");

    if (
      cpf.length !== 11 ||
      !nascimento ||
      !Number.isInteger(vinculoId) ||
      !Number.isInteger(solicitacaoId) ||
      !["substituicao", "troca"].includes(modalidade)
    ) {
      return Response.json(
        { success: false, error: "Dados de cancelamento inválidos." },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: vinculo } = await supabase
      .from("colaboradores")
      .select("id,matricula,cpf,data_nascimento,cargo")
      .eq("id", vinculoId)
      .in("cpf", [cpf, cpfFormatado(cpf)])
      .maybeSingle();

    if (
      !vinculo ||
      dataNormalizada(vinculo.data_nascimento) !== nascimento ||
      !normalizar(vinculo.cargo).includes("MEDICO")
    ) {
      return Response.json(
        {
          success: false,
          error: "Sua identificação expirou. Entre novamente na Área Médica.",
        },
        { status: 401 },
      );
    }

    const matriculaVinculo = digitos(vinculo.matricula);
    if (!matriculaVinculo) {
      return Response.json(
        {
          success: false,
          error: "O vínculo selecionado não possui matrícula válida.",
        },
        { status: 400 },
      );
    }

    const tabela =
      modalidade === "substituicao"
        ? "substituicoes_medicas"
        : "trocas_plantao_medicas";

    const { data: cancelada, error } = await supabase
      .from(tabela)
      .update({ status: "cancelado" })
      .eq("id", solicitacaoId)
      .eq("matricula_solicitante", matriculaVinculo)
      .eq("status", "recebido")
      .select("*")
      .maybeSingle();

    if (error) {
      const prazoEncerrado = error.message
        .toLowerCase()
        .includes("prazo para cancelamento");
      return Response.json(
        {
          success: false,
          error: prazoEncerrado
            ? "O prazo para cancelamento foi encerrado."
            : "Não foi possível cancelar esta solicitação.",
        },
        { status: prazoEncerrado ? 409 : 500 },
      );
    }

    if (!cancelada) {
      return Response.json(
        {
          success: false,
          error:
            "A solicitação não foi encontrada, já foi cancelada ou não foi criada por este vínculo.",
        },
        { status: 409 },
      );
    }

    let emailEnviado = true;
    try {
      const troca = modalidade === "troca";
      await notificarSolicitacaoMedica({
        evento: "cancelada",
        modalidade: troca ? "troca" : "substituicao",
        protocolo: cancelada.protocolo,
        status: "cancelado",
        destinatarios: [
          cancelada.email_solicitante,
          troca ? cancelada.email_solicitado : cancelada.email_substituto,
        ],
        solicitante: {
          papel: "Solicitante",
          nome: cancelada.nome_solicitante,
          matricula: cancelada.matricula_solicitante,
        },
        participante: {
          papel: troca ? "Solicitado" : "Substituto",
          nome: troca ? cancelada.nome_solicitado : cancelada.nome_substituto,
          matricula: troca
            ? cancelada.matricula_solicitado
            : cancelada.matricula_substituto,
        },
        plantoes: troca
          ? [
              {
                papel: "Plantão do solicitante",
                data: cancelada.data_plantao_solicitante,
                tipo: cancelada.tipo_plantao_solicitante,
              },
              {
                papel: "Plantão do solicitado",
                data: cancelada.data_plantao_solicitado,
                tipo: cancelada.tipo_plantao_solicitado,
              },
            ]
          : [
              {
                data: cancelada.data_plantao,
                tipo: cancelada.tipo_plantao,
              },
            ],
      });
    } catch (erroEmail) {
      emailEnviado = false;
      console.error("Solicitação cancelada, mas o e-mail falhou:", erroEmail);
    }

    return Response.json({
      success: true,
      message: "Solicitação cancelada com sucesso.",
      solicitacao: cancelada,
      emailEnviado,
      avisoEmail: emailEnviado
        ? null
        : "A solicitação foi cancelada, mas não foi possível enviar a confirmação por e-mail.",
    });
  } catch (error) {
    console.error("Erro ao cancelar solicitação médica:", error);
    return Response.json(
      { success: false, error: "Não foi possível cancelar esta solicitação." },
      { status: 500 },
    );
  }
}
