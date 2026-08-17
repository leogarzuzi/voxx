"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";
import { BancoHorasModal } from "../BancoHorasModal";

type BancoHoras = {
  id: string;
  protocolo: string;
  status: string;
  recebido_em: string;
  matricula: string;
  nome: string;
  funcao: string;
  email?: string | null;
  data_plantao_original: string;
  tipo_plantao_original: string;
  data_novo_plantao: string;
  tipo_novo_plantao: string;
  criado_por_nome?: string | null;
  cancelado_em?: string | null;
  cancelado_por_nome?: string | null;
};

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
  if (status?.toLowerCase() === "cancelado") return "Cancelado";
  return "Recebido";
}

function labelTipoPlantao(tipo?: string | null) {
  return tipo === "24 horas" ? "24" : tipo || "-";
}

function csvEscape(valor: unknown) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

export default function BancoHorasTabela() {
  const { temaDia } = useTema();
  const [registros, setRegistros] = useState<BancoHoras[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [total, setTotal] = useState(0);
  const [registroCancelamento, setRegistroCancelamento] = useState<BancoHoras | null>(null);
    const [registroEdicao, setRegistroEdicao] = useState<BancoHoras | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const resumo = useMemo(() => {
    return registros.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status?.toLowerCase() === "cancelado") acc.cancelados += 1;
        else acc.recebidos += 1;
        return acc;
      },
      { total: 0, recebidos: 0, cancelados: 0 }
    );
  }, [registros]);

  async function carregarRegistros() {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      if (busca.trim()) params.set("busca", busca.trim());

      const resposta = await fetch(`/api/central-memorandos/banco-horas?${params.toString()}`);
      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Não foi possível carregar a tabela.");
      }

      setRegistros(dados.registros || []);
      setTotal(dados.total || 0);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar a tabela.");
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
  }, [busca]);

  function pesquisar(event: FormEvent) {
    event.preventDefault();
    carregarRegistros();
  }

  async function confirmarCancelamento() {
    if (!registroCancelamento) return;

    try {
      setCancelando(true);
      setErro("");

      const resposta = await fetch("/api/central-memorandos/banco-horas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registroCancelamento.id, status: "cancelado" }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Não foi possível cancelar a solicitação.");
      }

      await carregarRegistros();
      setRegistroCancelamento(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível cancelar a solicitação.");
    } finally {
      setCancelando(false);
    }
  }

  function baixarCsv() {
    const colunas = [
      "Status",
      "Recebido em",
      "Nome",
      "Matrícula",
      "Função",
      "Plantão original",
      "Novo plantão",
      "E-mail",
      "Criado por",
      "Protocolo",
    ];

    const linhas = registros.map((item) => [
      labelStatus(item.status),
      formatarDataHora(item.recebido_em),
      item.nome,
      item.matricula,
      item.funcao,
      `${formatarData(item.data_plantao_original)} ${labelTipoPlantao(item.tipo_plantao_original)}`,
      `${formatarData(item.data_novo_plantao)} ${labelTipoPlantao(item.tipo_novo_plantao)}`,
      item.email || "-",
      item.criado_por_nome || "-",
      item.protocolo,
    ]);

    const csv = [colunas, ...linhas]
      .map((linha) => linha.map(csvEscape).join(";"))
      .join("\n");

    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "banco-horas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function badgeStatus(statusAtual: string) {
    const base = "inline-flex min-w-[92px] justify-center rounded-full px-3 py-1 text-xs font-bold";
    if (statusAtual?.toLowerCase() === "cancelado") {
      return `${base} ${
        temaDia
          ? "border border-red-200 bg-red-50 text-red-700"
          : "border border-red-300/20 bg-red-400/10 text-red-100"
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
          Banco de horas
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Controle das solicitações de compensação entre plantão original e novo plantão.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["Total filtrado", total],
          ["Recebidos", resumo.recebidos],
          ["Cancelados", resumo.cancelados],
        ].map(([titulo, valor]) => (
          <div key={String(titulo)} className={`${cardClass} voxx-dashboard-metric relative overflow-hidden p-5`}>
            <span className="absolute inset-y-0 left-0 w-1.5 bg-[var(--voxx-primary)]" />
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${mutedText}`}>{titulo}</p>
            <p className={`mt-3 text-3xl font-bold tracking-tight ${strongText}`}>{valor}</p>
          </div>
        ))}
      </section>

      <section className={`mt-6 ${cardClass}`}>
        <div className="border-b border-[var(--voxx-border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className={`text-lg font-semibold ${strongText}`}>Registros recebidos</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>Pesquise por nome, matrícula, função ou protocolo.</p>
            </div>

            <form onSubmit={pesquisar} className="flex w-full flex-col items-end gap-2 lg:w-auto">
              <div className="flex w-full flex-wrap justify-end gap-2">
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Pesquisar nome, matrícula ou protocolo..."
                  className={`${inputClass} w-full lg:w-96`}
                />
                <button
                  type="submit"
                  className="voxx-button-primary h-10 rounded-xl px-4 text-sm font-semibold"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="voxx-button-secondary h-10 rounded-xl px-4 text-sm font-semibold"
                >
                  Limpar
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M8.5 16l2.2-3-2.1-3h1.8l1.2 1.9L12.9 10h1.7l-2.1 3 2.2 3h-1.8l-1.3-2-1.3 2H8.5Z" fill="currentColor" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {carregando && <div className={`p-5 text-sm ${mutedText}`}>Carregando registros...</div>}

        {erro && (
          <div className={temaDia ? "m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" : "m-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100"}>
            {erro}
          </div>
        )}

        {!carregando && !erro && registros.length === 0 && (
          <div className={`p-8 text-center text-sm ${mutedText}`}>Nenhuma solicitação de banco de horas encontrada.</div>
        )}

        {!carregando && !erro && registros.length > 0 && (
          <div className="voxx-scrollbar overflow-x-auto">
            <table className="w-full min-w-[1250px] text-center text-sm">
              <thead className="voxx-text-muted bg-[var(--voxx-surface-soft)] text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                  <th className="px-4 py-3">Recebido em</th>
                  <th className="px-4 py-3">Nome e matrícula</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Plantão original</th>
                  <th className="px-4 py-3">Novo plantão</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Criado por</th>
                  <th className="px-4 py-3">Protocolo</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--voxx-border)]">
                {registros.map((item) => {
                  const podeAlterar = item.status?.toLowerCase() === "recebido";
                  const podeCancelar = item.status?.toLowerCase() === "recebido";

                  return (
                    <tr key={item.id} className="voxx-text-muted transition hover:bg-[var(--voxx-surface-soft)]">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={badgeStatus(item.status)}>{labelStatus(item.status)}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRegistroEdicao(item)}
                            disabled={!podeAlterar}
                            className={temaDia ? "rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40" : "rounded-lg border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-40"}
                          >
                            Alterar
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegistroCancelamento(item)}
                            disabled={!podeCancelar}
                            className={temaDia ? "rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40" : "rounded-lg border border-red-300/20 bg-red-400/10 px-2.5 py-1 text-xs font-bold text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40"}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{formatarDataHora(item.recebido_em)}</td>
                      <td className="px-4 py-3">
                        <div className={`font-semibold ${strongText}`}>{item.nome}</div>
                        <div className={`text-xs ${mutedText}`}>{item.matricula}</div>
                      </td>
                      <td className="px-4 py-3">{item.funcao}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatarData(item.data_plantao_original)} | {labelTipoPlantao(item.tipo_plantao_original)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatarData(item.data_novo_plantao)} | {labelTipoPlantao(item.tipo_novo_plantao)}</td>
                      <td className="px-4 py-3">{item.email || "-"}</td>
                      <td className="px-4 py-3">{item.criado_por_nome || "-"}</td>
                      <td className={`whitespace-nowrap px-4 py-3 font-semibold ${strongText}`}>{item.protocolo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>


      {registroEdicao && (
        <BancoHorasModal
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
        <div className={temaDia ? "fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm" : "fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"} onMouseDown={() => !cancelando && setRegistroCancelamento(null)}>
          <div className={temaDia ? "w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.18)]" : "w-full max-w-md rounded-[28px] border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.55)]"} onMouseDown={(event) => event.stopPropagation()}>
            <div className={temaDia ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-700" : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-xl font-bold text-red-100"}>!</div>
            <h3 className={`mt-4 text-center text-xl font-bold ${strongText}`}>Cancelar banco de horas?</h3>
            <p className={`mt-2 text-center text-sm leading-6 ${mutedText}`}>
              Tem certeza que deseja cancelar o protocolo <span className={strongText}>{registroCancelamento.protocolo}</span>?
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => setRegistroCancelamento(null)} disabled={cancelando} className={temaDia ? "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" : "rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"}>
                Voltar
              </button>
              <button type="button" onClick={confirmarCancelamento} disabled={cancelando} className={temaDia ? "rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50" : "rounded-xl bg-red-400/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"}>
                {cancelando ? "Cancelando..." : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}






