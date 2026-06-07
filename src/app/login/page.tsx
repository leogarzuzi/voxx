"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type ModoTela = "login" | "primeiro-acesso";

export default function LoginPage() {
  const router = useRouter();

  const [modoTela, setModoTela] = useState<ModoTela>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      setMensagem("E-mail ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
  }

  async function handleResetSenha() {
    if (!email) {
      setMensagem("Digite seu e-mail para redefinir a senha.");
      return;
    }

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://voxx-beryl.vercel.app/login",
    });

    setLoading(false);

    if (error) {
      setMensagem("Erro ao enviar e-mail.");
      return;
    }

    setMensagem("E-mail de redefinição enviado.");
  }

  function handlePrimeiroAcesso(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !senha) {
      setMensagem("Preencha e-mail e senha para solicitar o primeiro acesso.");
      return;
    }

    setMensagem("Solicitação de primeiro acesso enviada para aprovação.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="pointer-events-none absolute -top-20 -left-28 z-0 opacity-[0.10]">
        <img
          src="/logo-simbolo.png"
          alt=""
          aria-hidden="true"
          className="w-[620px] max-w-none"
        />
      </div>

      <div className="pointer-events-none absolute bottom-8 right-10 z-0 opacity-[0.28]">
        <img
          src="/logo-riosaude.png"
          alt=""
          aria-hidden="true"
          className="w-[360px] max-w-[38vw]"
        />
      </div>

      <div className="relative z-10 w-full max-w-[430px]">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 border border-blue-100">
          <div className="flex flex-col items-center mb-7">
            <img
              src="/logo-voxx.png"
              alt="VOXX"
              className="w-48 h-48 object-contain mb-2"
            />

            <p className="text-gray-500 text-sm text-center font-medium">
              #CriandoConexões
            </p>
          </div>

          {modoTela === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="w-full h-11 px-4 pr-16 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-700 hover:underline"
                  >
                    {mostrarSenha ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98] active:shadow-inner disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePrimeiroAcesso} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criar senha <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Crie uma senha"
                    className="w-full h-11 px-4 pr-16 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-700 hover:underline"
                  >
                    {mostrarSenha ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98] active:shadow-inner"
              >
                Solicitar acesso
              </button>
            </form>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <button
              type="button"
              onClick={handleResetSenha}
              className="h-10 rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.97] active:shadow-inner"
            >
              Esqueci a senha
            </button>

            <button
              type="button"
              onClick={() => {
                setMensagem("");
                setModoTela(modoTela === "login" ? "primeiro-acesso" : "login");
              }}
              className="h-10 rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.97] active:shadow-inner"
            >
              {modoTela === "login" ? "Primeiro acesso" : "Voltar"}
            </button>
          </div>

          {mensagem && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm text-center ${
                mensagem.includes("enviad") || mensagem.includes("aprovação")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {mensagem}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">
            VOXX • v1.0
          </p>
        </div>
      </div>
    </div>
  );
}