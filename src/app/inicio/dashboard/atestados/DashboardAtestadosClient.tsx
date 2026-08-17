"use client";

import { useMemo, useState } from "react";
import { AtestadosDivisaoChart } from "@/components/AtestadosDivisaoChart";
import { AtestadosMesChart } from "@/components/AtestadosMesChart";
import { useTema } from "@/contexts/TemaContext";

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
    <div className="voxx-dashboard-metric relative overflow-hidden rounded-[24px] border border-[var(--voxx-border)] bg-[var(--voxx-surface-raised)] p-5 shadow-[var(--voxx-shadow-soft)]">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-[var(--voxx-primary)]" />
      <p className="voxx-text-muted text-xs font-bold uppercase tracking-[0.16em]">
        {titulo}
      </p>
      <p className="voxx-text-primary mt-3 text-3xl font-bold tracking-tight">
        {valor}
      </p>
      {subtitulo && (
        <p className="voxx-text-muted mt-2 text-xs">
          {subtitulo}
        </p>
      )}
    </div>
  );
}

export default function DashboardAtestadosClient({
  resumo,
  totais,
  error,
}: DashboardAtestadosClientProps) {
  const { temaDia } = useTema();
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
    <main className="voxx-dashboard-atestados voxx-page min-h-screen min-w-0 p-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Dashboard RH
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          Dashboard de Atestados
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Indicadores resumidos de atestados. Os dados gigantes ficam agregados
          no servidor para a tela carregar com menos peso.
        </p>
      </section>

      {error && (
        <p
          className={
            temaDia
              ? "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"
          }
        >
          Erro ao buscar atestados.
        </p>
      )}

      {filtroAtivo && (
        <div className="voxx-surface mt-6 flex flex-wrap items-center gap-3 rounded-[22px] px-4 py-3">
          <span className="voxx-text-primary text-sm font-semibold">
            Seleção ativa:
          </span>
          {mesSelecionado && (
            <span className="rounded-full border border-amber-500 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">
              Mês {mesSelecionado}
            </span>
          )}
          {divisaoSelecionada && (
            <span className="rounded-full border border-amber-500 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">
              {divisaoSelecionada}
            </span>
          )}
          <button
            type="button"
            onClick={limparFiltros}
            className="voxx-button-secondary ml-auto rounded-full px-3 py-1 text-xs font-bold"
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
        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Evolução mensal</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Atestados por mês
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em um mês para recalcular divisão, CID e funções.
          </p>
          <div className="mt-6">
            <AtestadosMesChart
              data={dados.atestadosPorMes}
              selectedMes={mesSelecionado}
              onSelectMes={alternarMes}
              temaDia={temaDia}
            />
          </div>
        </div>

        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Distribuição assistencial</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Atestados por divisão
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em uma divisão para recalcular os demais indicadores.
          </p>
          <div className="mt-6">
            <AtestadosDivisaoChart
              data={dados.atestadosPorDivisao}
              selectedDivisao={divisaoSelecionada}
              onSelectDivisao={alternarDivisao}
              temaDia={temaDia}
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
    <div className="voxx-dashboard-atestados-table voxx-surface rounded-[28px] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Detalhamento</p>
      <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
        {titulo}
      </h2>
      <p className="voxx-text-muted mt-1 text-sm">
        {descricao}
      </p>

      <div className="voxx-scrollbar voxx-surface-raised mt-5 overflow-x-auto rounded-[22px]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[var(--voxx-surface-soft)]">
            <tr className="voxx-text-muted border-b border-[var(--voxx-border)]">
              <th className="px-4 py-3">{coluna}</th>
              <th className="px-4 py-3">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item) => (
              <tr key={item.nome} className="voxx-text-muted border-b border-[var(--voxx-border)] transition hover:bg-[var(--voxx-surface-soft)]">
                <td className="voxx-text-primary px-4 py-3 font-semibold">
                  {item.nome}
                </td>
                <td className="px-4 py-3">{item.total}</td>
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <td className="voxx-text-muted px-4 py-8 text-center" colSpan={2}>
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
