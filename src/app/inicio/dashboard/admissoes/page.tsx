import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { DivisionChart } from "@/components/DivisionChart";
import { AdmissoesMesChart } from "@/components/AdmissoesMesChart";
import { classificarDivisao } from "@/lib/classificarDivisao";

function parseDataBR(data?: string | null) {
  if (!data) return null;

  const partes = data.split("/");
  if (partes.length !== 3) return null;

  const [dia, mes, ano] = partes.map(Number);
  return new Date(ano, mes - 1, dia);
}

const meses = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export default async function DashboardAdmissoesPage() {
  const supabase = await createSupabaseServerClient();

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const { data: admissoes, error } = await supabase
    .from("admissoes")
    .select("*")
    .range(0, 5000);

  const admissoesAno =
    admissoes?.filter((admissao) => {
      const data = parseDataBR(admissao.exercicio);
      return data && data.getFullYear() === anoAtual;
    }) ?? [];

  const totalAdmissoesAno = admissoesAno.length;

  const admissoesMesAtual = admissoesAno.filter((admissao) => {
    const data = parseDataBR(admissao.exercicio);
    return data && data.getMonth() === mesAtual;
  }).length;

  const admissoesPorMes = meses
    .map((mes, index) => {
      const total = admissoesAno.filter((admissao) => {
        const data = parseDataBR(admissao.exercicio);
        return data && data.getMonth() === index;
      }).length;

      return {
        mes,
        total,
      };
    })
    .filter((item) => item.total > 0);

  const divisaoMap = new Map<string, number>();

  admissoesAno.forEach((admissao) => {
    const divisao = classificarDivisao(admissao.cargo);

    divisaoMap.set(
      divisao,
      (divisaoMap.get(divisao) || 0) + 1
    );
  });

  const admissoesPorDivisao = Array.from(divisaoMap.entries()).map(
    ([divisao, total]) => ({
      divisao,
      total,
    })
  );

  return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">
            Dashboard de Admissões
          </h1>

          <p className="mt-2 text-gray-600">
            Indicadores das admissões registradas no Supabase.
          </p>
        </div>

        {error && (
          <p className="mt-4 text-red-500">
            Erro ao buscar admissões.
          </p>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Admissões no ano
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700">
              {totalAdmissoesAno}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Admissões no mês atual
            </p>

            <p className="mt-1 text-2xl font-bold text-green-700">
              {admissoesMesAtual}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Ano analisado
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-700">
              {anoAtual}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            Admissões por mês
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Quantidade de admissões por mês no ano analisado.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <AdmissoesMesChart data={admissoesPorMes} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3">Mês</th>
                    <th className="py-3">Admissões</th>
                  </tr>
                </thead>

                <tbody>
                  {admissoesPorMes.map((item) => (
                    <tr key={item.mes} className="border-b">
                      <td className="py-3 font-medium">
                        {item.mes}
                      </td>

                      <td className="py-3">
                        {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            Admissões por divisão
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Classificação baseada no cargo informado na admissão.
          </p>

          <div className="mt-6">
            <DivisionChart data={admissoesPorDivisao} />
          </div>
        </section>
      </main>
  );
}