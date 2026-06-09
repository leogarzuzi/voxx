"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type ModoTela = "login" | "primeiro-acesso";

export default function LoginPage() {
  const router = useRouter();

  const [modoTela, setModoTela] = useState<ModoTela>("login");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // ícone mostrar/ocultar senha
function IconeOlho({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.1 4.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.4-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), // normaliza email
      password: senha,
    });

    setLoading(false);

    if (error) {
      setMensagem("E-mail ou senha inválidos.");
      return;
    }

    router.push("/inicio");
  }

    async function handleResetSenha() {
      if (!email) {
        setMensagem("Digite seu e-mail para redefinir a senha.");
        return;
      }

      setLoading(true);
      setMensagem("");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://voxx-beryl.vercel.app/definir-senha",
      });

      setLoading(false);

      if (error) {
        setMensagem("Erro ao enviar e-mail de redefinição. Verifique o e-mail informado.");
        return;
      }

      setMensagem("E-mail de redefinição enviado. Verifique sua caixa de entrada.");
    }

async function handlePrimeiroAcesso(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);
  setMensagem("");

  if (!nome || !email || !confirmarEmail) {
    setMensagem("Preencha todos os campos.");
    setLoading(false);
    return;
  }

  if (email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
    setMensagem("Os e-mails informados não coincidem.");
    setLoading(false);
    return;
  }

  const { error } = await supabase.from("solicitacoes_acesso").insert({
    nome,
    email: email.trim().toLowerCase(),
    status: "Pendente",
  });

  setLoading(false);

  if (error) {
    if (error.code === "23505") {
      setMensagem("Já existe uma solicitação para este e-mail.");
      return;
    }

    setMensagem(`Erro: ${error.message}`);
    console.log(error);
    return;
  }

  setNome("");
  setEmail("");
  setConfirmarEmail("");

  setMensagem("Solicitação enviada com sucesso. Aguarde a aprovação.");
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
                  E-mail: <span className="text-red-500">*</span>
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
                  Senha: <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <IconeOlho aberto={mostrarSenha} />
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
    Nome completo: <span className="text-red-500">*</span>
  </label>

  <input
    required
    type="text"
    placeholder="Digite seu nome completo"
    className="w-full h-11 px-4 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    value={nome}
    onChange={(e) => setNome(e.target.value)}
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail: <span className="text-red-500">*</span>
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
                Confirmar e-mail: <span className="text-red-500">*</span>
              </label>

              <input
                required
                type="email"
                placeholder="Digite novamente seu e-mail"
                className="w-full h-11 px-4 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={confirmarEmail}
                onChange={(e) => setConfirmarEmail(e.target.value)}
              />
            </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98] active:shadow-inner"
              >
                {loading ? "Enviando..." : "Solicitar acesso"}
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
              {modoTela === "login" ? "Solicitar acesso" : "Voltar"}
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