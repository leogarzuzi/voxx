import { createClient } from "@supabase/supabase-js";
import { notificarSolicitacaoMedica } from "@/lib/notificacoesMedicas";

export const dynamic = "force-dynamic";
const TIPOS = new Set(["SD", "SN", "24H", "ROTINA", "AMBULATÓRIO"]);
const TERMOS_VERSAO = "TPM-2026-08-19-v1";
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

function digitos(v: unknown) {
  return String(v ?? "").replace(/\D/g, "");
}
function normalizar(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}
function data(v: unknown) {
  const t = String(v ?? "").trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return br
    ? `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`
    : "";
}
function cpfFormatado(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
function competencia() {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${p.find((x) => x.type === "year")?.value}-${p.find((x) => x.type === "month")?.value}`;
}
function emailValido(v: unknown) {
  const email = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return { email, erro: "Informe um e-mail válido." };
  const dominio = email.split("@")[1];
  const sugestao = ERROS_DOMINIO[dominio];
  return {
    email,
    erro: sugestao
      ? `O domínio “${dominio}” parece incorreto. Você quis dizer “${sugestao}”?`
      : "",
  };
}

function emailOpcional(v: unknown) {
  const email = String(v ?? "")
    .trim()
    .toLowerCase();
  return email ? emailValido(email) : { email: "", erro: "" };
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    const cpf = digitos(b.cpf);
    const nascimento = data(b.dataNascimento);
    const solicitanteId = Number(b.solicitanteId);
    const solicitadoId = Number(b.solicitadoId);
    const dataSolicitante = data(b.dataSolicitante);
    const dataSolicitado = data(b.dataSolicitado);
    const tipoSolicitante = normalizar(b.tipoSolicitante);
    const tipoSolicitado = normalizar(b.tipoSolicitado);
    const email = emailValido(b.email);
    const emailSolicitado = emailOpcional(b.emailSolicitado);
    if (
      cpf.length !== 11 ||
      !nascimento ||
      !Number.isInteger(solicitanteId) ||
      !Number.isInteger(solicitadoId)
    )
      return Response.json(
        {
          success: false,
          error:
            "Sua identificação é inválida. Entre novamente na Área Médica.",
        },
        { status: 401 },
      );
    if (
      !dataSolicitante ||
      !dataSolicitado ||
      dataSolicitante.slice(0, 7) !== competencia() ||
      dataSolicitado.slice(0, 7) !== competencia()
    )
      return Response.json(
        {
          success: false,
          error: "Os dois plantões devem pertencer ao mês vigente.",
        },
        { status: 400 },
      );
    if (!TIPOS.has(tipoSolicitante) || !TIPOS.has(tipoSolicitado))
      return Response.json(
        { success: false, error: "Selecione tipos de plantão válidos." },
        { status: 400 },
      );
    if (
      dataSolicitante === dataSolicitado &&
      tipoSolicitante === tipoSolicitado
    )
      return Response.json(
        {
          success: false,
          error: "Os plantões não podem ter a mesma data e o mesmo tipo.",
        },
        { status: 400 },
      );
    if (email.erro)
      return Response.json(
        { success: false, error: email.erro },
        { status: 400 },
      );
    if (emailSolicitado.erro)
      return Response.json(
        {
          success: false,
          error: `E-mail do solicitado: ${emailSolicitado.erro}`,
        },
        { status: 400 },
      );
    if (b.aceitouTermos !== true)
      return Response.json(
        { success: false, error: "É necessário aceitar a declaração." },
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
      data(solicitante.data_nascimento) !== nascimento ||
      !normalizar(solicitante.cargo).includes("MEDICO")
    )
      return Response.json(
        {
          success: false,
          error: "Sua identificação expirou. Entre novamente na Área Médica.",
        },
        { status: 401 },
      );
    const { data: solicitado } = await supabase
      .from("colaboradores")
      .select("id,matricula,nome,cargo,cpf")
      .eq("id", solicitadoId)
      .maybeSingle();
    const cpfSolicitado = digitos(solicitado?.cpf);
    if (
      !solicitado ||
      cpfSolicitado.length !== 11 ||
      !normalizar(solicitado.cargo).includes("MEDICO") ||
      solicitado.id === solicitante.id ||
      cpfSolicitado === cpf
    )
      return Response.json(
        {
          success: false,
          error: "O médico solicitado informado não é válido.",
        },
        { status: 400 },
      );

    const { data: registro, error } = await supabase
      .from("trocas_plantao_medicas")
      .insert({
        solicitante_id: solicitante.id,
        cpf_solicitante: cpf,
        matricula_solicitante: String(solicitante.matricula ?? ""),
        nome_solicitante: String(solicitante.nome ?? ""),
        funcao_solicitante: String(solicitante.cargo ?? ""),
        email_solicitante: email.email,
        data_plantao_solicitante: dataSolicitante,
        tipo_plantao_solicitante: tipoSolicitante,
        solicitado_id: solicitado.id,
        cpf_solicitado: cpfSolicitado,
        matricula_solicitado: String(solicitado.matricula ?? ""),
        nome_solicitado: String(solicitado.nome ?? ""),
        funcao_solicitado: String(solicitado.cargo ?? ""),
        email_solicitado: emailSolicitado.email || null,
        data_plantao_solicitado: dataSolicitado,
        tipo_plantao_solicitado: tipoSolicitado,
        chave_troca: "PREENCHIDA_PELO_TRIGGER",
        termos_versao: TERMOS_VERSAO,
      })
      .select("id,protocolo,status,criado_em")
      .single();
    if (error) {
      if (error.code === "23505")
        return Response.json(
          { success: false, error: "Esta troca já foi registrada." },
          { status: 409 },
        );
      console.error("Erro ao registrar troca médica:", error.message);
      return Response.json(
        { success: false, error: "Não foi possível registrar a troca médica." },
        { status: 500 },
      );
    }
    let emailEnviado = true;
    try {
      await notificarSolicitacaoMedica({
        evento: "criada",
        modalidade: "troca",
        protocolo: registro.protocolo,
        status: "recebido",
        destinatarios: [email.email, emailSolicitado.email],
        solicitante: {
          papel: "Solicitante",
          nome: String(solicitante.nome ?? ""),
          matricula: String(solicitante.matricula ?? ""),
        },
        participante: {
          papel: "Solicitado",
          nome: String(solicitado.nome ?? ""),
          matricula: String(solicitado.matricula ?? ""),
        },
        plantoes: [
          {
            papel: "Plantão do solicitante",
            data: dataSolicitante,
            tipo: tipoSolicitante,
          },
          {
            papel: "Plantão do solicitado",
            data: dataSolicitado,
            tipo: tipoSolicitado,
          },
        ],
      });
    } catch (erroEmail) {
      emailEnviado = false;
      console.error("Troca registrada, mas o e-mail falhou:", erroEmail);
    }
    return Response.json({
      success: true,
      troca: registro,
      emailEnviado,
      avisoEmail: emailEnviado
        ? null
        : "A troca foi registrada, mas não foi possível enviar a confirmação por e-mail.",
    });
  } catch (error) {
    console.error("Erro na troca médica:", error);
    return Response.json(
      { success: false, error: "Não foi possível registrar a troca médica." },
      { status: 500 },
    );
  }
}
