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

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando perfil...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Não foi possível carregar o perfil.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-800">Meu perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas informações de exibição no VOXX.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-5xl">
              🐼
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-700">
              Avatar do perfil
            </p>

            <p className="mt-2 text-center text-xs text-gray-400">
              Em breve você poderá escolher um avatar personalizado.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
            >
              Alterar avatar
            </button>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  disabled
                  value={usuario.nome}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome de usuário
                </label>
                <input
                  value={nomeExibicao}
                  onChange={(e) => setNomeExibicao(e.target.value)}
                  placeholder="Ex: João Gustavo"
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Esse é o nome que aparecerá no menu do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    disabled
                    value={usuario.email}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil
                  </label>
                  <input
                    disabled
                    value={usuario.perfil}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membro desde
                </label>
                <input
                  disabled
                  value={formatarData(usuario.criado_em)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98] disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>

              {mensagem && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm text-center ${
                    mensagem.includes("sucesso")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-600 border border-red-200"
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