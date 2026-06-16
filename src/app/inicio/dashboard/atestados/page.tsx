export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { AtestadosDivisaoChart } from "@/components/AtestadosDivisaoChart";
import { AtestadosMesChart } from "@/components/AtestadosMesChart";
import { classificarDivisao } from "@/lib/classificarDivisao";

async function buscarTodosAtestados(supabase: any) {
  const tamanhoPagina = 1000;
  let pagina = 0;
  let todos: any[] = [];
  let erroFinal = null;

  while (true) {
    const inicio = pagina * tamanhoPagina;
    const fim = inicio + tamanhoPagina - 1;

    const { data, error } = await supabase
      .from("atestados")
      .select("id,funcao,cid,mes,qtd_dias_abonados,qtd_plantoes_abonados")
      .range(inicio, fim);

    if (error) {
      erroFinal = error;
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    todos = [...todos, ...data];

    if (data.length < tamanhoPagina) {
      break;
    }

    pagina++;
  }

  return {
    data: todos,
    error: erroFinal,
  };
}

function contarOcorrencias<T>(
  itens: T[],
  getChave: (item: T) => string | null | undefined
) {
  const mapa = new Map<string, number>();

  itens.forEach((item) => {
    const chave = getChave(item)?.trim() || "Não informado";
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  });

  return Array.from(mapa.entries())
    .map(([nome, total]) => ({
      nome,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

function normalizarMes(mes?: string | null) {
  const valor = String(mes || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapaMeses: Record<string, string> = {
    JAN: "JAN",
    JANEIRO: "JAN",
    FEV: "FEV",
    FEVEREIRO: "FEV",
    MAR: "MAR",
    MARCO: "MAR",
    ABR: "ABR",
    ABRIL: "ABR",
    MAI: "MAI",
    MAIO: "MAI",
    JUN: "JUN",
    JUNHO: "JUN",
    JUL: "JUL",
    JULHO: "JUL",
    AGO: "AGO",
    AGOSTO: "AGO",
    SET: "SET",
    SETEMBRO: "SET",
    OUT: "OUT",
    OUTUBRO: "OUT",
    NOV: "NOV",
    NOVEMBRO: "NOV",
    DEZ: "DEZ",
    DEZEMBRO: "DEZ",
  };

  return mapaMeses[valor] || valor;
}

const ordemMeses = [
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

export default async function DashboardAtestadosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: atestados, error } = await buscarTodosAtestados(supabase);

  const { count: totalAtestados } = await supabase
    .from("atestados")
    .select("*", { count: "exact", head: true });

  const listaAtestados = atestados ?? [];

  const totalDiasAbonados = listaAtestados.reduce((total, atestado) => {
    const dias = Number(
      String(atestado.qtd_dias_abonados || "0").replace(",", ".")
    );

    return total + (Number.isNaN(dias) ? 0 : dias);
  }, 0);

  const totalPlantoesAbonados = listaAtestados.reduce((total, atestado) => {
    const plantoes = Number(
      String(atestado.qtd_plantoes_abonados || "0").replace(",", ".")
    );

    return total + (Number.isNaN(plantoes) ? 0 : plantoes);
  }, 0);

  const atestadosPorMes = ordemMeses
    .map((mes) => {
      const total = listaAtestados.filter((atestado) => {
        return normalizarMes(atestado.mes) === mes;
      }).length;

      return {
        mes,
        total,
      };
    })
    .filter((item) => item.total > 0);

  const cidRanking = contarOcorrencias(
    listaAtestados,
    (atestado) => atestado.cid
  ).slice(0, 10);

  const funcaoRanking = contarOcorrencias(
    listaAtestados,
    (atestado) => atestado.funcao
  ).slice(0, 10);

  const divisaoMap = new Map<string, number>();

  listaAtestados.forEach((atestado) => {
    const divisao = classificarDivisao(atestado.funcao);

    divisaoMap.set(divisao, (divisaoMap.get(divisao) || 0) + 1);
  });

  const atestadosPorDivisao = Array.from(divisaoMap.entries())
    .map(([divisao, total]) => ({
      divisao,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">
            Dashboard de Atestados
          </h1>

          <p className="mt-2 text-gray-600">
            Indicadores de atestados registrados no Supabase.
          </p>
        </div>

        {error && (
          <p className="mt-4 text-red-500">
            Erro ao buscar atestados.
          </p>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Total de atestados
            </p>

            <p className="mt-1 text-2xl font-bold text-purple-700">
              {totalAtestados ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Dias abonados
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700">
              {totalDiasAbonados}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Plantões abonados
            </p>

            <p className="mt-1 text-2xl font-bold text-green-700">
              {totalPlantoesAbonados}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            Atestados por mês
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Quantidade de atestados por mês importado da planilha.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <AtestadosMesChart data={atestadosPorMes} />
            </div>

            <div className="voxx-scrollbar overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3">Mês</th>
                    <th className="py-3">Atestados</th>
                  </tr>
                </thead>

                <tbody>
                  {atestadosPorMes.map((item) => (
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
            Atestados por divisão
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Gráfico horizontal baseado na função informada no atestado.
          </p>

          <div className="mt-6">
            <AtestadosDivisaoChart data={atestadosPorDivisao} />
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Top 10 CID
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              CIDs mais frequentes nos atestados.
            </p>

            <div className="voxx-scrollbar mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3">CID</th>
                    <th className="py-3">Quantidade</th>
                  </tr>
                </thead>

                <tbody>
                  {cidRanking.map((item) => (
                    <tr key={item.nome} className="border-b">
                      <td className="py-3 font-medium">
                        {item.nome}
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

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Top 10 funções
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Funções com maior quantidade de atestados.
            </p>

            <div className="voxx-scrollbar mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3">Função</th>
                    <th className="py-3">Quantidade</th>
                  </tr>
                </thead>

                <tbody>
                  {funcaoRanking.map((item) => (
                    <tr key={item.nome} className="border-b">
                      <td className="py-3 font-medium">
                        {item.nome}
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
      </main>
  );
}
