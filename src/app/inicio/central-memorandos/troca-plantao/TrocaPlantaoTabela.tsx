"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";
import { TrocaPlantaoModal } from "../TrocaPlantaoModal";

type TrocaPlantao = {
  id: string;
  protocolo: string;
  mes_referencia?: string | null;
  nome_solicitante: string;
  matricula_solicitante: string;
  data_plantao_solicitante: string;
  tipo_plantao_solicitante: string;
  email_solicitante?: string | null;
  nome_solicitado: string;
  matricula_solicitado: string;
  data_plantao_solicitado: string;
  tipo_plantao_solicitado: string;
  funcao_solicitante: string;
  funcao_solicitado?: string | null;
  status: string;
  criado_por_nome: string;
  recebido_em: string;
  alterado_em?: string | null;
  cancelado_em?: string | null;
  alterado_por_nome?: string | null;
  cancelado_por_nome?: string | null;
  observacao_alteracao?: string | null;
  observacao_cancelamento?: string | null;
};

function labelTipoPlantao(tipo?: string | null) {
  return tipo === "24 horas" ? "24" : tipo || "-";
}

function formatarData(data?: string | null) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  return data;
}

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return data;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelStatus(status: string) {
  const normalizado = status?.toLowerCase();
  if (normalizado === "cancelado") return "Cancelado";
  if (normalizado === "alterado") return "Alterado";
  return "Recebido";
}

function csvEscape(valor: unknown) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

export default function TrocaPlantaoTabela() {
  const { temaDia } = useTema();
  const [registros, setRegistros] = useState<TrocaPlantao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [total, setTotal] = useState(0);
  const [registroEdicao, setRegistroEdicao] = useState<TrocaPlantao | null>(
    null,
  );
  const [registroCancelamento, setRegistroCancelamento] =
    useState<TrocaPlantao | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const resumo = useMemo(() => {
    return registros.reduce(
      (acc, item) => {
        const atual = item.status?.toLowerCase();
        acc.total += 1;
        if (atual === "alterado") acc.alterados += 1;
        else if (atual === "cancelado") acc.cancelados += 1;
        else acc.recebidos += 1;
        return acc;
      },
      { total: 0, recebidos: 0, alterados: 0, cancelados: 0 },
    );
  }, [registros]);

  async function carregarRegistros() {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      if (busca.trim()) params.set("busca", busca.trim());
      if (status) params.set("status", status);
      if (competencia) params.set("competencia", competencia);

      const resposta = await fetch(
        `/api/central-memorandos/troca-plantao?${params.toString()}`,
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Nao foi possivel carregar a tabela.");
      }

      setRegistros(dados.registros || []);
      setTotal(dados.total || 0);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a tabela.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      carregarRegistros();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [busca, status, competencia]);

  function pesquisar(event: FormEvent) {
    event.preventDefault();
    carregarRegistros();
  }

  async function baixarComprovante(item: TrocaPlantao) {
    try {
      setErro("");
      const resposta = await fetch(
        `/api/central-memorandos/troca-plantao?comprovante=${encodeURIComponent(item.id)}`,
      );
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.error || "Não foi possível gerar o comprovante.");
      }
      const url = URL.createObjectURL(await resposta.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `comprovante-${item.protocolo.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o comprovante.",
      );
    }
  }

  async function confirmarCancelamento() {
    if (!registroCancelamento) return;
    try {
      setCancelando(true);
      setErro("");

      const resposta = await fetch("/api/central-memorandos/troca-plantao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: registroCancelamento.id,
          status: "cancelado",
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Nao foi possivel cancelar a troca.");
      }

      await carregarRegistros();
      setRegistroCancelamento(null);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar a troca.",
      );
    } finally {
      setCancelando(false);
    }
  }

  function baixarCsv() {
    const colunas = [
      "Status",
      "Recebido em",
      "Solicitante",
      "Matricula solicitante",
      "Plantao solicitante",
      "Solicitado",
      "Matricula solicitado",
      "Plantao solicitado",
      "Funcao",
      "Criado por",
      "Protocolo",
    ];

    const linhas = registros.map((item) => [
      labelStatus(item.status),
      formatarDataHora(item.recebido_em),
      item.nome_solicitante,
      item.matricula_solicitante,
      `${formatarData(item.data_plantao_solicitante)} ${labelTipoPlantao(item.tipo_plantao_solicitante)}`,
      item.nome_solicitado,
      item.matricula_solicitado,
      `${formatarData(item.data_plantao_solicitado)} ${labelTipoPlantao(item.tipo_plantao_solicitado)}`,
      item.funcao_solicitante,
      item.criado_por_nome,
      item.protocolo,
    ]);

    const csv = [colunas, ...linhas]
      .map((linha) => linha.map(csvEscape).join(";"))
      .join("\n");

    const blob = new Blob([`\ufeff${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trocas-plantao.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function badgeStatus(statusAtual: string) {
    const normalizado = statusAtual?.toLowerCase();
    const base =
      "inline-flex min-w-[92px] justify-center rounded-full px-3 py-1 text-xs font-bold";
    if (normalizado === "cancelado") {
      return `${base} ${
        temaDia
          ? "border border-red-200 bg-red-50 text-red-700"
          : "border border-red-300/20 bg-red-400/10 text-red-100"
      }`;
    }
    if (normalizado === "alterado") {
      return `${base} ${
        temaDia
          ? "border border-amber-200 bg-amber-50 text-amber-700"
          : "border border-amber-300/20 bg-amber-400/10 text-amber-100"
      }`;
    }
    return `${base} ${
      temaDia
        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
    }`;
  }

  const pageClass = "voxx-page min-h-screen px-8 py-8";
  const cardClass = "voxx-surface rounded-[28px]";
  const inputClass = "voxx-field h-10 rounded-xl px-3 text-sm";
  const mutedText = "voxx-text-muted";
  const strongText = "voxx-text-primary";

  return (
    <main className={pageClass}>
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Memorandos
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          Troca de plantao
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Controle dos memorandos eletronicos de troca de plantao recebidos.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ["Total filtrado", total],
          ["Recebidos", resumo.recebidos],
          ["Alterados", resumo.alterados],
          ["Cancelados", resumo.cancelados],
        ].map(([titulo, valor]) => (
          <div
            key={String(titulo)}
            className={`${cardClass} voxx-dashboard-metric relative overflow-hidden p-5`}
          >
            <span className="absolute inset-y-0 left-0 w-1.5 bg-[var(--voxx-primary)]" />
            <p
              className={`text-xs font-bold uppercase tracking-[0.16em] ${mutedText}`}
            >
              {titulo}
            </p>
            <p
              className={`mt-3 text-3xl font-bold tracking-tight ${strongText}`}
            >
              {valor}
            </p>
          </div>
        ))}
      </section>

      <section className={`mt-6 ${cardClass}`}>
        <div className="border-b border-[var(--voxx-border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className={`text-lg font-semibold ${strongText}`}>
                Registros recebidos
              </h2>
              <p className={`mt-1 text-xs ${mutedText}`}>
                Use os filtros para localizar por nome, protocolo ou matricula.
              </p>
            </div>

            <form
              onSubmit={pesquisar}
              className="flex w-full flex-col items-end gap-2 lg:w-auto"
            >
              <div className="flex w-full flex-wrap justify-end gap-2">
                <input
                  type="month"
                  value={competencia}
                  onChange={(event) => setCompetencia(event.target.value)}
                  className={`${inputClass} w-full sm:w-auto`}
                  aria-label="Competência"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={`${inputClass} w-full sm:w-auto`}
                  aria-label="Status"
                >
                  <option value="">Todos os status</option>
                  <option value="recebido">Recebidos</option>
                  <option value="alterado">Alterados</option>
                  <option value="cancelado">Cancelados</option>
                </select>
                <div className="relative w-full lg:w-96">
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Pesquisar nome, protocolo ou matricula..."
                    className={`${inputClass} w-full pr-10`}
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
                <button
                  type="submit"
                  className="voxx-button-primary h-10 rounded-xl px-4 text-sm font-semibold"
                >
                  Buscar
                </button>
              </div>

              <button
                type="button"
                onClick={baixarCsv}
                disabled={registros.length === 0}
                title="Baixar Excel"
                aria-label="Baixar Excel"
                className="voxx-export-button"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 3v5h5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 16l2.2-3-2.1-3h1.8l1.2 1.9L12.9 10h1.7l-2.1 3 2.2 3h-1.8l-1.3-2-1.3 2H8.5Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {carregando && (
          <div className={`p-5 text-sm ${mutedText}`}>
            Carregando registros...
          </div>
        )}

        {erro && (
          <div
            className={
              temaDia
                ? "m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                : "m-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100"
            }
          >
            {erro}
          </div>
        )}

        {!carregando && !erro && registros.length === 0 && (
          <div className={`p-8 text-center text-sm ${mutedText}`}>
            Nenhuma troca de plantao encontrada para os filtros atuais.
          </div>
        )}

        {!carregando && !erro && registros.length > 0 && (
          <div className="voxx-scrollbar overflow-x-auto">
            <table className="w-full min-w-[1450px] text-center text-sm">
              <thead className="voxx-text-muted bg-[var(--voxx-surface-soft)] text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acoes</th>
                  <th className="px-4 py-3">Recebido em</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Plantao solicitante</th>
                  <th className="px-4 py-3">Solicitado</th>
                  <th className="px-4 py-3">Plantao solicitado</th>
                  <th className="px-4 py-3">Funcao</th>
                  <th className="px-4 py-3">Criado por</th>
                  <th className="px-4 py-3">Protocolo</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--voxx-border)]">
                {registros.map((item) => {
                  const statusAtual = item.status?.toLowerCase();
                  const podeAlterar = statusAtual === "recebido";

                  return (
                    <tr
                      key={item.id}
                      className="voxx-text-muted transition hover:bg-[var(--voxx-surface-soft)]"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={badgeStatus(item.status)}>
                          {labelStatus(item.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => baixarComprovante(item)}
                            className={
                              temaDia
                                ? "rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                                : "rounded-lg border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs font-bold text-sky-100 transition hover:bg-sky-400/15"
                            }
                          >
                            PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegistroEdicao(item)}
                            disabled={!podeAlterar}
                            className={
                              temaDia
                                ? "rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                                : "rounded-lg border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                            }
                          >
                            Alterar
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegistroCancelamento(item)}
                            disabled={!podeAlterar}
                            className={
                              temaDia
                                ? "rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                : "rounded-lg border border-red-300/20 bg-red-400/10 px-2.5 py-1 text-xs font-bold text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                            }
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatarDataHora(item.recebido_em)}
                      </td>

                      <td className="px-4 py-3">
                        <div className={`font-semibold ${strongText}`}>
                          {item.nome_solicitante}
                        </div>
                        <div className={`text-xs ${mutedText}`}>
                          {item.matricula_solicitante}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatarData(item.data_plantao_solicitante)} |{" "}
                        {labelTipoPlantao(item.tipo_plantao_solicitante)}
                      </td>

                      <td className="px-4 py-3">
                        <div className={`font-semibold ${strongText}`}>
                          {item.nome_solicitado}
                        </div>
                        <div className={`text-xs ${mutedText}`}>
                          {item.matricula_solicitado}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatarData(item.data_plantao_solicitado)} |{" "}
                        {labelTipoPlantao(item.tipo_plantao_solicitado)}
                      </td>

                      <td className="px-4 py-3">{item.funcao_solicitante}</td>
                      <td className="px-4 py-3">
                        {item.criado_por_nome || "-"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 font-semibold ${strongText}`}
                      >
                        {item.protocolo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {registroEdicao && (
        <TrocaPlantaoModal
          modo="editar"
          registro={registroEdicao}
          onClose={() => setRegistroEdicao(null)}
          onSaved={async () => {
            await carregarRegistros();
            setRegistroEdicao(null);
          }}
        />
      )}

      {registroCancelamento && (
        <div
          className={
            temaDia
              ? "fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
              : "fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          }
          onMouseDown={() => {
            if (!cancelando) setRegistroCancelamento(null);
          }}
        >
          <div
            className={
              temaDia
                ? "w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
                : "w-full max-w-md rounded-[28px] border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
            }
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              className={
                temaDia
                  ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-700"
                  : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-xl font-bold text-red-100"
              }
            >
              !
            </div>
            <h3 className={`mt-4 text-center text-xl font-bold ${strongText}`}>
              Cancelar troca de plantao?
            </h3>
            <p className={`mt-2 text-center text-sm leading-6 ${mutedText}`}>
              Tem certeza que deseja cancelar o protocolo{" "}
              <span className={strongText}>
                {registroCancelamento.protocolo}
              </span>
              ?
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={cancelando}
                onClick={() => setRegistroCancelamento(null)}
                className={
                  temaDia
                    ? "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    : "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                }
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelando}
                onClick={confirmarCancelamento}
                className={
                  temaDia
                    ? "rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                    : "rounded-xl bg-red-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-red-300 disabled:opacity-50"
                }
              >
                {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
