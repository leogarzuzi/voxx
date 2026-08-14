"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

  async function carregarPerfis() {
    const { data } = await supabase
      .from("perfis_acesso")
      .select("nome")
      .eq("ativo", true)
      .order("protegido", { ascending: false })
      .order("nome");

    if (data?.length) setPerfisDisponiveis(data.map((perfil) => perfil.nome));
  }

  async function carregarSolicitacoes() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("solicitacoes_acesso")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar solicitações:", error);
        alert("Erro ao carregar solicitações.");
        return;
      }

      setSolicitacoes(data || []);
    } catch (erro) {
      console.error("Erro inesperado:", erro);
      alert("Erro inesperado ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }

  async function recusarSolicitacao(id: number) {
    const { error } = await supabase
      .from("solicitacoes_acesso")
      .update({ status: "Recusada" })
      .eq("id", id);

    if (error) {
      alert("Erro ao recusar solicitação.");
      console.error(error);
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
    carregarPerfis();
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
      tone: temaDia
        ? "border-slate-200 bg-slate-950 text-white"
        : "border-white/20 bg-white text-slate-950",
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
    <main
      className={
        temaDia
          ? "min-h-screen bg-[#f4f7fb] p-8 text-slate-900 transition-colors"
          : "min-h-screen bg-[#11141b] p-8 text-slate-100 transition-colors"
      }
    >
      <section
        className={
          temaDia
            ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#edf2f7_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
            : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.26),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        }
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className={
                temaDia
                  ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500"
                  : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"
              }
            >
              Acessos do sistema
            </p>
            <h1
              className={
                temaDia
                  ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950"
                  : "mt-3 text-4xl font-semibold tracking-tight text-white"
              }
            >
              Solicitações de acesso
            </h1>
            <p
              className={
                temaDia
                  ? "mt-2 max-w-2xl text-sm text-slate-600"
                  : "mt-2 max-w-2xl text-sm text-slate-300"
              }
            >
              Analise novos pedidos, defina perfis e mantenha o acesso ao
              sistema sob controle.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarSolicitacoes}
            disabled={loading}
            className={
              temaDia
                ? "w-fit rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                : "w-fit rounded-2xl border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {metricas.map((card) => (
            <div
              key={card.label}
              className={
                temaDia
                  ? "rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.07)]"
                  : "rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-white/5"
              }
            >
              <p
                className={
                  temaDia
                    ? "text-xs font-medium uppercase tracking-[0.2em] text-slate-500"
                    : "text-xs font-medium uppercase tracking-[0.2em] text-slate-500"
                }
              >
                {card.label}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span
                  className={
                    temaDia
                      ? "text-3xl font-semibold text-slate-950"
                      : "text-3xl font-semibold text-white"
                  }
                >
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

      <section
        className={
          temaDia
            ? "mt-6 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
            : "mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#171a23] shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
        }
      >
        <div
          className={
            temaDia
              ? "flex items-center justify-between border-b border-slate-200 px-6 py-5"
              : "flex items-center justify-between border-b border-white/10 px-6 py-5"
          }
        >
          <div>
            <h2
              className={
                temaDia ? "text-lg font-bold text-slate-950" : "text-lg font-bold text-white"
              }
            >
              Fila de solicitações
            </h2>
            <p
              className={
                temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"
              }
            >
              Registros mais recentes aparecem primeiro.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {loading ? (
            <div
              className={
                temaDia
                  ? "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500"
                  : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-slate-400"
              }
            >
              Carregando solicitações...
            </div>
          ) : solicitacoes.length === 0 ? (
            <div
              className={
                temaDia
                  ? "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500"
                  : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-slate-400"
              }
            >
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            solicitacoes.map((item) => (
              <article
                key={item.id}
                className={
                  temaDia
                    ? "grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 lg:grid-cols-[minmax(220px,1.4fr)_140px_130px_110px_170px]"
                    : "grid gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-white/20 hover:bg-white/[0.07] lg:grid-cols-[minmax(220px,1.4fr)_140px_130px_110px_170px]"
                }
              >
                <div className="min-w-0">
                  <p
                    className={
                      temaDia
                        ? "truncate text-sm font-semibold text-slate-950"
                        : "truncate text-sm font-semibold text-white"
                    }
                  >
                    {item.nome}
                  </p>
                  <p
                    className={
                      temaDia
                        ? "mt-1 break-all text-xs text-slate-500"
                        : "mt-1 break-all text-xs text-slate-400"
                    }
                  >
                    {item.email}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Perfil
                  </p>
                  <p
                    className={
                      temaDia
                        ? "mt-2 text-sm font-medium text-slate-700"
                        : "mt-2 text-sm font-medium text-slate-200"
                    }
                  >
                    {item.perfil ? item.perfil : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Data
                  </p>
                  <p
                    className={
                      temaDia ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-slate-300"
                    }
                  >
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
                        className={
                          temaDia
                            ? "rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                            : "rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200"
                        }
                      >
                        Aprovar
                      </button>

                      <button
                        onClick={() => recusarSolicitacao(item.id)}
                        className={
                          temaDia
                            ? "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            : "rounded-xl border border-red-300/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/20"
                        }
                      >
                        Recusar
                      </button>
                    </>
                  ) : (
                    <span
                      className={
                        temaDia
                          ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500"
                          : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400"
                      }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
          <div
            className={
              temaDia
                ? "w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
                : "w-full max-w-md rounded-3xl border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-2xl"
            }
          >
            <div
              className={
                temaDia
                  ? "mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  : "mb-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
              }
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Aprovação
              </p>
              <h2
                className={
                  temaDia ? "mt-2 text-xl font-bold text-slate-950" : "mt-2 text-xl font-bold text-white"
                }
              >
                Aprovar solicitação
              </h2>
              <p
                className={
                  temaDia ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-slate-300"
                }
              >
                {solicitacaoEmAprovacao?.nome || "Escolha o perfil do usuário."}
              </p>
            </div>

            <div>
              <label
                className={
                  temaDia
                    ? "mb-1 block text-sm font-semibold text-slate-700"
                    : "mb-1 block text-sm font-semibold text-slate-300"
                }
              >
                Perfil
              </label>

              <select
                value={perfilSelecionado}
                onChange={(e) => setPerfilSelecionado(e.target.value)}
                className={
                  temaDia
                    ? "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-slate-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-blue-300/10"
                }
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
                className={
                  temaDia
                    ? "flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    : "flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={aprovarSolicitacao}
                disabled={!perfilSelecionado}
                className={
                  temaDia
                    ? "flex-1 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    : "flex-1 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                }
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
