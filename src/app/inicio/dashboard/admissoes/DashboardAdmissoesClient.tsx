"use client";

import { useMemo, useState } from "react";
import { AdmissoesMesChart } from "@/components/AdmissoesMesChart";
import { DivisionChart } from "@/components/DivisionChart";
import { classificarDivisao } from "@/lib/classificarDivisao";
import { useTema } from "@/contexts/TemaContext";

type Registro = Record<string, unknown>;

type DashboardAdmissoesClientProps = {
  admissoes: Registro[];
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

function filtrarAdmissoes(
  admissoes: Registro[],
  mesSelecionado: string | null,
  divisaoSelecionada: string | null
) {
  return admissoes.filter((admissao) => {
    const data = parseDataBR(textoCampo(admissao, "exercicio"));
    const mesValido = mesSelecionado
      ? data && meses[data.getMonth()] === mesSelecionado
      : true;
    const divisaoValida = divisaoSelecionada
      ? classificarDivisao(textoCampo(admissao, "cargo")) === divisaoSelecionada
      : true;

    return mesValido && divisaoValida;
  });
}

function calcularAdmissoesPorMes(admissoes: Registro[]) {
  return meses
    .map((mes, index) => {
      const total = admissoes.filter((admissao) => {
        const data = parseDataBR(textoCampo(admissao, "exercicio"));
        return data && data.getMonth() === index;
      }).length;

      return { mes, total };
    })
    .filter((item) => item.total > 0);
}

function calcularAdmissoesPorDivisao(admissoes: Registro[]) {
  const divisaoMap = new Map<string, number>();

  admissoes.forEach((admissao) => {
    const divisao = classificarDivisao(textoCampo(admissao, "cargo"));
    divisaoMap.set(divisao, (divisaoMap.get(divisao) || 0) + 1);
  });

  return Array.from(divisaoMap.entries())
    .map(([divisao, total]) => ({ divisao, total }))
    .sort((a, b) => b.total - a.total);
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

export default function DashboardAdmissoesClient({
  admissoes,
  anoAtual,
  mesAtual,
  error,
}: DashboardAdmissoesClientProps) {
  const { temaDia } = useTema();
const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<string | null>(null);

  const admissoesAno = useMemo(
    () =>
      admissoes.filter((admissao) => {
        const data = parseDataBR(textoCampo(admissao, "exercicio"));
        return data && data.getFullYear() === anoAtual;
      }),
    [admissoes, anoAtual]
  );

  const filtroAtivo = Boolean(mesSelecionado || divisaoSelecionada);

  const dados = useMemo(() => {
    const admissoesFiltradas = filtrarAdmissoes(
      admissoesAno,
      mesSelecionado,
      divisaoSelecionada
    );
    const admissoesParaGraficoMes = filtrarAdmissoes(
      admissoesAno,
      null,
      divisaoSelecionada
    );
    const admissoesParaGraficoDivisao = filtrarAdmissoes(
      admissoesAno,
      mesSelecionado,
      null
    );

    return {
      admissoesFiltradas,
      admissoesPorMes: calcularAdmissoesPorMes(admissoesParaGraficoMes),
      admissoesPorDivisao: calcularAdmissoesPorDivisao(
        admissoesParaGraficoDivisao
      ),
    };
  }, [admissoesAno, divisaoSelecionada, mesSelecionado]);

  const admissoesMesAtual = dados.admissoesFiltradas.filter((admissao) => {
    const data = parseDataBR(textoCampo(admissao, "exercicio"));
    return data && data.getMonth() === mesAtual;
  }).length;

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
    <main className="voxx-dashboard-admissoes voxx-page min-h-screen min-w-0 p-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Dashboard RH
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          Dashboard de Admissões
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Acompanhe admissões por mês e divisão, com filtros rápidos clicando
          diretamente nos gráficos.
        </p>
      </section>

      {error && (
        <p className={temaDia ? "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"}>
          Erro ao buscar admissões.
        </p>
      )}

      {filtroAtivo && (
        <div className="voxx-surface mt-6 flex flex-wrap items-center gap-3 rounded-[22px] px-4 py-3">
          <span className="voxx-text-primary text-sm font-semibold">
            Seleção ativa:
          </span>
          {mesSelecionado && (
            <span className="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
              Mês {mesSelecionado}
            </span>
          )}
          {divisaoSelecionada && (
            <span className="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
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
          titulo="Admissões no ano"
          valor={filtroAtivo ? dados.admissoesFiltradas.length : admissoesAno.length}
          subtitulo={filtroAtivo ? "Resultado da seleção" : "Total do ano"}
        />
        <CardIndicador
          titulo="Admissões no mês atual"
          valor={admissoesMesAtual}
          subtitulo={filtroAtivo ? "Considerando a seleção" : meses[mesAtual]}
        />
        <CardIndicador
          titulo="Ano analisado"
          valor={anoAtual}
          subtitulo="Base de admissões"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Evolução anual</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Admissões por mês
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em um mês para filtrar a divisão e os indicadores.
          </p>
          <div className="mt-6">
            <AdmissoesMesChart
              data={dados.admissoesPorMes}
              selectedMes={mesSelecionado}
              onSelectMes={alternarMes}
              temaDia={temaDia}
            />
          </div>
        </div>

        <div className="voxx-surface rounded-[28px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Composição da entrada</p>
          <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
            Admissões por divisão
          </h2>
          <p className="voxx-text-muted mt-1 text-sm">
            Clique em uma divisão para recalcular o gráfico mensal.
          </p>
          <div className="mt-6">
            <DivisionChart
              data={dados.admissoesPorDivisao}
              selectedDivisao={divisaoSelecionada}
              onSelectDivisao={alternarDivisao}
              temaDia={temaDia}
              corBase="#2f965d"
              corAtiva="#4ade80"
            />
          </div>
        </div>
      </section>

      <section className="voxx-dashboard-admissoes-table voxx-surface mt-6 rounded-[28px] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Detalhamento</p>
            <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
              Resumo mensal
            </h2>
            <p className="voxx-text-muted mt-1 text-sm">
              A tabela acompanha a seleção feita nos gráficos.
            </p>
          </div>
        </div>

        <div className="voxx-scrollbar voxx-surface-raised mt-6 overflow-x-auto rounded-[22px]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className={temaDia ? "bg-slate-100" : "bg-[#2a3040]"}>
              <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3">Admissões</th>
              </tr>
            </thead>

            <tbody>
              {dados.admissoesPorMes.map((item) => (
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

              {dados.admissoesPorMes.length === 0 && (
                <tr>
                  <td className={temaDia ? "px-4 py-8 text-center text-slate-500" : "px-4 py-8 text-center text-slate-400"} colSpan={2}>
                    Nenhuma admissão encontrada para a seleção atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
