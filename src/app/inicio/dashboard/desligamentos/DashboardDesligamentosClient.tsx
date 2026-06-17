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
  const { temaDia } = useTema();

  return (
    <div className={temaDia ? "rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]" : "rounded-[24px] border border-white/10 bg-[#171a23] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"}>
      <p className={temaDia ? "text-sm font-medium text-slate-500" : "text-sm font-medium text-slate-400"}>{titulo}</p>
      <p className={temaDia ? "mt-3 text-3xl font-bold tracking-tight text-slate-950" : "mt-3 text-3xl font-bold tracking-tight text-white"}>
        {valor}
      </p>
      {subtitulo && <p className="mt-2 text-xs text-slate-500">{subtitulo}</p>}
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
    <main className={temaDia ? "min-h-screen min-w-0 bg-[#f4f6fb] p-8 text-slate-950" : "min-h-screen min-w-0 bg-[#11141b] p-8 text-slate-100"}>
      <section className={temaDia ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef3fb_58%,#e8edf6_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)]" : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(239,68,68,0.2),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"}>
        <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"}>
          Dashboard RH
        </p>
        <h1 className={temaDia ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950" : "mt-3 text-4xl font-semibold tracking-tight text-white"}>
          Dashboard de Desligamentos
        </h1>
        <p className={temaDia ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600" : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"}>
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
        <div className={temaDia ? "mt-6 flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]" : "mt-6 flex flex-wrap items-center gap-3 rounded-[22px] border border-red-300/20 bg-red-300/[0.07] px-4 py-3"}>
          <span className={temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-semibold text-red-100"}>
            Seleção ativa:
          </span>
          {mesSelecionado && (
            <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700" : "rounded-full border border-red-300/25 bg-red-300/10 px-3 py-1 text-xs font-bold text-red-100"}>
              Mês {mesSelecionado}
            </span>
          )}
          {divisaoSelecionada && (
            <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700" : "rounded-full border border-red-300/25 bg-red-300/10 px-3 py-1 text-xs font-bold text-red-100"}>
              {divisaoSelecionada}
            </span>
          )}
          {tipoSelecionado && (
            <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700" : "rounded-full border border-red-300/25 bg-red-300/10 px-3 py-1 text-xs font-bold text-red-100"}>
              {tipoSelecionado}
            </span>
          )}
          <button
            type="button"
            onClick={limparFiltros}
            className={temaDia ? "ml-auto rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100" : "ml-auto rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/[0.1]"}
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
        <div className={temaDia ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
          <h2 className={temaDia ? "text-xl font-semibold text-slate-950" : "text-xl font-semibold text-white"}>
            Desligamentos por mês
          </h2>
          <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
            Clique em um mês para recalcular divisão e tipo.
          </p>
          <div className="mt-6">
            <DesligamentosMesChart
              data={dados.desligamentosPorMes}
              selectedMes={mesSelecionado}
              onSelectMes={alternarMes}
            />
          </div>
        </div>

        <div className={temaDia ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
          <h2 className={temaDia ? "text-xl font-semibold text-slate-950" : "text-xl font-semibold text-white"}>
            Desligamentos por divisão
          </h2>
          <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
            Clique em uma divisão para recalcular mês e tipo.
          </p>
          <div className="mt-6">
            <DivisionChart
              data={dados.desligamentosPorDivisao}
              selectedDivisao={divisaoSelecionada}
              onSelectDivisao={alternarDivisao}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className={temaDia ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
          <h2 className={temaDia ? "text-xl font-semibold text-slate-950" : "text-xl font-semibold text-white"}>Resumo mensal</h2>
          <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
            A tabela acompanha a seleção feita nos gráficos.
          </p>

          <div className={temaDia ? "voxx-scrollbar mt-6 overflow-x-auto rounded-[22px] border border-slate-200 bg-white" : "voxx-scrollbar mt-6 overflow-x-auto rounded-[22px] border border-white/10 bg-[#202532]"}>
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

        <div className={temaDia ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
          <h2 className={temaDia ? "text-xl font-semibold text-slate-950" : "text-xl font-semibold text-white"}>
            Tipos de desligamento
          </h2>
          <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
            Clique em uma fatia para cruzar com mês e divisão.
          </p>
          <div className="mt-4 min-h-[460px]">
            <TipoDesligamentoChart
              data={dados.desligamentosPorTipo}
              selectedTipo={tipoSelecionado}
              onSelectTipo={alternarTipo}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
