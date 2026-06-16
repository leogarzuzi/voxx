"use client";

import { useMemo, useState } from "react";
import { AtestadosDivisaoChart } from "@/components/AtestadosDivisaoChart";
import { AtestadosMesChart } from "@/components/AtestadosMesChart";

export type ResumoAtestado = {
  mes: string;
  divisao: string;
  cid: string;
  funcao: string;
  total: number;
  dias: number;
  plantoes: number;
};

type TotaisAtestados = {
  totalAtestados: number;
  totalDiasAbonados: number;
  totalPlantoesAbonados: number;
};

type DashboardAtestadosClientProps = {
  resumo: ResumoAtestado[];
  totais: TotaisAtestados;
  error?: string | null;
};

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

function somarPorChave<T extends string>(
  itens: ResumoAtestado[],
  getChave: (item: ResumoAtestado) => T
) {
  const mapa = new Map<T, number>();

  itens.forEach((item) => {
    const chave = getChave(item);
    mapa.set(chave, (mapa.get(chave) || 0) + item.total);
  });

  return Array.from(mapa.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}

function somarTotais(itens: ResumoAtestado[]) {
  return itens.reduce(
    (total, item) => ({
      atestados: total.atestados + item.total,
      dias: total.dias + item.dias,
      plantoes: total.plantoes + item.plantoes,
    }),
    {
      atestados: 0,
      dias: 0,
      plantoes: 0,
    }
  );
}

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(valor);
}

function CardIndicador({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#171a23] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <p className="text-sm font-medium text-slate-400">{titulo}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-white">
        {valor}
      </p>
      {subtitulo && <p className="mt-2 text-xs text-slate-500">{subtitulo}</p>}
    </div>
  );
}

export default function DashboardAtestadosClient({
  resumo,
  totais,
  error,
}: DashboardAtestadosClientProps) {
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<string | null>(
    null
  );

  const filtroAtivo = Boolean(mesSelecionado || divisaoSelecionada);

  const dados = useMemo(() => {
    const filtrados = resumo.filter((item) => {
      const mesValido = mesSelecionado ? item.mes === mesSelecionado : true;
      const divisaoValida = divisaoSelecionada
        ? item.divisao === divisaoSelecionada
        : true;

      return mesValido && divisaoValida;
    });

    const baseMes = resumo.filter((item) =>
      divisaoSelecionada ? item.divisao === divisaoSelecionada : true
    );
    const baseDivisao = resumo.filter((item) =>
      mesSelecionado ? item.mes === mesSelecionado : true
    );

    const atestadosPorMes = ordemMeses
      .map((mes) => ({
        mes,
        total: baseMes
          .filter((item) => item.mes === mes)
          .reduce((total, item) => total + item.total, 0),
      }))
      .filter((item) => item.total > 0);

    const divisaoMap = new Map<string, number>();
    baseDivisao.forEach((item) => {
      divisaoMap.set(
        item.divisao,
        (divisaoMap.get(item.divisao) || 0) + item.total
      );
    });

    const atestadosPorDivisao = Array.from(divisaoMap.entries())
      .map(([divisao, total]) => ({ divisao, total }))
      .sort((a, b) => b.total - a.total);

    return {
      filtrados,
      totaisFiltrados: somarTotais(filtrados),
      atestadosPorMes,
      atestadosPorDivisao,
      cidRanking: somarPorChave(filtrados, (item) => item.cid).slice(0, 10),
      funcaoRanking: somarPorChave(filtrados, (item) => item.funcao).slice(
        0,
        10
      ),
    };
  }, [divisaoSelecionada, mesSelecionado, resumo]);

  function alternarMes(mes: string) {
    setMesSelecionado((atual) => (atual === mes ? null : mes));
  }

  function alternarDivisao(divisao: string) {
    setDivisaoSelecionada((atual) => (atual === divisao ? null : divisao));
  }

  function limparFiltros() {
    setMesSelecionado(null);
    setDivisaoSelecionada(null);
  }

  return (
    <main className="min-h-screen min-w-0 bg-[#11141b] p-8 text-slate-100">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(168,85,247,0.22),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Dashboard RH
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Dashboard de Atestados
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Indicadores resumidos de atestados. Os dados gigantes ficam agregados
          no servidor para a tela carregar com menos peso.
        </p>
      </section>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          Erro ao buscar atestados.
        </p>
      )}

      {filtroAtivo && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[22px] border border-purple-300/20 bg-purple-300/[0.07] px-4 py-3">
          <span className="text-sm font-semibold text-purple-100">
            Seleção ativa:
          </span>
          {mesSelecionado && (
            <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-3 py-1 text-xs font-bold text-purple-100">
              Mês {mesSelecionado}
            </span>
          )}
          {divisaoSelecionada && (
            <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-3 py-1 text-xs font-bold text-purple-100">
              {divisaoSelecionada}
            </span>
          )}
          <button
            type="button"
            onClick={limparFiltros}
            className="ml-auto rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/[0.1]"
          >
            Limpar seleção
          </button>
        </div>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <CardIndicador
          titulo="Total de atestados"
          valor={
            filtroAtivo
              ? dados.totaisFiltrados.atestados
              : totais.totalAtestados
          }
          subtitulo={filtroAtivo ? "Resultado da seleção" : "Total importado"}
        />
        <CardIndicador
          titulo="Dias abonados"
          valor={formatarNumero(
            filtroAtivo ? dados.totaisFiltrados.dias : totais.totalDiasAbonados
          )}
          subtitulo={filtroAtivo ? "Considerando a seleção" : "Soma geral"}
        />
        <CardIndicador
          titulo="Plantões abonados"
          valor={formatarNumero(
            filtroAtivo
              ? dados.totaisFiltrados.plantoes
              : totais.totalPlantoesAbonados
          )}
          subtitulo={filtroAtivo ? "Considerando a seleção" : "Soma geral"}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
          <h2 className="text-xl font-semibold text-white">
            Atestados por mês
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Clique em um mês para recalcular divisão, CID e funções.
          </p>
          <div className="mt-6">
            <AtestadosMesChart
              data={dados.atestadosPorMes}
              selectedMes={mesSelecionado}
              onSelectMes={alternarMes}
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
          <h2 className="text-xl font-semibold text-white">
            Atestados por divisão
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Clique em uma divisão para recalcular os demais indicadores.
          </p>
          <div className="mt-6">
            <AtestadosDivisaoChart
              data={dados.atestadosPorDivisao}
              selectedDivisao={divisaoSelecionada}
              onSelectDivisao={alternarDivisao}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TabelaRanking
          titulo="Top 10 CID"
          descricao="CIDs mais frequentes dentro da seleção atual."
          coluna="CID"
          dados={dados.cidRanking}
        />
        <TabelaRanking
          titulo="Top 10 funções"
          descricao="Funções com maior quantidade de atestados na seleção."
          coluna="Função"
          dados={dados.funcaoRanking}
        />
      </section>
    </main>
  );
}

function TabelaRanking({
  titulo,
  descricao,
  coluna,
  dados,
}: {
  titulo: string;
  descricao: string;
  coluna: string;
  dados: { nome: string; total: number }[];
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
      <h2 className="text-xl font-semibold text-white">{titulo}</h2>
      <p className="mt-1 text-sm text-slate-400">{descricao}</p>

      <div className="voxx-scrollbar mt-5 overflow-x-auto rounded-[22px] border border-white/10 bg-[#202532]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[#2a3040]">
            <tr className="border-b border-white/10 text-slate-300">
              <th className="px-4 py-3">{coluna}</th>
              <th className="px-4 py-3">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item) => (
              <tr
                key={item.nome}
                className="border-b border-white/10 text-slate-200 transition hover:bg-white/[0.055]"
              >
                <td className="px-4 py-3 font-semibold text-slate-100">
                  {item.nome}
                </td>
                <td className="px-4 py-3">{item.total}</td>
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={2}>
                  Nenhum registro encontrado para a seleção atual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
