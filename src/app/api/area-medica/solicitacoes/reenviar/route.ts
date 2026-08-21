import { createClient } from "@supabase/supabase-js";
import { notificarSolicitacaoMedica } from "@/lib/notificacoesMedicas";
import { emailTemFormatoValido, normalizarEmail } from "@/lib/emailSeguro";

export const dynamic = "force-dynamic";

const ERROS_DOMINIO: Record<string, string> = {
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.com.br": "yahoo.com.br",
};

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
function validarEmail(valor: unknown, obrigatorio: boolean) {
  const email = normalizarEmail(valor);
  if (!email)
    return obrigatorio
      ? { email, erro: "Informe o e-mail." }
      : { email, erro: "" };
  if (!emailTemFormatoValido(email))
    return { email, erro: "Informe um e-mail válido." };
  const sugestao = ERROS_DOMINIO[email.split("@")[1]];
  return sugestao
    ? {
        email,
        erro: `O domínio parece incorreto. Você quis dizer “${sugestao}”?`,
      }
    : { email, erro: "" };
}

export async function POST(request: Request) {
  let logId: number | null = null;
  try {
    const body = await request.json();
    const cpf = digitos(body.cpf);
    const nascimento = dataNormalizada(body.dataNascimento);
    const vinculoId = Number(body.vinculoId);
    const solicitacaoId = Number(body.solicitacaoId);
    const modalidade = String(body.modalidade ?? "");
    const emailSolicitante = validarEmail(body.emailSolicitante, true);
    const emailParticipante = validarEmail(body.emailParticipante, false);

    if (
      cpf.length !== 11 ||
      !nascimento ||
      !Number.isInteger(vinculoId) ||
      !Number.isInteger(solicitacaoId) ||
      !["substituicao", "troca"].includes(modalidade)
    )
      return Response.json(
        { success: false, error: "Dados de reenvio inválidos." },
        { status: 400 },
      );
    if (emailSolicitante.erro || emailParticipante.erro)
      return Response.json(
        {
          success: false,
          error: emailSolicitante.erro || emailParticipante.erro,
        },
        { status: 400 },
      );

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
    )
      return Response.json(
        { success: false, error: "Sua identificação expirou." },
        { status: 401 },
      );

    const matricula = digitos(vinculo.matricula);
    const tabela =
      modalidade === "substituicao"
        ? "substituicoes_medicas"
        : "trocas_plantao_medicas";
    let registro: Record<string, any> | null = null;
    if (modalidade === "substituicao") {
      const consulta = await supabase
        .from("substituicoes_medicas")
        .select("*")
        .eq("id", solicitacaoId)
        .or(
          `matricula_solicitante.eq.${matricula},matricula_substituto.eq.${matricula}`,
        )
        .maybeSingle();
      registro = consulta.data;
    } else {
      const consulta = await supabase
        .from("trocas_plantao_medicas")
        .select("*")
        .eq("id", solicitacaoId)
        .or(
          `matricula_solicitante.eq.${matricula},matricula_solicitado.eq.${matricula}`,
        )
        .maybeSingle();
      registro = consulta.data;
    }
    if (!registro)
      return Response.json(
        {
          success: false,
          error: "Solicitação não encontrada para este vínculo.",
        },
        { status: 404 },
      );

    const destinatarios = [
      ...new Set(
        [emailSolicitante.email, emailParticipante.email].filter(Boolean),
      ),
    ];
    const { data: log, error: erroLimite } = await supabase
      .from("reenvios_protocolos_medicos")
      .insert({
        modalidade,
        solicitacao_id: solicitacaoId,
        protocolo: registro.protocolo,
        requisitante_matricula: matricula,
        destinatarios,
      })
      .select("id")
      .single();
    if (erroLimite) {
      const mensagem = erroLimite.message.includes("3 reenvios")
        ? "O limite de 3 reenvios em 24 horas foi atingido."
        : erroLimite.message.includes("2 minutos")
          ? "Aguarde 2 minutos antes de reenviar novamente."
          : "Não foi possível autorizar o reenvio.";
      return Response.json(
        { success: false, error: mensagem },
        { status: 429 },
      );
    }
    logId = log.id;

    const troca = modalidade === "troca";
    const nomeParticipante = troca
      ? registro.nome_solicitado
      : registro.nome_substituto;
    const matriculaParticipante = troca
      ? registro.matricula_solicitado
      : registro.matricula_substituto;
    await notificarSolicitacaoMedica({
      evento: "reenvio",
      modalidade: troca ? "troca" : "substituicao",
      protocolo: registro.protocolo,
      status: registro.status === "cancelado" ? "cancelado" : "recebido",
      destinatarios,
      solicitante: {
        papel: "Solicitante",
        nome: registro.nome_solicitante,
        matricula: registro.matricula_solicitante,
      },
      participante: {
        papel: troca ? "Solicitado" : "Substituto",
        nome: nomeParticipante,
        matricula: matriculaParticipante,
      },
      plantoes: troca
        ? [
            {
              papel: "Plantão do solicitante",
              data: registro.data_plantao_solicitante,
              tipo: registro.tipo_plantao_solicitante,
            },
            {
              papel: "Plantão do solicitado",
              data: registro.data_plantao_solicitado,
              tipo: registro.tipo_plantao_solicitado,
            },
          ]
        : [
            {
              data: registro.data_plantao,
              tipo: registro.tipo_plantao,
            },
          ],
    });

    const atualizacao =
      modalidade === "substituicao"
        ? {
            email_solicitante: emailSolicitante.email,
            email_substituto: emailParticipante.email || null,
          }
        : {
            email_solicitante: emailSolicitante.email,
            email_solicitado: emailParticipante.email || null,
          };
    await Promise.all([
      supabase.from(tabela).update(atualizacao).eq("id", solicitacaoId),
      supabase
        .from("reenvios_protocolos_medicos")
        .update({ status: "enviado", concluido_em: new Date().toISOString() })
        .eq("id", logId),
    ]);

    return Response.json({
      success: true,
      message: "Protocolo reenviado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao reenviar protocolo médico:", error);
    if (logId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      await supabase
        .from("reenvios_protocolos_medicos")
        .update({
          status: "falhou",
          erro: "Falha no envio SMTP",
          concluido_em: new Date().toISOString(),
        })
        .eq("id", logId);
    }
    return Response.json(
      { success: false, error: "Não foi possível reenviar o protocolo." },
      { status: 500 },
    );
  }
}
