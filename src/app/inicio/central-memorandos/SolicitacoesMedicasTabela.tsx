"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type Modalidade = "substituicao" | "troca";
type Registro = {
  id: number;
  protocolo: string;
  nome_solicitante: string;
  matricula_solicitante: string;
  funcao_solicitante: string;
  email_solicitante: string;
  data_plantao?: string;
  tipo_plantao?: string;
  nome_substituto?: string;
  matricula_substituto?: string;
  funcao_substituto?: string;
  data_plantao_solicitante?: string;
  tipo_plantao_solicitante?: string;
  nome_solicitado?: string;
  matricula_solicitado?: string;
  funcao_solicitado?: string;
  data_plantao_solicitado?: string;
  tipo_plantao_solicitado?: string;
  status: "recebido" | "cancelado";
  criado_em: string;
};

function formatarData(data?: string) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function formatarDataHora(data?: string) {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escaparCsv(valor: unknown) {
  return `"${String(valor ?? "").replace(/"/g, '""')}"`;
}

export default function SolicitacoesMedicasTabela({
  modalidade,
}: {
  modalidade: Modalidade;
}) {
  const { temaDia } = useTema();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const troca = modalidade === "troca";
  const titulo = troca ? "Trocas médicas" : "Substituições médicas";

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");
      const params = new URLSearchParams({
        modalidade,
        page: "1",
        pageSize: "100",
      });
      if (busca.trim()) params.set("busca", busca.trim().toUpperCase());
      if (status) params.set("status", status);
      if (competencia) params.set("competencia", competencia);
      const resposta = await fetch(
        `/api/central-memorandos/medicos?${params.toString()}`,
      );
      const dados = await resposta.json();
      if (!resposta.ok || !dados.success)
        throw new Error(dados.error || "Não foi possível carregar a tabela.");
      setRegistros(dados.registros ?? []);
      setTotal(dados.total ?? 0);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a tabela.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const espera = window.setTimeout(carregar, 300);
    return () => window.clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidade, busca, status, competencia]);

  const resumo = useMemo(
    () => ({
      recebidos: registros.filter((item) => item.status === "recebido").length,
      cancelados: registros.filter((item) => item.status === "cancelado")
        .length,
    }),
    [registros],
  );

  function pesquisar(event: FormEvent) {
    event.preventDefault();
    carregar();
  }

  function baixarCsv() {
    const colunas = troca
      ? [
          "Status",
          "Preenchido em",
          "Solicitante",
          "Matrícula solicitante",
          "Plantão solicitante",
          "Solicitado",
          "Matrícula solicitado",
          "Plantão solicitado",
          "Função solicitante",
          "Função solicitado",
          "Protocolo",
        ]
      : [
          "Status",
          "Preenchido em",
          "Solicitante",
          "Matrícula solicitante",
          "Plantão",
          "Substituto",
          "Matrícula substituto",
          "Função solicitante",
          "Função substituto",
          "Protocolo",
        ];
    const linhas = registros.map((item) =>
      troca
        ? [
            item.status,
            formatarDataHora(item.criado_em),
            item.nome_solicitante,
            item.matricula_solicitante,
            `${formatarData(item.data_plantao_solicitante)} | ${item.tipo_plantao_solicitante}`,
            item.nome_solicitado,
            item.matricula_solicitado,
            `${formatarData(item.data_plantao_solicitado)} | ${item.tipo_plantao_solicitado}`,
            item.funcao_solicitante,
            item.funcao_solicitado,
            item.protocolo,
          ]
        : [
            item.status,
            formatarDataHora(item.criado_em),
            item.nome_solicitante,
            item.matricula_solicitante,
            `${formatarData(item.data_plantao)} | ${item.tipo_plantao}`,
            item.nome_substituto,
            item.matricula_substituto,
            item.funcao_solicitante,
            item.funcao_substituto,
            item.protocolo,
          ],
    );
    const csv = [colunas, ...linhas]
      .map((linha) => linha.map(escaparCsv).join(";"))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${troca ? "trocas" : "substituicoes"}-medicas.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const badge = (situacao: Registro["status"]) =>
    `inline-flex min-w-[92px] justify-center rounded-full border px-3 py-1 text-xs font-bold ${
      situacao === "cancelado"
        ? temaDia
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-red-300/20 bg-red-400/10 text-red-100"
        : temaDia
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
    }`;

  return (
    <main className="voxx-page min-h-screen px-8 py-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Memorandos · Área Médica
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          {titulo}
        </h1>
        <p className="voxx-text-muted relative mt-2 text-sm">
          Acompanhamento dos formulários preenchidos pelos médicos.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Total filtrado", total],
          ["Recebidos", resumo.recebidos],
          ["Cancelados", resumo.cancelados],
        ].map(([rotulo, valor]) => (
          <div
            key={String(rotulo)}
            className="voxx-surface voxx-dashboard-metric relative overflow-hidden rounded-[28px] p-5"
          >
            <span className="absolute inset-y-0 left-0 w-1.5 bg-[var(--voxx-primary)]" />
            <p className="voxx-text-muted text-xs font-bold uppercase tracking-[0.16em]">
              {rotulo}
            </p>
            <p className="voxx-text-primary mt-3 text-3xl font-bold">{valor}</p>
          </div>
        ))}
      </section>

      <section className="voxx-surface mt-6 rounded-[28px]">
        <div className="border-b border-[var(--voxx-border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="voxx-text-primary text-lg font-semibold">
                Registros preenchidos
              </h2>
              <p className="voxx-text-muted mt-1 text-xs">
                Pesquise por protocolo, nome ou matrícula.
              </p>
            </div>
            <form
              onSubmit={pesquisar}
              className="flex w-full flex-wrap justify-end gap-2 xl:w-auto"
            >
              <input
                type="month"
                value={competencia}
                onChange={(evento) => setCompetencia(evento.target.value)}
                className="voxx-field h-10 rounded-xl px-3 text-sm"
                aria-label="Competência"
              />
              <select
                value={status}
                onChange={(evento) => setStatus(evento.target.value)}
                className="voxx-field h-10 rounded-xl px-3 text-sm"
                aria-label="Status"
              >
                <option value="">Todos os status</option>
                <option value="recebido">Recebidos</option>
                <option value="cancelado">Cancelados</option>
              </select>
              <div className="relative w-full sm:w-72">
                <input
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Nome, protocolo ou matrícula..."
                  className="voxx-field h-10 w-full rounded-xl px-3 pr-10 text-sm"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa"
                    className="voxx-text-primary absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--voxx-surface-soft)] text-2xl font-semibold leading-none shadow-sm transition hover:bg-[var(--voxx-focus)] hover:text-[var(--voxx-primary)]"
                  >
                    ×
                  </button>
                )}
              </div>
              <button className="voxx-button-primary h-10 rounded-xl px-4 text-sm font-semibold">
                Buscar
              </button>
              <button
                type="button"
                onClick={baixarCsv}
                disabled={!registros.length}
                className="voxx-export-button"
                title="Baixar Excel"
                aria-label="Baixar Excel"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M14 3v5h5M9 11l6 6M15 11l-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {carregando && (
          <p className="voxx-text-muted p-5 text-sm">Carregando registros...</p>
        )}
        {erro && (
          <p className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </p>
        )}
        {!carregando && !erro && !registros.length && (
          <p className="voxx-text-muted p-8 text-center text-sm">
            Nenhum registro encontrado.
          </p>
        )}
        {!carregando && !erro && registros.length > 0 && (
          <div className="voxx-scrollbar overflow-x-auto">
            <table
              className={`w-full text-center text-sm ${troca ? "min-w-[1450px]" : "min-w-[1250px]"}`}
            >
              <thead className="voxx-text-muted bg-[var(--voxx-surface-soft)] text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Preenchido em</th>
                  {troca ? (
                    <>
                      <th className="px-4 py-3">Solicitante</th>
                      <th className="px-4 py-3">Função solicitante</th>
                      <th className="px-4 py-3">Plantão solicitante</th>
                      <th className="px-4 py-3">Solicitado</th>
                      <th className="px-4 py-3">Função solicitado</th>
                      <th className="px-4 py-3">Plantão solicitado</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Solicitante</th>
                      <th className="px-4 py-3">Função solicitante</th>
                      <th className="px-4 py-3">Plantão</th>
                      <th className="px-4 py-3">Substituto</th>
                      <th className="px-4 py-3">Função substituto</th>
                    </>
                  )}
                  <th className="px-4 py-3">Protocolo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--voxx-border)]">
                {registros.map((item) => (
                  <tr
                    key={item.id}
                    className="voxx-text-muted transition hover:bg-[var(--voxx-surface-soft)]"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={badge(item.status)}>
                        {item.status === "cancelado" ? "Cancelado" : "Recebido"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatarDataHora(item.criado_em)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="voxx-text-primary font-semibold">
                        {item.nome_solicitante}
                      </p>
                      <p className="mt-1 text-xs">
                        {item.matricula_solicitante}
                      </p>
                    </td>
                    <td className="px-4 py-3">{item.funcao_solicitante}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatarData(
                        troca
                          ? item.data_plantao_solicitante
                          : item.data_plantao,
                      )}{" "}
                      |{" "}
                      {troca
                        ? item.tipo_plantao_solicitante
                        : item.tipo_plantao}
                    </td>
                    {troca ? (
                      <>
                        <td className="px-4 py-3">
                          <p className="voxx-text-primary font-semibold">
                            {item.nome_solicitado}
                          </p>
                          <p className="mt-1 text-xs">
                            {item.matricula_solicitado}
                          </p>
                        </td>
                        <td className="px-4 py-3">{item.funcao_solicitado}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatarData(item.data_plantao_solicitado)} |{" "}
                          {item.tipo_plantao_solicitado}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="voxx-text-primary font-semibold">
                            {item.nome_substituto}
                          </p>
                          <p className="mt-1 text-xs">
                            {item.matricula_substituto}
                          </p>
                        </td>
                        <td className="px-4 py-3">{item.funcao_substituto}</td>
                      </>
                    )}
                    <td className="voxx-text-primary whitespace-nowrap px-4 py-3 font-semibold">
                      {item.protocolo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
