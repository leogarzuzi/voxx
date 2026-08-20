import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function digitos(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

function textoNormalizado(valor: unknown) {
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
    const matricula = digitos(body.matricula).slice(0, 8);

    if (
      cpf.length !== 11 ||
      !nascimento ||
      !Number.isInteger(vinculoId) ||
      matricula.length !== 8
    ) {
      return Response.json(
        { success: false, error: "Dados de consulta inválidos." },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const { data: solicitante } = await supabase
      .from("colaboradores")
      .select("id,nome,cpf,data_nascimento,cargo")
      .eq("id", vinculoId)
      .in("cpf", [cpf, cpfFormatado(cpf)])
      .maybeSingle();

    if (
      !solicitante ||
      dataNormalizada(solicitante.data_nascimento) !== nascimento ||
      !textoNormalizado(solicitante.cargo).includes("MEDICO")
    ) {
      return Response.json(
        {
          success: false,
          error: "Sua identificação expirou. Acesse novamente a Área Médica.",
        },
        { status: 401 },
      );
    }

    const { data: substituto, error } = await supabase
      .from("colaboradores")
      .select("id,matricula,nome,cargo,cpf,email")
      .eq("matricula", matricula)
      .maybeSingle();

    if (error) {
      return Response.json(
        { success: false, error: "Não foi possível consultar a matrícula." },
        { status: 500 },
      );
    }
    if (!substituto) {
      return Response.json(
        {
          success: false,
          error:
            "Esta matrícula não se encontra ativa na base. Se necessário, procure o RH.",
        },
        { status: 404 },
      );
    }
    if (!textoNormalizado(substituto.cargo).includes("MEDICO")) {
      return Response.json(
        {
          success: false,
          error:
            "A matrícula informada não pertence a um profissional com função médica.",
        },
        { status: 400 },
      );
    }
    const mesmoCpf =
      digitos(substituto.cpf).length === 11 && digitos(substituto.cpf) === cpf;
    const mesmoNomeSemCpf =
      digitos(substituto.cpf).length !== 11 &&
      textoNormalizado(substituto.nome) === textoNormalizado(solicitante.nome);

    if (substituto.id === vinculoId || mesmoCpf || mesmoNomeSemCpf) {
      return Response.json(
        {
          success: false,
          error:
            "Não é permitido usar outro vínculo ou matrícula da mesma pessoa.",
        },
        { status: 400 },
      );
    }

    return Response.json({
      success: true,
      substituto: {
        id: substituto.id,
        matricula: String(substituto.matricula ?? "").trim(),
        nome: String(substituto.nome ?? "").trim(),
        funcao: String(substituto.cargo ?? "").trim(),
        email: String(substituto.email ?? "")
          .trim()
          .toLowerCase(),
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: "Não foi possível consultar o médico substituto.",
      },
      { status: 500 },
    );
  }
}
