"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        disabled
        value={value}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 text-slate-400 outline-none"
      />
    </div>
  );
}

export default function PerfilPage() {
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
      setMensagem("Informe um nome de usuário.");
      return;
    }

    if (!usuario?.id) {
      setMensagem("Usuário não encontrado.");
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
      setMensagem("Erro ao salvar alterações.");
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
      <div className="flex min-h-screen items-center justify-center bg-[#11141b] text-slate-400">
        Carregando perfil...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#11141b] text-red-200">
        Não foi possível carregar o perfil.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#11141b] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
            Conta
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Meu perfil
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Ajuste seu nome de exibição e escolha o avatar que aparece no menu
            superior do sistema.
          </p>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <section className="rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col items-center">
              <img
                src={`/avatars/${avatarSelecionado}.png`}
                alt="Avatar selecionado"
                className="h-32 w-32 rounded-full border-4 border-white/10 object-cover shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
              />

              <p className="mt-4 text-sm font-semibold text-white">
                Avatar do perfil
              </p>

              <p className="mt-2 text-center text-xs leading-5 text-slate-400">
                Esse avatar aparece no card do usuário e ajuda a reconhecer sua
                sessão rapidamente.
              </p>
            </div>

            <div className="voxx-scrollbar mt-6 max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-3">
                {avatares.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setAvatarSelecionado(avatar)}
                    className={`rounded-full border p-1 transition ${
                      avatarSelecionado === avatar
                        ? "border-blue-300 bg-blue-300/10 shadow-[0_0_0_4px_rgba(96,165,250,0.08)]"
                        : "border-white/10 bg-white/[0.04] hover:border-blue-300/50"
                    }`}
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

          <section className="rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
            <div className="space-y-5">
              <CampoPerfil label="Nome completo" value={usuario.nome} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Nome de usuário
                </label>
                <input
                  value={nomeExibicao}
                  onChange={(e) => setNomeExibicao(e.target.value)}
                  placeholder="Ex: João Gustavo"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Esse é o nome que aparecerá no menu do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <CampoPerfil label="E-mail" value={usuario.email} />
                <CampoPerfil label="Perfil" value={usuario.perfil} />
              </div>

              <CampoPerfil
                label="Membro desde"
                value={formatarData(usuario.criado_em)}
              />

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>

              {mensagem && (
                <div
                  className={`rounded-xl border px-4 py-3 text-center text-sm ${
                    mensagem.includes("sucesso")
                      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
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
