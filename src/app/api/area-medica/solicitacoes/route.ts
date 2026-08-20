import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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
function dataNormalizada(v: unknown) {
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
function hojeSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function competenciaAtualSaoPaulo() {
  return hojeSaoPaulo().slice(0, 7);
}
function proximaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return mes === 12
    ? `${ano + 1}-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cpf = digitos(body.cpf);
    const nascimento = dataNormalizada(body.dataNascimento);
    const vinculoId = Number(body.vinculoId);
    const competencia = /^\d{4}-\d{2}$/.test(String(body.competencia ?? ""))
      ? String(body.competencia)
      : competenciaAtualSaoPaulo();
    if (cpf.length !== 11 || !nascimento || !Number.isInteger(vinculoId))
      return Response.json(
        { success: false, error: "Identificação inválida." },
        { status: 401 },
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
        {
          success: false,
          error: "Sua identificação expirou. Entre novamente na Área Médica.",
        },
        { status: 401 },
      );

    const matriculaVinculo = digitos(vinculo.matricula);
    if (!matriculaVinculo)
      return Response.json(
        {
          success: false,
          error: "O vínculo selecionado não possui matrícula válida.",
        },
        { status: 400 },
      );

    const [subs, trocas] = await Promise.all([
      supabase
        .from("substituicoes_medicas")
        .select(
          "id,protocolo,solicitante_id,nome_solicitante,matricula_solicitante,email_solicitante,data_plantao,tipo_plantao,substituto_id,nome_substituto,matricula_substituto,email_substituto,status,criado_em,cancelado_em",
        )
        .or(
          `matricula_solicitante.eq.${matriculaVinculo},matricula_substituto.eq.${matriculaVinculo}`,
        )
        .gte("data_plantao", `${competencia}-01`)
        .lt("data_plantao", `${proximaCompetencia(competencia)}-01`)
        .order("criado_em", { ascending: false }),
      supabase
        .from("trocas_plantao_medicas")
        .select(
          "id,protocolo,solicitante_id,nome_solicitante,matricula_solicitante,email_solicitante,data_plantao_solicitante,tipo_plantao_solicitante,solicitado_id,nome_solicitado,matricula_solicitado,email_solicitado,data_plantao_solicitado,tipo_plantao_solicitado,status,criado_em,cancelado_em",
        )
        .or(
          `matricula_solicitante.eq.${matriculaVinculo},matricula_solicitado.eq.${matriculaVinculo}`,
        )
        .gte("data_plantao_solicitante", `${competencia}-01`)
        .lt("data_plantao_solicitante", `${proximaCompetencia(competencia)}-01`)
        .order("criado_em", { ascending: false }),
    ]);
    if (subs.error || trocas.error) {
      console.error(
        "Erro ao listar solicitações médicas:",
        subs.error?.message || trocas.error?.message,
      );
      return Response.json(
        {
          success: false,
          error: "Não foi possível carregar suas solicitações.",
        },
        { status: 500 },
      );
    }

    const hoje = hojeSaoPaulo();
    const substituicoes = (subs.data ?? []).map((r) => {
      const criou = digitos(r.matricula_solicitante) === matriculaVinculo;
      return {
        id: r.id,
        modalidade: "substituicao",
        protocolo: r.protocolo,
        papel: criou ? "Solicitante" : "Substituto",
        outroNome: criou ? r.nome_substituto : r.nome_solicitante,
        outroMatricula: criou
          ? r.matricula_substituto
          : r.matricula_solicitante,
        dataPrincipal: r.data_plantao,
        tipoPrincipal: r.tipo_plantao,
        emailSolicitante: r.email_solicitante,
        emailParticipante: r.email_substituto ?? "",
        ladoEsquerdo: {
          rotulo: "Solicitante",
          nome: r.nome_solicitante,
          matricula: r.matricula_solicitante,
        },
        ladoDireito: {
          rotulo: "Substituto",
          nome: r.nome_substituto,
          matricula: r.matricula_substituto,
        },
        status: r.status,
        criadoEm: r.criado_em,
        podeCancelar: criou && r.status === "recebido" && hoje < r.data_plantao,
      };
    });
    const trocasMapeadas = (trocas.data ?? []).map((r) => {
      const criou = digitos(r.matricula_solicitante) === matriculaVinculo;
      const primeiraData =
        r.data_plantao_solicitante < r.data_plantao_solicitado
          ? r.data_plantao_solicitante
          : r.data_plantao_solicitado;
      return {
        id: r.id,
        modalidade: "troca",
        protocolo: r.protocolo,
        papel: criou ? "Solicitante" : "Solicitado",
        outroNome: criou ? r.nome_solicitado : r.nome_solicitante,
        outroMatricula: criou
          ? r.matricula_solicitado
          : r.matricula_solicitante,
        dataPrincipal: criou
          ? r.data_plantao_solicitante
          : r.data_plantao_solicitado,
        tipoPrincipal: criou
          ? r.tipo_plantao_solicitante
          : r.tipo_plantao_solicitado,
        outraData: criou
          ? r.data_plantao_solicitado
          : r.data_plantao_solicitante,
        outroTipo: criou
          ? r.tipo_plantao_solicitado
          : r.tipo_plantao_solicitante,
        emailSolicitante: r.email_solicitante,
        emailParticipante: r.email_solicitado ?? "",
        ladoEsquerdo: {
          rotulo: "Solicitante",
          nome: r.nome_solicitante,
          matricula: r.matricula_solicitante,
          data: r.data_plantao_solicitante,
          tipo: r.tipo_plantao_solicitante,
        },
        ladoDireito: {
          rotulo: "Solicitado",
          nome: r.nome_solicitado,
          matricula: r.matricula_solicitado,
          data: r.data_plantao_solicitado,
          tipo: r.tipo_plantao_solicitado,
        },
        status: r.status,
        criadoEm: r.criado_em,
        podeCancelar: criou && r.status === "recebido" && hoje < primeiraData,
      };
    });
    return Response.json({
      success: true,
      solicitacoes: [...substituicoes, ...trocasMapeadas].sort((a, b) =>
        String(b.criadoEm).localeCompare(String(a.criadoEm)),
      ),
    });
  } catch (error) {
    console.error("Erro em Minhas solicitações:", error);
    return Response.json(
      { success: false, error: "Não foi possível carregar suas solicitações." },
      { status: 500 },
    );
  }
}
