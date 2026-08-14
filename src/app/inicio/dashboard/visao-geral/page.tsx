import { createSupabaseServerClient } from "@/lib/supabaseServer";
import DashboardVisaoGeralClient from "./DashboardVisaoGeralClient";
import { redirect } from "next/navigation";
import { PERMISSOES } from "@/lib/perfis";
import { usuarioAtualTemPermissao } from "@/lib/perfisServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registro = Record<string, unknown>;

function textoCampo(registro: Registro, campo: string) {
  const valor = registro[campo];

  if (valor === null || valor === undefined) return "";

  return String(valor);
}

function parseDataBR(data?: string | null) {
  if (!data) return null;

  const texto = String(data).trim();
  const apenasData = texto.split("T")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) {
    const [ano, mes, dia] = apenasData.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  const partes = texto.split("/");
  if (partes.length !== 3) return null;

  const [dia, mes, ano] = partes.map(Number);
  return new Date(ano, mes - 1, dia);
}

function fimDoMes(ano: number, mes: number) {
  return new Date(ano, mes + 1, 0);
}

const meses = [
  { nome: "JAN", numero: 0 },
  { nome: "FEV", numero: 1 },
  { nome: "MAR", numero: 2 },
  { nome: "ABR", numero: 3 },
  { nome: "MAI", numero: 4 },
  { nome: "JUN", numero: 5 },
  { nome: "JUL", numero: 6 },
  { nome: "AGO", numero: 7 },
  { nome: "SET", numero: 8 },
  { nome: "OUT", numero: 9 },
  { nome: "NOV", numero: 10 },
  { nome: "DEZ", numero: 11 },
];

async function buscarTodosRegistros(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tabela: string
) {
  const tamanhoPagina = 1000;
  let pagina = 0;
  const registros: Registro[] = [];

  while (true) {
    const inicio = pagina * tamanhoPagina;
    const fim = inicio + tamanhoPagina - 1;

    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .range(inicio, fim);

    if (error) {
      return { data: registros, error };
    }

    const lote = (data ?? []) as Registro[];
    registros.push(...lote);

    if (lote.length < tamanhoPagina) {
      return { data: registros, error: null };
    }

    pagina += 1;
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!(await usuarioAtualTemPermissao(supabase, PERMISSOES.DASHBOARD))) redirect("/inicio");

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const [
    colaboradoresResultado,
    admissoesResultado,
    desligamentosResultado,
    atestadosResultado,
  ] = await Promise.all([
    buscarTodosRegistros(supabase, "colaboradores"),
    buscarTodosRegistros(supabase, "admissoes"),
    buscarTodosRegistros(supabase, "desligamentos"),
    buscarTodosRegistros(supabase, "atestados"),
  ]);

  const { count: totalColaboradores } = await supabase
    .from("colaboradores")
    .select("*", { count: "exact", head: true });

  const { count: totalAdmissoes } = await supabase
    .from("admissoes")
    .select("*", { count: "exact", head: true });

  const { count: totalDesligamentos } = await supabase
    .from("desligamentos")
    .select("*", { count: "exact", head: true });

  const { count: totalAtestados } = await supabase
    .from("atestados")
    .select("*", { count: "exact", head: true });

  const colaboradoresLista = colaboradoresResultado.data;
  const admissoesLista = admissoesResultado.data;
  const desligamentosLista = desligamentosResultado.data;
  const atestadosLista = atestadosResultado.data;

  const mesesAteAtual = meses.filter((mes) => mes.numero <= mesAtual);

  const turnoverMensal = mesesAteAtual.map((mes) => {
    const fim = fimDoMes(anoAtual, mes.numero);

    const admitidosMes = admissoesLista.filter((admissao) => {
      const data = parseDataBR(textoCampo(admissao, "exercicio"));
      return (
        data &&
        data.getFullYear() === anoAtual &&
        data.getMonth() === mes.numero
      );
    }).length;

    const desligadosMes = desligamentosLista.filter((desligamento) => {
      const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
      return (
        data &&
        data.getFullYear() === anoAtual &&
        data.getMonth() === mes.numero
      );
    }).length;

    const admissoesDepois = admissoesLista.filter((admissao) => {
      const data = parseDataBR(textoCampo(admissao, "exercicio"));
      return data && data > fim;
    }).length;

    const desligamentosDepois = desligamentosLista.filter((desligamento) => {
      const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
      return data && data > fim;
    }).length;

    const ativosFimMes =
      (totalColaboradores ?? colaboradoresLista.length) -
      admissoesDepois +
      desligamentosDepois;

    const turnover =
      ativosFimMes > 0
        ? (((admitidosMes + desligadosMes) / 2) / ativosFimMes) * 100
        : 0;

    return {
      mes: mes.nome,
      admitidos: admitidosMes,
      desligados: desligadosMes,
      ativosFimMes,
      turnover: Number(turnover.toFixed(2)),
    };
  });

  return (
    <DashboardVisaoGeralClient
      colaboradores={colaboradoresLista}
      admissoes={admissoesLista}
      desligamentos={desligamentosLista}
      atestados={atestadosLista}
      turnoverMensal={turnoverMensal}
      totais={{
        colaboradores: totalColaboradores ?? colaboradoresLista.length,
        admissoes: totalAdmissoes ?? admissoesLista.length,
        desligamentos: totalDesligamentos ?? desligamentosLista.length,
        atestados: totalAtestados ?? atestadosLista.length,
      }}
      colaboradoresError={colaboradoresResultado.error?.message ?? null}
    />
  );
}
