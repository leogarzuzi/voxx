import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Colaborador = {
  id: number;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
};

function somenteDigitos(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function possuiFuncaoMedica(funcao: unknown) {
  return normalizarTexto(funcao).includes("MEDICO");
}

function normalizarData(valor: unknown) {
  const texto = String(valor ?? "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const brasileira = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brasileira) {
    return `${brasileira[3]}-${brasileira[2].padStart(2, "0")}-${brasileira[1].padStart(2, "0")}`;
  }

  return "";
}

function formatarCpf(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function respostaNaoEncontrada() {
  return Response.json(
    {
      success: false,
      error: "Não foi possível localizar seus dados. Procure o RH para verificar seu cadastro.",
    },
    { status: 404 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cpf = somenteDigitos(body.cpf);
    const dataNascimento = normalizarData(body.dataNascimento);

    if (cpf.length !== 11 || !dataNascimento) {
      return Response.json(
        { success: false, error: "Informe um CPF e uma data de nascimento válidos." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const cpfFormatado = formatarCpf(cpf);
    const { data, error } = await supabase
      .from("colaboradores")
      .select("id,matricula,nome,cargo,email,cpf,data_nascimento")
      .in("cpf", [cpf, cpfFormatado])
      .limit(3);

    if (error) {
      console.error("Erro ao identificar médico:", error.message);
      return Response.json(
        { success: false, error: "Não foi possível consultar seus dados agora. Tente novamente." },
        { status: 500 }
      );
    }

    const vinculosIdentificados = ((data ?? []) as Colaborador[]).filter(
      (item) => normalizarData(item.data_nascimento) === dataNascimento
    );

    if (vinculosIdentificados.length === 0) return respostaNaoEncontrada();

    const vinculos = vinculosIdentificados.filter((item) => possuiFuncaoMedica(item.cargo));

    if (vinculos.length === 0) {
      return Response.json(
        {
          success: false,
          error: "A Área Médica é exclusiva para colaboradores com função médica. Em caso de divergência, procure o RH.",
        },
        { status: 403 }
      );
    }

    if (vinculos.length > 2) {
      return Response.json(
        {
          success: false,
          error: "Foram encontrados dados divergentes no seu cadastro. Procure o RH para regularização.",
        },
        { status: 409 }
      );
    }

    return Response.json({
      success: true,
      vinculos: vinculos.map((item) => ({
        id: item.id,
        matricula: String(item.matricula ?? "").trim(),
        nome: String(item.nome ?? "").trim(),
        funcao: String(item.cargo ?? "").trim(),
        email: String(item.email ?? "").trim().toLowerCase(),
      })),
    });
  } catch (error) {
    console.error("Erro na identificação da Área Médica:", error);
    return Response.json(
      { success: false, error: "Não foi possível consultar seus dados agora. Tente novamente." },
      { status: 500 }
    );
  }
}
