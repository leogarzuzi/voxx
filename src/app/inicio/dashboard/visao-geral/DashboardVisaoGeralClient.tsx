"use client";

import { useMemo, useState } from "react";
import { PrefixChart } from "@/components/PrefixChart";
import { DivisionChart } from "@/components/DivisionChart";
import { TurnoverChart } from "@/components/TurnoverChart";
import { classificarDivisao } from "@/lib/classificarDivisao";
import { useTema } from "@/contexts/TemaContext";

type Registro = Record<string, unknown>;

type TurnoverItem = {
  mes: string;
  admitidos: number;
  desligados: number;
  ativosFimMes: number;
  turnover: number;
};

type DashboardVisaoGeralClientProps = {
  colaboradores: Registro[];
  admissoes: Registro[];
  desligamentos: Registro[];
  atestados: Registro[];
  turnoverMensal: TurnoverItem[];
  totais: {
    colaboradores: number;
    admissoes: number;
    desligamentos: number;
    atestados: number;
  };
  colaboradoresError?: string | null;
};

function textoCampo(registro: Registro, campo: string) {
  const valor = registro[campo];

  if (valor === null || valor === undefined) return "";

  return String(valor);
}

function pegaPrefixo(registro: Registro) {
  return textoCampo(registro, "pref");
}

function pegaCargo(registro: Registro) {
  return textoCampo(registro, "cargo");
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

function filtrarRegistros(
  registros: Registro[],
  prefixoSelecionado: string | null,
  divisaoSelecionada: string | null
) {
  return registros.filter((registro) => {
    const prefixoValido = prefixoSelecionado
      ? pegaPrefixo(registro) === prefixoSelecionado
      : true;
    const divisaoValida = divisaoSelecionada
      ? classificarDivisao(pegaCargo(registro)) === divisaoSelecionada
      : true;

    return prefixoValido && divisaoValida;
  });
}

function calcularPrefixos(registros: Registro[]) {
  return ["40", "47", "95"].map((prefixo) => ({
    prefixo,
    total: registros.filter((registro) => pegaPrefixo(registro) === prefixo)
      .length,
  }));
}

function calcularDivisoes(registros: Registro[]) {
  const divisaoMap = new Map<string, number>();

  registros.forEach((registro) => {
    const divisao = classificarDivisao(pegaCargo(registro));
    divisaoMap.set(divisao, (divisaoMap.get(divisao) || 0) + 1);
  });

  return Array.from(divisaoMap.entries())
    .map(([divisao, total]) => ({ divisao, total }))
    .sort((a, b) => b.total - a.total);
}

function calcularTurnoverMensal(
  colaboradoresFiltrados: Registro[],
  admissoesFiltradas: Registro[],
  desligamentosFiltrados: Registro[]
) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const mesesAteAtual = meses.filter((mes) => mes.numero <= mesAtual);

  return mesesAteAtual.map((mes) => {
    const fim = fimDoMes(anoAtual, mes.numero);

    const admitidosMes = admissoesFiltradas.filter((admissao) => {
      const data = parseDataBR(textoCampo(admissao, "exercicio"));
      return (
        data &&
        data.getFullYear() === anoAtual &&
        data.getMonth() === mes.numero
      );
    }).length;

    const desligadosMes = desligamentosFiltrados.filter((desligamento) => {
      const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
      return (
        data &&
        data.getFullYear() === anoAtual &&
        data.getMonth() === mes.numero
      );
    }).length;

    const admissoesDepois = admissoesFiltradas.filter((admissao) => {
      const data = parseDataBR(textoCampo(admissao, "exercicio"));
      return data && data > fim;
    }).length;

    const desligamentosDepois = desligamentosFiltrados.filter((desligamento) => {
      const data = parseDataBR(textoCampo(desligamento, "data_desligamento"));
      return data && data > fim;
    }).length;

    const ativosFimMes =
      colaboradoresFiltrados.length - admissoesDepois + desligamentosDepois;

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="voxx-text-muted text-xs font-bold uppercase tracking-[0.16em]">{titulo}</p>
          <p className="voxx-text-primary mt-3 text-3xl font-bold tracking-tight">{valor}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--voxx-focus)] text-[var(--voxx-primary)]">
          <span className="h-3 w-3 rounded-full bg-current shadow-[0_0_0_5px_var(--voxx-focus)]" />
        </span>
      </div>
      {subtitulo && <p className="voxx-text-muted mt-2 text-xs">{subtitulo}</p>}
    </div>
  );
}

export default function DashboardVisaoGeralClient({
  colaboradores,
  admissoes,
  desligamentos,
  atestados,
  turnoverMensal,
  totais,
  colaboradoresError,
}: DashboardVisaoGeralClientProps) {
  const { temaDia } = useTema();
  const [prefixoSelecionado, setPrefixoSelecionado] = useState<string | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<string | null>(null);

  const filtroAtivo = Boolean(prefixoSelecionado || divisaoSelecionada);

  const dadosFiltrados = useMemo(() => {
    const colaboradoresFiltrados = filtrarRegistros(
      colaboradores,
      prefixoSelecionado,
      divisaoSelecionada
    );
    const admissoesFiltradas = filtrarRegistros(
      admissoes,
      prefixoSelecionado,
      divisaoSelecionada
    );
    const desligamentosFiltrados = filtrarRegistros(
      desligamentos,
      prefixoSelecionado,
      divisaoSelecionada
    );
    const atestadosFiltrados = filtrarRegistros(
      atestados,
      prefixoSelecionado,
      divisaoSelecionada
    );
    const colaboradoresParaGraficoPrefixo = filtrarRegistros(
      colaboradores,
      null,
      divisaoSelecionada
    );
    const colaboradoresParaGraficoDivisao = filtrarRegistros(
      colaboradores,
      prefixoSelecionado,
      null
    );

    const turnoverFiltrado = filtroAtivo
      ? calcularTurnoverMensal(
          colaboradoresFiltrados,
          admissoesFiltradas,
          desligamentosFiltrados
        )
      : turnoverMensal;

    return {
      colaboradoresFiltrados,
      admissoesFiltradas,
      desligamentosFiltrados,
      atestadosFiltrados,
      prefixosFiltrados: calcularPrefixos(colaboradoresParaGraficoPrefixo),
      divisoesFiltradas: calcularDivisoes(colaboradoresParaGraficoDivisao),
      turnoverFiltrado,
    };
  }, [
    admissoes,
    atestados,
    colaboradores,
    desligamentos,
    divisaoSelecionada,
    filtroAtivo,
    prefixoSelecionado,
    turnoverMensal,
  ]);

  const turnoverMedio =
    dadosFiltrados.turnoverFiltrado.length > 0
      ? dadosFiltrados.turnoverFiltrado.reduce(
          (acc, item) => acc + item.turnover,
          0
        ) / dadosFiltrados.turnoverFiltrado.length
      : 0;

  function alternarPrefixo(prefixo: string) {
    setPrefixoSelecionado((atual) => (atual === prefixo ? null : prefixo));
  }

  function alternarDivisao(divisao: string) {
    setDivisaoSelecionada((atual) => (atual === divisao ? null : divisao));
  }

  function limparFiltros() {
    setPrefixoSelecionado(null);
    setDivisaoSelecionada(null);
  }

  return (
    <main className="voxx-dashboard-geral voxx-page min-h-screen min-w-0 p-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Dashboard RH
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          Visão Geral RH
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Acompanhe colaboradores, admissões, desligamentos, atestados e
          turnover com filtros rápidos pelos gráficos.
        </p>
      </section>

      {colaboradoresError && (
        <p className={temaDia ? "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"}>
          Erro ao buscar dados de colaboradores.
        </p>
      )}

      {filtroAtivo && (
        <div className="voxx-surface mt-6 flex flex-wrap items-center gap-3 rounded-[22px] px-4 py-3">
          <span className="voxx-text-primary text-sm font-semibold">
            Filtro ativo:
          </span>
          {prefixoSelecionado && (
            <span className="rounded-full border border-[var(--voxx-primary)] bg-[var(--voxx-focus)] px-3 py-1 text-xs font-bold text-[var(--voxx-primary)]">
              Prefixo {prefixoSelecionado}
            </span>
          )}
          {divisaoSelecionada && (
            <span className="rounded-full border border-[var(--voxx-primary)] bg-[var(--voxx-focus)] px-3 py-1 text-xs font-bold text-[var(--voxx-primary)]">
              {divisaoSelecionada}
            </span>
          )}
          <button
            type="button"
            onClick={limparFiltros}
            className="voxx-button-secondary ml-auto rounded-full px-3 py-1 text-xs font-bold"
          >
            Limpar filtros
          </button>
        </div>
      )}

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardIndicador
            titulo="Colaboradores ativos"
            valor={filtroAtivo ? dadosFiltrados.colaboradoresFiltrados.length : totais.colaboradores}
            subtitulo={filtroAtivo ? "Filtrado pelo gráfico" : "Total da base"}
          />
          <CardIndicador
            titulo="Admissões registradas"
            valor={filtroAtivo ? dadosFiltrados.admissoesFiltradas.length : totais.admissoes}
            subtitulo={filtroAtivo ? "Registros compatíveis" : "Total da base"}
          />
          <CardIndicador
            titulo="Desligamentos registrados"
            valor={filtroAtivo ? dadosFiltrados.desligamentosFiltrados.length : totais.desligamentos}
            subtitulo={filtroAtivo ? "Registros compatíveis" : "Total da base"}
          />
          <CardIndicador
            titulo="Atestados registrados"
            valor={filtroAtivo ? dadosFiltrados.atestadosFiltrados.length : totais.atestados}
            subtitulo={filtroAtivo ? "Registros compatíveis" : "Total da base"}
          />
        </div>

        <aside className="flex min-h-[220px] flex-col justify-between rounded-[26px] bg-[#153d65] p-6 text-white shadow-[var(--voxx-shadow)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b9dbea]">Turnover médio</p>
            <p className="mt-5 text-5xl font-bold tracking-tight">{turnoverMedio.toFixed(2)}%</p>
            <p className="mt-3 text-sm leading-6 text-[#dceaf3]">{filtroAtivo ? "Resultado considerando os filtros ativos." : "Média consolidada do ano atual."}</p>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-[#b9dbea]"><span>Referência</span><span>Meta 5%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[var(--rs-cyan-400)]" style={{ width: `${Math.min((turnoverMedio / 5) * 100, 100)}%` }} /></div>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="voxx-surface rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--voxx-primary)]">Distribuição da base</p>
              <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
                Colaboradores por prefixo
              </h2>
              <p className="voxx-text-muted mt-1 text-sm">
                Clique em uma barra para filtrar o dashboard.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <PrefixChart
              data={dadosFiltrados.prefixosFiltrados}
              selectedPrefixo={prefixoSelecionado}
              onSelectPrefixo={alternarPrefixo}
              temaDia={temaDia}
            />
          </div>
        </div>

        <div className="voxx-surface rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--voxx-primary)]">Composição institucional</p>
              <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
                Colaboradores por divisão
              </h2>
              <p className="voxx-text-muted mt-1 text-sm">
                Clique em uma divisão para cruzar com o prefixo.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <DivisionChart
              data={dadosFiltrados.divisoesFiltradas}
              selectedDivisao={divisaoSelecionada}
              onSelectDivisao={alternarDivisao}
              temaDia={temaDia}
            />
          </div>
        </div>
      </section>

      <section className="voxx-dashboard-turnover voxx-surface mt-6 rounded-[28px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--voxx-primary)]">Evolução mensal</p>
            <h2 className="voxx-text-primary mt-2 text-xl font-semibold">
              Turnover mensal
            </h2>
            <p className="voxx-text-muted mt-1 text-sm">
              Comparativo mensal de turnover da instituição.
            </p>
          </div>

          <div className={temaDia ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" : "rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-100"}>
            Meta: 5%
          </div>
        </div>

        <div className="mt-8">
          <TurnoverChart data={dadosFiltrados.turnoverFiltrado} temaDia={temaDia} />
        </div>

        <div className="voxx-scrollbar voxx-surface-raised mt-8 overflow-x-auto rounded-[22px]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className={temaDia ? "bg-slate-100" : "bg-[#2a3040]"}>
              <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3">Admitidos</th>
                <th className="px-4 py-3">Desligados</th>
                <th className="px-4 py-3">Ativos no fim do mês</th>
                <th className="px-4 py-3">Turnover</th>
              </tr>
            </thead>

            <tbody>
              {dadosFiltrados.turnoverFiltrado.map((item) => (
                <tr
                  key={item.mes}
                  className={temaDia ? "border-b border-slate-200 text-slate-700 transition hover:bg-slate-50" : "border-b border-white/10 text-slate-200 transition hover:bg-white/[0.055]"}
                >
                  <td className={temaDia ? "px-4 py-3 font-semibold text-slate-950" : "px-4 py-3 font-semibold text-slate-100"}>
                    {item.mes}
                  </td>
                  <td className="px-4 py-3">{item.admitidos}</td>
                  <td className="px-4 py-3">{item.desligados}</td>
                  <td className="px-4 py-3">{item.ativosFimMes}</td>
                  <td className={temaDia ? "px-4 py-3 font-semibold text-slate-800" : "px-4 py-3 font-semibold text-blue-100"}>
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
