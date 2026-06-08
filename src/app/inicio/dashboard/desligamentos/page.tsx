import { supabase } from "@/lib/supabase";
import { DivisionChart } from "@/components/DivisionChart";
import { DesligamentosMesChart } from "@/components/DesligamentosMesChart";
import { TipoDesligamentoChart } from "@/components/TipoDesligamentoChart";
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

export default async function DashboardDesligamentosPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const { data: desligamentos, error } = await supabase
    .from("desligamentos")
    .select("id,cargo,data_desligamento,tipo_desligamento")
    .range(0, 5000);

  const desligamentosAno =
    desligamentos?.filter((desligamento) => {
      const data = parseDataBR(
        desligamento.data_desligamento
      );

      return data && data.getFullYear() === anoAtual;
    }) ?? [];

  const totalDesligamentosAno =
    desligamentosAno.length;

  const desligamentosMesAtual =
    desligamentosAno.filter((desligamento) => {
      const data = parseDataBR(
        desligamento.data_desligamento
      );

      return data && data.getMonth() === mesAtual;
    }).length;

  const desligamentosPorMes = meses
    .map((mes, index) => {
      const total = desligamentosAno.filter(
        (desligamento) => {
          const data = parseDataBR(
            desligamento.data_desligamento
          );

          return data && data.getMonth() === index;
        }
      ).length;

      return {
        mes,
        total,
      };
    })
    .filter((item) => item.total > 0);

  const divisaoMap = new Map<string, number>();

  desligamentosAno.forEach((desligamento) => {
    const divisao = classificarDivisao(
      desligamento.cargo
    );

    divisaoMap.set(
      divisao,
      (divisaoMap.get(divisao) || 0) + 1
    );
  });

  const desligamentosPorDivisao = Array.from(
    divisaoMap.entries()
  ).map(([divisao, total]) => ({
    divisao,
    total,
  }));

  const tipoMap = new Map<string, number>();

  desligamentosAno.forEach((desligamento) => {
    const tipo =
      desligamento.tipo_desligamento ||
      "Não informado";

    tipoMap.set(
      tipo,
      (tipoMap.get(tipo) || 0) + 1
    );
  });

  const desligamentosPorTipo = Array.from(
    tipoMap.entries()
  ).map(([name, value]) => ({
    name,
    value,
  }));

  return (
      <main className="min-h-screen flex-1 bg-slate-50 p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">
            Dashboard de Desligamentos
          </h1>

          <p className="mt-2 text-gray-600">
            Indicadores dos desligamentos
            registrados no Supabase.
          </p>
        </div>

        {error && (
          <p className="mt-4 text-red-500">
            Erro ao buscar desligamentos.
          </p>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Desligamentos no ano
            </p>

            <p className="mt-1 text-2xl font-bold text-red-700">
              {totalDesligamentosAno}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Desligamentos no mês atual
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-600">
              {desligamentosMesAtual}
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
            Desligamentos por mês
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Quantidade de desligamentos por
            mês no ano analisado.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <DesligamentosMesChart
                data={desligamentosPorMes}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3">
                      Mês
                    </th>

                    <th className="py-3">
                      Desligamentos
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {desligamentosPorMes.map(
                    (item) => (
                      <tr
                        key={item.mes}
                        className="border-b"
                      >
                        <td className="py-3 font-medium">
                          {item.mes}
                        </td>

                        <td className="py-3">
                          {item.total}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Desligamentos por divisão
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Classificação baseada no cargo
              informado no desligamento.
            </p>

            <div className="mt-6">
              <DivisionChart
                data={desligamentosPorDivisao}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Tipos de desligamento
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Distribuição dos desligamentos
              por tipo informado.
            </p>

            <div className="mt-6">
              <TipoDesligamentoChart
                data={desligamentosPorTipo}
              />
            </div>
          </div>
        </section>
      </main>
  );
}