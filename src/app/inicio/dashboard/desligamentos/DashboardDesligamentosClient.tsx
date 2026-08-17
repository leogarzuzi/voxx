"use client";

import { useMemo, useState } from "react";
import { DesligamentosMesChart } from "@/components/DesligamentosMesChart";
import { DivisionChart } from "@/components/DivisionChart";
import { TipoDesligamentoChart } from "@/components/TipoDesligamentoChart";
import { classificarDivisao } from "@/lib/classificarDivisao";
import { useTema } from "@/contexts/TemaContext";

type Registro = Record<string, unknown>;

type DashboardDesligamentosClientProps = {
  desligamentos: Registro[];
  anoAtual: number;
  mesAtual: number;
  error?: string | null;
};

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

function tipoDesligamento(registro: Registro) {
  return textoCampo(registro, "tipo_desligamento").trim() || "Nao informado";
}

function filtrarDesligamentos(
  desligamentos: Registro[],
  mesSelecionado: string | null,
  divisaoSelecionada: string | null,
  tipoSelecionado: string | null
) {
  return desligamentos.filter((desligamento) => {
    const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
    const mesValido = mesSelecionado
      ? data && meses[data.getMonth()] === mesSelecionado
      : true;
    const divisaoValida = divisaoSelecionada
      ? classificarDivisao(textoCampo(desligamento, "cargo")) ===
        divisaoSelecionada
      : true;
    const tipoValido = tipoSelecionado
      ? tipoDesligamento(desligamento) === tipoSelecionado
      : true;

    return mesValido && divisaoValida && tipoValido;
  });
}

function calcularDesligamentosPorMes(desligamentos: Registro[]) {
  return meses
    .map((mes, index) => {
      const total = desligamentos.filter((desligamento) => {
        const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
        return data && data.getMonth() === index;
      }).length;

      return { mes, total };
    })
    .filter((item) => item.total > 0);
}

function calcularDesligamentosPorDivisao(desligamentos: Registro[]) {
  const divisaoMap = new Map<string, number>();

  desligamentos.forEach((desligamento) => {
    const divisao = classificarDivisao(textoCampo(desligamento, "cargo"));
    divisaoMap.set(divisao, (divisaoMap.get(divisao) || 0) + 1);
  });

  return Array.from(divisaoMap.entries())
    .map(([divisao, total]) => ({ divisao, total }))
    .sort((a, b) => b.total - a.total);
}

function calcularDesligamentosPorTipo(desligamentos: Registro[]) {
  const tipoMap = new Map<string, number>();

  desligamentos.forEach((desligamento) => {
    const tipo = tipoDesligamento(desligamento);
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });

  return Array.from(tipoMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
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
      <p className="voxx-text-muted text-xs font-bold uppercase tracking-[0.16em]">{titulo}</p>
      <p className="voxx-text-primary mt-3 text-3xl font-bold tracking-tight">
        {valor}
      </p>
      {subtitulo && <p className="voxx-text-muted mt-2 text-xs">{subtitulo}</p>}
    </div>
  );
}

export default function DashboardDesligamentosClient({
  desligamentos,
  anoAtual,
  mesAtual,
  error,
}: DashboardDesligamentosClientProps) {
  const { temaDia } = useTema();
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<string | null>(
    null
  );
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);

  const desligamentosAno = useMemo(
    () =>
      desligamentos.filter((desligamento) => {
        const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
        return data && data.getFullYear() === anoAtual;
      }),
    [desligamentos, anoAtual]
  );

  const filtroAtivo = Boolean(
    mesSelecionado || divisaoSelecionada || tipoSelecionado
  );

  const dados = useMemo(() => {
    const desligamentosFiltrados = filtrarDesligamentos(
      desligamentosAno,
      mesSelecionado,
      divisaoSelecionada,
      tipoSelecionado
    );
    const desligamentosParaGraficoMes = filtrarDesligamentos(
      desligamentosAno,
      null,
      divisaoSelecionada,
      tipoSelecionado
    );
    const desligamentosParaGraficoDivisao = filtrarDesligamentos(
      desligamentosAno,
      mesSelecionado,
      null,
      tipoSelecionado
    );
    const desligamentosParaGraficoTipo = filtrarDesligamentos(
      desligamentosAno,
      mesSelecionado,
      divisaoSelecionada,
      null
    );

    return {
      desligamentosFiltrados,
      desligamentosPorMes: calcularDesligamentosPorMes(
        desligamentosParaGraficoMes
      ),
      desligamentosPorDivisao: calcularDesligamentosPorDivisao(
        desligamentosParaGraficoDivisao
      ),
      desligamentosPorTipo: calcularDesligamentosPorTipo(
        desligamentosParaGraficoTipo
      ),
    };
  }, [desligamentosAno, divisaoSelecionada, mesSelecionado, tipoSelecionado]);

  const desligamentosMesAtual = dados.desligamentosFiltrados.filter(
    (desligamento) => {
      const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
      return data && data.getMonth() === mesAtual;
    }
  ).length;

  function alternarMes(mes: string) {
    setMesSelecionado((atual) => (atual === mes ? null : mes));
  }

  function alternarDivisao(divisao: string) {
    setDivisaoSelecionada((atual) => (atual === divisao ? null : divisao));
  }

  function alternarTipo(tipo: string) {
    setTipoSelecionado((atual) => (atual === tipo ? null : tipo));
  }

  function limparFiltros() {
    setMesSelecionado(null);
    setDivisaoSelecionada(null);
    setTipoSelecionado(null);
  }

  return (
    <main className="voxx-dashboard-desligamentos voxx-page min-h-screen min-w-0 p-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Dashboard RH
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          Dashboard de Desligamentos
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Acompanhe desligamentos por mês, divisão e tipo. Clique nos gráficos
          para cruzar as informações na própria tela.
        </p>
      </section>

      {error && (
        <p className={temaDia ? "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"}>
          Erro ao buscar desligamentos.
        </p>
      )}

      {filtroAtivo && (
        <div className="voxx-surface mt-6 flex flex-wrap items-center gap-3 rounded-[22px] px-4 py-3">
          <span className="voxx-text-primary text-sm font-semibold">
            Seleção ativa:
          </span>
          {mesSelecionado && (
            <span className="rounded-full border border-rose-500 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600">
              Mês {mesSelecionado}
            </span>
          )}
          {divisaoSelecionada && (
            <span className="rounded-full border border-rose-500 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600">
              {divisaoSelecionada}
            </span>
          )}
          {tipoSelecionado && (
            <span className="rounded-full border border-rose-500 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600">
              {tipoSelecionado}
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
          titulo="Desligamentos no ano"
          valor={
            filtroAtivo
              ? dados.desligamentosFiltrados.length
              : desligamentosAno.length
          }
          subtitulo={filtroAtivo ? "Resultado da seleção" : "Total do ano"}
        />
        <CardIndicador
          titulo="Desligamentos no mês atual"
          valor={desligamentosMesAtual}
          subtitulo={filtroAtivo ? "Considerando a seleção" : meses[mesAtual]}
        />
        <CardIndicador
          titulo="Ano analisado"
          valor={anoAtual}
          subtitulo="Base de desligamentos"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Evolução anual</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Desligamentos por mês
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em um mês para recalcular divisão e tipo.
          </p>
          <div className="mt-6">
            <DesligamentosMesChart
              data={dados.desligamentosPorMes}
              selectedMes={mesSelecionado}
              onSelectMes={alternarMes}
              temaDia={temaDia}
            />
          </div>
        </div>

        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Distribuição das saídas</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Desligamentos por divisão
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em uma divisão para recalcular mês e tipo.
          </p>
          <div className="mt-6">
            <DivisionChart
              data={dados.desligamentosPorDivisao}
              selectedDivisao={divisaoSelecionada}
              onSelectDivisao={alternarDivisao}
              temaDia={temaDia}
              corBase="#d95b62"
              corAtiva="#fb7185"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="voxx-dashboard-desligamentos-table voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Detalhamento</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">Resumo mensal</h2>
          <p className="voxx-text-muted mt-1 text-sm">
            A tabela acompanha a seleção feita nos gráficos.
          </p>

          <div className="voxx-scrollbar voxx-surface-raised mt-6 overflow-x-auto rounded-[22px]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className={temaDia ? "bg-slate-100" : "bg-[#2a3040]"}>
                <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                  <th className="px-4 py-3">Mês</th>
                  <th className="px-4 py-3">Desligamentos</th>
                </tr>
              </thead>

              <tbody>
                {dados.desligamentosPorMes.map((item) => (
                  <tr
                    key={item.mes}
                    className={temaDia ? "border-b border-slate-200 text-slate-700 transition hover:bg-slate-50" : "border-b border-white/10 text-slate-200 transition hover:bg-white/[0.055]"}
                  >
                    <td className={temaDia ? "px-4 py-3 font-semibold text-slate-950" : "px-4 py-3 font-semibold text-slate-100"}>
                      {item.mes}
                    </td>
                    <td className="px-4 py-3">{item.total}</td>
                  </tr>
                ))}

                {dados.desligamentosPorMes.length === 0 && (
                  <tr>
                    <td
                      className={temaDia ? "px-4 py-8 text-center text-slate-500" : "px-4 py-8 text-center text-slate-400"}
                      colSpan={2}
                    >
                      Nenhum desligamento encontrado para a seleção atual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Motivos registrados</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Tipos de desligamento
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em uma fatia para cruzar com mês e divisão.
          </p>
          <div className="mt-4 min-h-[460px]">
            <TipoDesligamentoChart
              data={dados.desligamentosPorTipo}
              selectedTipo={tipoSelecionado}
              onSelectTipo={alternarTipo}
              temaDia={temaDia}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
