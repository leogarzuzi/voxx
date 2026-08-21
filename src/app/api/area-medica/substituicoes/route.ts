import { createClient } from "@supabase/supabase-js";
import { notificarSolicitacaoMedica } from "@/lib/notificacoesMedicas";
import { emailTemFormatoValido, normalizarEmail } from "@/lib/emailSeguro";

export const dynamic = "force-dynamic";
const TIPOS = new Set(["SD", "SN", "24H", "ROTINA", "AMBULATÓRIO"]);
const TERMOS_VERSAO = "SUB-2026-08-18-v1";
const DOMINIOS_COM_ERRO: Record<string, string> = {
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
  const value = String(valor ?? "").trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return br
    ? `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`
    : "";
}
function cpfFormatado(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
function competenciaSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")?.value}-${partes.find((p) => p.type === "month")?.value}`;
}
function validarEmail(valor: unknown) {
  const email = normalizarEmail(valor);
  if (!emailTemFormatoValido(email))
    return { email, erro: "Informe um e-mail válido." };
  const dominio = email.split("@")[1];
  const sugestao = DOMINIOS_COM_ERRO[dominio];
  return sugestao
    ? {
        email,
        erro: `O domínio “${dominio}” parece incorreto. Você quis dizer “${sugestao}”?`,
      }
    : { email, erro: "" };
}

function validarEmailOpcional(valor: unknown) {
  const email = normalizarEmail(valor);
  return email ? validarEmail(email) : { email: "", erro: "" };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cpf = digitos(body.cpf);
    const nascimento = dataNormalizada(body.dataNascimento);
    const solicitanteId = Number(body.solicitanteId);
    const substitutoId = Number(body.substitutoId);
    const dataPlantao = dataNormalizada(body.dataPlantao);
    const tipoPlantao = String(body.tipoPlantao ?? "")
      .trim()
      .toUpperCase();
    const emailValidado = validarEmail(body.email);
    const emailSubstituto = validarEmailOpcional(body.emailSubstituto);

    if (
      cpf.length !== 11 ||
      !nascimento ||
      !Number.isInteger(solicitanteId) ||
      !Number.isInteger(substitutoId)
    )
      return Response.json(
        {
          success: false,
          error:
            "Sua identificação é inválida. Entre novamente na Área Médica.",
        },
        { status: 401 },
      );
    if (!dataPlantao || dataPlantao.slice(0, 7) !== competenciaSaoPaulo())
      return Response.json(
        {
          success: false,
          error: "A substituição deve pertencer ao mês vigente.",
        },
        { status: 400 },
      );
    if (!TIPOS.has(tipoPlantao))
      return Response.json(
        { success: false, error: "Selecione um tipo de plantão válido." },
        { status: 400 },
      );
    if (emailValidado.erro)
      return Response.json(
        { success: false, error: emailValidado.erro },
        { status: 400 },
      );
    if (emailSubstituto.erro)
      return Response.json(
        {
          success: false,
          error: `E-mail do substituto: ${emailSubstituto.erro}`,
        },
        { status: 400 },
      );
    if (body.aceitouTermos !== true)
      return Response.json(
        {
          success: false,
          error:
            "É necessário aceitar a Declaração de ciência e responsabilidade.",
        },
        { status: 400 },
      );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: solicitante } = await supabase
      .from("colaboradores")
      .select("id,matricula,nome,cargo,cpf,data_nascimento")
      .eq("id", solicitanteId)
      .in("cpf", [cpf, cpfFormatado(cpf)])
      .maybeSingle();
    if (
      !solicitante ||
      dataNormalizada(solicitante.data_nascimento) !== nascimento ||
      !normalizar(solicitante.cargo).includes("MEDICO")
    )
      return Response.json(
        {
          success: false,
          error: "Sua identificação expirou. Entre novamente na Área Médica.",
        },
        { status: 401 },
      );

    const { data: substituto } = await supabase
      .from("colaboradores")
      .select("id,matricula,nome,cargo,cpf")
      .eq("id", substitutoId)
      .maybeSingle();
    const mesmoCpf =
      substituto &&
      digitos(substituto.cpf).length === 11 &&
      digitos(substituto.cpf) === cpf;
    const mesmoNomeSemCpf =
      substituto &&
      digitos(substituto.cpf).length !== 11 &&
      normalizar(substituto.nome) === normalizar(solicitante.nome);
    if (
      !substituto ||
      !normalizar(substituto.cargo).includes("MEDICO") ||
      substituto.id === solicitante.id ||
      mesmoCpf ||
      mesmoNomeSemCpf
    )
      return Response.json(
        {
          success: false,
          error: "O médico substituto informado não é válido.",
        },
        { status: 400 },
      );

    const { data: registro, error } = await supabase
      .from("substituicoes_medicas")
      .insert({
        solicitante_id: solicitante.id,
        cpf_solicitante: cpf,
        matricula_solicitante: String(solicitante.matricula ?? ""),
        nome_solicitante: String(solicitante.nome ?? ""),
        funcao_solicitante: String(solicitante.cargo ?? ""),
        email_solicitante: emailValidado.email,
        data_plantao: dataPlantao,
        tipo_plantao: tipoPlantao,
        substituto_id: substituto.id,
        cpf_substituto: digitos(substituto.cpf),
        matricula_substituto: String(substituto.matricula ?? ""),
        nome_substituto: String(substituto.nome ?? ""),
        funcao_substituto: String(substituto.cargo ?? ""),
        email_substituto: emailSubstituto.email || null,
        termos_versao: TERMOS_VERSAO,
      })
      .select("id,protocolo,status,criado_em")
      .single();

    if (error) {
      if (error.code === "23505")
        return Response.json(
          {
            success: false,
            error: "Já existe uma substituição ativa para este plantão.",
          },
          { status: 409 },
        );
      console.error("Erro ao registrar substituição médica:", error.message);
      return Response.json(
        { success: false, error: "Não foi possível registrar a substituição." },
        { status: 500 },
      );
    }
    let emailEnviado = true;
    try {
      await notificarSolicitacaoMedica({
        evento: "criada",
        modalidade: "substituicao",
        protocolo: registro.protocolo,
        status: "recebido",
        destinatarios: [emailValidado.email, emailSubstituto.email],
        solicitante: {
          papel: "Solicitante",
          nome: String(solicitante.nome ?? ""),
          matricula: String(solicitante.matricula ?? ""),
        },
        participante: {
          papel: "Substituto",
          nome: String(substituto.nome ?? ""),
          matricula: String(substituto.matricula ?? ""),
        },
        plantoes: [{ data: dataPlantao, tipo: tipoPlantao }],
      });
    } catch (erroEmail) {
      emailEnviado = false;
      console.error("Substituição registrada, mas o e-mail falhou:", erroEmail);
    }
    return Response.json({
      success: true,
      substituicao: registro,
      emailEnviado,
      avisoEmail: emailEnviado
        ? null
        : "A substituição foi registrada, mas não foi possível enviar a confirmação por e-mail.",
    });
  } catch (error) {
    console.error("Erro na substituição médica:", error);
    return Response.json(
      { success: false, error: "Não foi possível registrar a substituição." },
      { status: 500 },
    );
  }
}
