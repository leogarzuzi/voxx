"use client";

import { useEffect, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type Solicitacao = {
  id: number;
  nome: string;
  email: string;
  status: string;
  perfil?: string | null;
  criado_em: string;
};

function badgeStatus(status: string, temaDia: boolean) {
  if (status === "Pendente") {
    return temaDia
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-yellow-300/30 bg-yellow-300/12 text-yellow-200";
  }

  if (status === "Recusada") {
    return temaDia
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-red-300/30 bg-red-400/12 text-red-200";
  }

  return temaDia
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-emerald-300/30 bg-emerald-300/12 text-emerald-200";
}

export default function SolicitacoesPage() {
  const { temaDia } = useTema();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] =
    useState<number | null>(null);
  const [perfilSelecionado, setPerfilSelecionado] = useState("");
  const [perfisDisponiveis, setPerfisDisponiveis] = useState(["Admin", "Gerente"]);

  async function carregarSolicitacoes() {
    try {
      setLoading(true);

      const response = await fetch("/api/solicitacoes-acesso", { cache: "no-store" });
      const resultado = await response.json();

      if (!response.ok) {
        alert("Erro ao carregar solicitações.");
        return;
      }
      setSolicitacoes(resultado.solicitacoes || []);
      if (resultado.perfis?.length) setPerfisDisponiveis(resultado.perfis);
    } catch (erro) {
      console.error("Erro inesperado:", erro);
      alert("Erro inesperado ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }

  async function recusarSolicitacao(id: number) {
    const response = await fetch("/api/solicitacoes-acesso", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      alert("Erro ao recusar solicitação.");
      return;
    }

    carregarSolicitacoes();
  }

  async function aprovarSolicitacao() {
    if (!solicitacaoSelecionada || !perfilSelecionado) return;

    const response = await fetch("/api/aprovar-solicitacao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        solicitacaoId: solicitacaoSelecionada,
        perfil: perfilSelecionado,
      }),
    });

    const resultado = await response.json();

    alert(JSON.stringify(resultado));

    setSolicitacaoSelecionada(null);
    setPerfilSelecionado("");
    carregarSolicitacoes();
  }

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const totalSolicitacoes = solicitacoes.length;
  const pendentes = solicitacoes.filter(
    (item) => item.status === "Pendente"
  ).length;
  const aprovadas = solicitacoes.filter(
    (item) => item.status === "Aprovada"
  ).length;
  const recusadas = solicitacoes.filter(
    (item) => item.status === "Recusada"
  ).length;
  const solicitacaoEmAprovacao = solicitacoes.find(
    (item) => item.id === solicitacaoSelecionada
  );

  const metricas = [
    {
      label: "Total",
      value: totalSolicitacoes,
      tone: "border-[var(--voxx-primary)] bg-[var(--voxx-primary)] text-[var(--voxx-primary-contrast)]",
    },
    {
      label: "Pendentes",
      value: pendentes,
      tone: temaDia
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-yellow-300/30 bg-yellow-300/15 text-yellow-100",
    },
    {
      label: "Aprovadas",
      value: aprovadas,
      tone: temaDia
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
    },
    {
      label: "Recusadas",
      value: recusadas,
      tone: temaDia
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-red-300/30 bg-red-400/15 text-red-100",
    },
  ];

  return (
    <main className="voxx-solicitacoes voxx-page min-h-screen p-8 transition-colors">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
              Acessos do sistema
            </p>
            <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
              Solicitações de acesso
            </h1>
            <p className="voxx-text-muted mt-2 max-w-2xl text-sm">
              Analise novos pedidos, defina perfis e mantenha o acesso ao
              sistema sob controle.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarSolicitacoes}
            disabled={loading}
            className="voxx-button-primary w-fit rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {metricas.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] p-4 shadow-[var(--voxx-shadow-soft)]"
            >
              <p className="voxx-text-muted text-xs font-medium uppercase tracking-[0.2em]">
                {card.label}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="voxx-text-primary text-3xl font-semibold">
                  {card.value}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${card.tone}`}
                >
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="voxx-surface mt-6 overflow-hidden rounded-[26px]">
        <div
          className="flex items-center justify-between border-b border-[var(--voxx-border)] px-6 py-5"
        >
          <div>
            <h2 className="voxx-text-primary text-lg font-bold">
              Fila de solicitações
            </h2>
            <p className="voxx-text-muted mt-1 text-sm">
              Registros mais recentes aparecem primeiro.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {loading ? (
            <div className="voxx-text-muted rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-5 py-10 text-center text-sm">
              Carregando solicitações...
            </div>
          ) : solicitacoes.length === 0 ? (
            <div className="voxx-text-muted rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-5 py-10 text-center text-sm">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            solicitacoes.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] p-4 transition hover:border-[var(--voxx-border-strong)] hover:bg-[var(--voxx-surface-raised)] lg:grid-cols-[minmax(220px,1.4fr)_140px_130px_110px_170px]"
              >
                <div className="min-w-0">
                  <p className="voxx-text-primary truncate text-sm font-semibold">
                    {item.nome}
                  </p>
                  <p className="voxx-text-muted mt-1 break-all text-xs">
                    {item.email}
                  </p>
                </div>

                <div>
                  <p className="voxx-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeStatus(
                      item.status,
                      temaDia
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div>
                  <p className="voxx-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">
                    Perfil
                  </p>
                  <p className="voxx-text-primary mt-2 text-sm font-medium">
                    {item.perfil ? item.perfil : "-"}
                  </p>
                </div>

                <div>
                  <p className="voxx-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">
                    Data
                  </p>
                  <p className="voxx-text-muted mt-2 text-sm">
                    {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center justify-start gap-2 lg:justify-end">
                  {item.status === "Pendente" ? (
                    <>
                      <button
                        onClick={() => {
                          setSolicitacaoSelecionada(item.id);
                          setPerfilSelecionado("");
                        }}
                        className="voxx-button-primary rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        Aprovar
                      </button>

                      <button
                        onClick={() => recusarSolicitacao(item.id)}
                        className="rounded-xl border border-red-500/60 bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                      >
                        Recusar
                      </button>
                    </>
                  ) : (
                    <span
                      className="voxx-text-muted rounded-full border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-3 py-1 text-xs font-medium"
                    >
                      Finalizada
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {solicitacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--voxx-overlay)] px-4 backdrop-blur-[2px]">
          <div className="voxx-surface-raised w-full max-w-md rounded-3xl p-6">
            <div className="mb-5 rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--voxx-primary)]">
                Aprovação
              </p>
              <h2 className="voxx-text-primary mt-2 text-xl font-bold">
                Aprovar solicitação
              </h2>
              <p className="voxx-text-muted mt-1 text-sm">
                {solicitacaoEmAprovacao?.nome || "Escolha o perfil do usuário."}
              </p>
            </div>

            <div>
              <label className="voxx-text-primary mb-1 block text-sm font-semibold">
                Perfil
              </label>

              <select
                value={perfilSelecionado}
                onChange={(e) => setPerfilSelecionado(e.target.value)}
                className="voxx-field h-11 w-full rounded-2xl px-3"
              >
                <option value="">Selecione...</option>
                {perfisDisponiveis.map((perfil) => (
                  <option key={perfil} value={perfil}>{perfil}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSolicitacaoSelecionada(null);
                  setPerfilSelecionado("");
                }}
                className="voxx-button-secondary flex-1 rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={aprovarSolicitacao}
                disabled={!perfilSelecionado}
                className="voxx-button-primary flex-1 rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
