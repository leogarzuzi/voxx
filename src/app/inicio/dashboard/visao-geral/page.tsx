export const dynamic = "force-dynamic";
export const revalidate = 0;
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PrefixChart } from "@/components/PrefixChart";
import { DivisionChart } from "@/components/DivisionChart";
import { classificarDivisao } from "@/lib/classificarDivisao";
import { TurnoverChart } from "@/components/TurnoverChart";

function parseDataBR(data?: string | null) {
  if (!data) return null;

  const partes = data.split("/");
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

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const { data: colaboradores, error: colaboradoresError } = await supabase
    .from("colaboradores")
    .select("*")
    .range(0, 5000);

  const { data: admissoes } = await supabase
    .from("admissoes")
    .select("*")
    .range(0, 5000);

  const { data: desligamentos } = await supabase
    .from("desligamentos")
    .select("*")
    .range(0, 5000);

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

  const total40 = colaboradores?.filter((c) => c.pref === "40").length ?? 0;
  const total47 = colaboradores?.filter((c) => c.pref === "47").length ?? 0;
  const total95 = colaboradores?.filter((c) => c.pref === "95").length ?? 0;

  const chartData = [
    { prefixo: "40", total: total40 },
    { prefixo: "47", total: total47 },
    { prefixo: "95", total: total95 },
  ];

  const divisaoMap = new Map<string, number>();

  colaboradores?.forEach((colaborador) => {
    const divisao = classificarDivisao(colaborador.cargo);
    divisaoMap.set(divisao, (divisaoMap.get(divisao) || 0) + 1);
  });

  const divisionData = Array.from(divisaoMap.entries()).map(
    ([divisao, total]) => ({
      divisao,
      total,
    })
  );

  const mesesAteAtual = meses.filter((mes) => mes.numero <= mesAtual);

  const turnoverMensal = mesesAteAtual.map((mes) => {
    const fim = fimDoMes(anoAtual, mes.numero);

    const admitidosMes =
      admissoes?.filter((a) => {
        const data = parseDataBR(a.exercicio);
        return (
          data &&
          data.getFullYear() === anoAtual &&
          data.getMonth() === mes.numero
        );
      }).length ?? 0;

    const desligadosMes =
      desligamentos?.filter((d) => {
        const data = parseDataBR(d.data_desligamento);
        return (
          data &&
          data.getFullYear() === anoAtual &&
          data.getMonth() === mes.numero
        );
      }).length ?? 0;

    const admissoesDepois =
      admissoes?.filter((a) => {
        const data = parseDataBR(a.exercicio);
        return data && data > fim;
      }).length ?? 0;

    const desligamentosDepois =
      desligamentos?.filter((d) => {
        const data = parseDataBR(d.data_desligamento);
        return data && data > fim;
      }).length ?? 0;

    const ativosFimMes =
      (totalColaboradores ?? 0) - admissoesDepois + desligamentosDepois;

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

  const turnoverMedio =
    turnoverMensal.length > 0
      ? turnoverMensal.reduce((acc, item) => acc + item.turnover, 0) /
        turnoverMensal.length
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">
            Dashboard RH
          </h1>

          <p className="mt-2 text-gray-600">
            Visão geral dos indicadores do sistema VOXX.
          </p>
        </div>

        {colaboradoresError && (
          <p className="mt-4 text-red-500">
            Erro ao buscar dados de colaboradores.
          </p>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Colaboradores ativos</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {totalColaboradores ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Admissões registradas</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {totalAdmissoes ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Desligamentos registrados</p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {totalDesligamentos ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Atestados registrados</p>
            <p className="mt-2 text-3xl font-bold text-purple-700">
              {totalAtestados ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Turnover médio</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {turnoverMedio.toFixed(2)}%
            </p>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Colaboradores por prefixo
            </h2>

            <div className="mt-6">
              <PrefixChart data={chartData} />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Colaboradores por divisão
            </h2>

            <div className="mt-6">
              <DivisionChart data={divisionData} />
            </div>
          </div>
        </section>

<section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">
        Turnover mensal
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Comparativo mensal de turnover da instituição.
      </p>
    </div>

    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
      Meta: 5%
    </div>
  </div>

  <div className="mt-8">
    <TurnoverChart data={turnoverMensal} />
  </div>

  <div className="mt-8 overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b text-gray-500">
          <th className="py-3">Mês</th>
          <th className="py-3">Admitidos</th>
          <th className="py-3">Desligados</th>
          <th className="py-3">Ativos no fim do mês</th>
           <th className="py-3">Turnover</th>
        </tr>
      </thead>

      <tbody>
        {turnoverMensal.map((item) => (
          <tr key={item.mes} className="border-b">
            <td className="py-3 font-medium">
              {item.mes}
            </td>

            <td className="py-3">
              {item.admitidos}
            </td>

            <td className="py-3">
              {item.desligados}
            </td>

            <td className="py-3">
              {item.ativosFimMes}
            </td>

            <td className="py-3 font-semibold">
              {item.turnover.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
      </main>
  );
}