"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DefinirSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false); // mostra/oculta nova senha
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false); // mostra/oculta confirmação
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [mensagem, setMensagem] = useState("");

useEffect(() => {
  async function verificarSessao() {
    setMensagem("");

    // pega os parâmetros do link vindo do Supabase
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = url.searchParams;

    // se o próprio Supabase mandou erro no link, bloqueia direto
    const erroUrl = hashParams.get("error") || searchParams.get("error");

    if (erroUrl) {
      setMensagem(
        "Link inválido ou expirado. Solicite uma nova redefinição de senha."
      );
      setVerificando(false);
      return;
    }

    // formato 1: tokens no hash da URL
    const accessToken =
      hashParams.get("access_token") || searchParams.get("access_token");

    const refreshToken =
      hashParams.get("refresh_token") || searchParams.get("refresh_token");

    // formato 2: code na URL
    const code = searchParams.get("code");

    // formato 3: token_hash vindo de template customizado do Supabase
    const tokenHash =
      searchParams.get("token_hash") ||
      searchParams.get("token_hash".toUpperCase()) ||
      searchParams.get("token");

    // tipo do link: invite ou recovery
    const tipoLink =
      hashParams.get("type") ||
      searchParams.get("type") ||
      "recovery";

    let sessaoCriada = false;

    // CASO 1: link com access_token e refresh_token
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error) {
        sessaoCriada = true;
      }
    }

    // CASO 2: link com code
    if (!sessaoCriada && code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        sessaoCriada = true;
      }
    }

    // CASO 3: link com token_hash/token
    if (
      !sessaoCriada &&
      tokenHash &&
      (tipoLink === "recovery" || tipoLink === "invite")
    ) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: tipoLink as "recovery" | "invite",
      });

      if (!error) {
        sessaoCriada = true;
      }
    }

    // confere se existe sessão depois de tentar todos os formatos
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setMensagem(
        "Link inválido ou expirado. Solicite uma nova redefinição de senha."
      );
      setVerificando(false);
      return;
    }

    // aceita apenas convite e recuperação de senha
    if (tipoLink !== "invite" && tipoLink !== "recovery") {
      router.replace("/inicio");
      return;
    }

    // limpa token/code da URL depois de validar a sessão
    window.history.replaceState({}, document.title, "/definir-senha");

    setVerificando(false);
  }

  verificarSessao();
}, [router]);

  async function handleDefinirSenha(e: React.FormEvent) {
    e.preventDefault(); 
    
    setMensagem("");

    if (!senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    const temMinimo = senha.length >= 8; // mínimo de caracteres
    const temMaiuscula = /[A-Z]/.test(senha); // letra maiúscula
    const temNumero = /[0-9]/.test(senha); // número
    const temEspecial = /[^A-Za-z0-9]/.test(senha); // caractere especial

    if (!temMinimo || !temMaiuscula || !temNumero || !temEspecial) {
      setMensagem(
        "A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial."
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    setLoading(false);

    if (error) {
      setMensagem("Erro ao definir senha. Tente acessar o link novamente.");
      return;
    }

    setMensagem("Senha definida com sucesso.");

    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

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

  function RequisitoSenha({
    ok,
    texto,
  }: {
    ok: boolean;
    texto: string;
  }) {
    return (
      <div className={`text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
        {ok ? "✓" : "•"} {texto}
      </div>
    );
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <p className="text-sm text-gray-500">Verificando acesso...</p>
      </div>
    );
  }

  if (mensagem.includes("Link inválido")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-blue-100 text-center">
          <img
            src="/logo-voxx.png"
            alt="VOXX"
            className="w-40 h-40 object-contain mx-auto mb-2"
          />

          <p className="text-red-600 text-sm mb-5">{mensagem}</p>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98]"
          >
            Voltar para o login
          </button>

          <p className="mt-6 text-center text-xs text-gray-400">VOXX • v1.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-blue-100">
        <div className="flex flex-col items-center mb-7">
          <img
            src="/logo-voxx.png"
            alt="VOXX"
            className="w-40 h-40 object-contain mb-2"
          />

          <p className="text-gray-500 text-sm font-medium">
            Definir senha de acesso
          </p>

          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed">
            Crie uma nova senha para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleDefinirSenha} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha: <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                required
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua nova senha"
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

            <div className="mt-2 grid grid-cols-1 gap-1">
              <RequisitoSenha ok={senha.length >= 8} texto="Mínimo de 8 caracteres" />
              <RequisitoSenha ok={/[A-Z]/.test(senha)} texto="Uma letra maiúscula" />
              <RequisitoSenha ok={/[0-9]/.test(senha)} texto="Um número" />
              <RequisitoSenha ok={/[^A-Za-z0-9]/.test(senha)} texto="Um caractere especial" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha: <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                required
                type={mostrarConfirmarSenha ? "text" : "password"}
                placeholder="Digite novamente sua senha"
                className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <IconeOlho aberto={mostrarConfirmarSenha} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98] active:shadow-inner disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar senha"}
          </button>
        </form>

        {mensagem && (
          <div
            className={`mt-5 rounded-xl px-4 py-3 text-sm text-center ${
              mensagem.includes("sucesso")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {mensagem}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">VOXX • v1.0</p>
      </div>
    </div>
  );
}