"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTema } from "@/contexts/TemaContext";

type Usuario = {
  id: string;
  nome: string;
  nome_exibicao: string | null;
  email: string;
  perfil: string;
  criado_em: string;
  avatar: string | null;
};

const avatares = Array.from(
  { length: 13 },
  (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`
);

function CampoPerfil({
  label,
  value,
  temaDia,
}: {
  label: string;
  value: string;
  temaDia: boolean;
}) {
  return (
    <div>
      <label
        className={
          temaDia
            ? "mb-1 block text-sm font-semibold text-slate-700"
            : "mb-1 block text-sm font-medium text-slate-300"
        }
      >
        {label}
      </label>
      <input
        disabled
        value={value}
        className={
          temaDia
            ? "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-600 outline-none"
            : "h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 text-slate-400 outline-none"
        }
      />
    </div>
  );
}

export default function PerfilPage() {
  const { temaDia } = useTema();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [avatarSelecionado, setAvatarSelecionado] = useState("avatar-01");

  useEffect(() => {
    async function carregarPerfil() {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email?.trim().toLowerCase();

      if (!email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, nome_exibicao, email, perfil, criado_em, avatar")
        .eq("email", email)
        .single<Usuario>();

      if (!error && data) {
        setUsuario(data);
        setNomeExibicao(data.nome_exibicao || data.nome.split(" ")[0]);
        setAvatarSelecionado(data.avatar || "avatar-01");
      }

      setLoading(false);
    }

    carregarPerfil();
  }, []);

  async function handleSalvar() {
    setMensagem("");

    if (!nomeExibicao.trim()) {
      setMensagem("Informe um nome de usuario.");
      return;
    }

    if (!usuario?.id) {
      setMensagem("Usuario nao encontrado.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("usuarios")
      .update({
        nome_exibicao: nomeExibicao.trim(),
        avatar: avatarSelecionado,
      })
      .eq("id", usuario.id);

    setSalvando(false);

    if (error) {
      setMensagem("Erro ao salvar alteracoes.");
      return;
    }

    setMensagem("Perfil atualizado com sucesso.");

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  if (loading) {
    return (
      <div
        className={
          temaDia
            ? "flex min-h-screen items-center justify-center bg-[#f4f6fb] text-slate-500"
            : "flex min-h-screen items-center justify-center bg-[#11141b] text-slate-400"
        }
      >
        Carregando perfil...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div
        className={
          temaDia
            ? "flex min-h-screen items-center justify-center bg-[#f4f6fb] text-red-600"
            : "flex min-h-screen items-center justify-center bg-[#11141b] text-red-200"
        }
      >
        Nao foi possivel carregar o perfil.
      </div>
    );
  }

  return (
    <main
      className={
        temaDia
          ? "min-h-screen bg-[#f4f6fb] px-6 py-10 text-slate-950"
          : "min-h-screen bg-[#11141b] px-6 py-10 text-slate-100"
      }
    >
      <div className="mx-auto max-w-5xl">
        <section
          className={
            temaDia
              ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef3fb_58%,#e8edf6_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.1)]"
              : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
          }
        >
          <p
            className={
              temaDia
                ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500"
                : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"
            }
          >
            Conta
          </p>
          <h1
            className={
              temaDia
                ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950"
                : "mt-3 text-4xl font-semibold tracking-tight text-white"
            }
          >
            Meu perfil
          </h1>
          <p
            className={
              temaDia
                ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600"
                : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"
            }
          >
            Ajuste seu nome de exibicao e escolha o avatar que aparece no menu
            superior do sistema.
          </p>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <section
            className={
              temaDia
                ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
                : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
            }
          >
            <div className="flex flex-col items-center">
              <img
                src={`/avatars/${avatarSelecionado}.png`}
                alt="Avatar selecionado"
                className={
                  temaDia
                    ? "h-32 w-32 rounded-full border-4 border-white object-cover shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                    : "h-32 w-32 rounded-full border-4 border-white/10 object-cover shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
                }
              />

              <p
                className={
                  temaDia
                    ? "mt-4 text-sm font-semibold text-slate-950"
                    : "mt-4 text-sm font-semibold text-white"
                }
              >
                Avatar do perfil
              </p>

              <p
                className={
                  temaDia
                    ? "mt-2 text-center text-xs leading-5 text-slate-500"
                    : "mt-2 text-center text-xs leading-5 text-slate-400"
                }
              >
                Esse avatar aparece no card do usuario e ajuda a reconhecer sua
                sessao rapidamente.
              </p>
            </div>

            <div className="voxx-scrollbar mt-6 max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-3">
                {avatares.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setAvatarSelecionado(avatar)}
                    className={
                      avatarSelecionado === avatar
                        ? temaDia
                          ? "rounded-full border border-slate-950 bg-slate-100 p-1 shadow-[0_0_0_4px_rgba(15,23,42,0.08)] transition"
                          : "rounded-full border border-blue-300 bg-blue-300/10 p-1 shadow-[0_0_0_4px_rgba(96,165,250,0.08)] transition"
                        : temaDia
                          ? "rounded-full border border-slate-200 bg-slate-50 p-1 transition hover:border-slate-500"
                          : "rounded-full border border-white/10 bg-white/[0.04] p-1 transition hover:border-blue-300/50"
                    }
                  >
                    <img
                      src={`/avatars/${avatar}.png`}
                      alt={avatar}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className={
              temaDia
                ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
                : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
            }
          >
            <div className="space-y-5">
              <CampoPerfil label="Nome completo" value={usuario.nome} temaDia={temaDia} />

              <div>
                <label
                  className={
                    temaDia
                      ? "mb-1 block text-sm font-semibold text-slate-700"
                      : "mb-1 block text-sm font-medium text-slate-300"
                  }
                >
                  Nome de usuario
                </label>
                <input
                  value={nomeExibicao}
                  onChange={(e) => setNomeExibicao(e.target.value)}
                  placeholder="Ex: Joao Gustavo"
                  className={
                    temaDia
                      ? "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      : "h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
                  }
                />
                <p className={temaDia ? "mt-2 text-xs text-slate-500" : "mt-2 text-xs text-slate-500"}>
                  Esse e o nome que aparecera no menu do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <CampoPerfil label="E-mail" value={usuario.email} temaDia={temaDia} />
                <CampoPerfil label="Perfil" value={usuario.perfil} temaDia={temaDia} />
              </div>

              <CampoPerfil
                label="Membro desde"
                value={formatarData(usuario.criado_em)}
                temaDia={temaDia}
              />

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className={
                  temaDia
                    ? "h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_16px_34px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
                    : "h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
                }
              >
                {salvando ? "Salvando..." : "Salvar alteracoes"}
              </button>

              {mensagem && (
                <div
                  className={`rounded-xl border px-4 py-3 text-center text-sm ${
                    mensagem.includes("sucesso")
                      ? temaDia
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                      : temaDia
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-red-300/20 bg-red-400/10 text-red-100"
                  }`}
                >
                  {mensagem}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}