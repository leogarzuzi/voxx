"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TemaToggle } from "@/components/TemaToggle";
import { useTema } from "@/contexts/TemaContext";

function IconeOlho({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.1 4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.4-.9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function RequisitoSenha({
  ok,
  texto,
  temaDia,
}: {
  ok: boolean;
  texto: string;
  temaDia: boolean;
}) {
  return (
    <div
      className={`text-xs ${
        ok
          ? temaDia
            ? "text-emerald-700"
            : "text-emerald-300"
          : temaDia
            ? "text-slate-500"
            : "text-slate-500"
      }`}
    >
      {texto}
    </div>
  );
}

function TelaBase({ children }: { children: React.ReactNode }) {
  const { tema, alternarTema } = useTema();

  return (
    <div
      className="voxx-auth-page px-4 py-10 pb-24"
    >
      <div className="voxx-auth-backdrop" />
      <div className="voxx-auth-glow-left" />
      <div className="voxx-auth-glow-right" />

      <div className="relative z-10 w-full max-w-[430px]">{children}</div>
      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />
    </div>
  );
}

function CardSenha({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="voxx-auth-card rounded-[30px] p-8"
    >
      {children}
    </div>
  );
}

function LogoTopo() {
  return (
    <div
      className="voxx-auth-logo"
    >
      <Image src="/logo-ronaldo-gazolla.png" alt="Hospital Municipal Ronaldo Gazolla" width={711} height={230} priority className="voxx-brand-image h-auto w-full object-contain" />
    </div>
  );
}

export default function DefinirSenhaPage() {
  const router = useRouter();
  const { temaDia } = useTema();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [tokenPendente, setTokenPendente] = useState<{
    tokenHash: string;
    tipo: "recovery" | "invite";
  } | null>(null);

  useEffect(() => {
    async function verificarSessao() {
      setMensagem("");

      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = url.searchParams;
      const erroUrl = hashParams.get("error") || searchParams.get("error");

      if (erroUrl) {
        setMensagem("Link invalido ou expirado. Solicite uma nova redefinicao de senha.");
        setVerificando(false);
        return;
      }

      const accessToken =
        hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken =
        hashParams.get("refresh_token") || searchParams.get("refresh_token");
      const code = searchParams.get("code");
      const tokenHash =
        searchParams.get("token_hash") ||
        searchParams.get("token_hash".toUpperCase()) ||
        searchParams.get("token");
      const tipoLink =
        hashParams.get("type") || searchParams.get("type") || "recovery";

      // Links com token_hash exigem uma acao explicita do usuario. Assim,
      // leitores de e-mail e verificadores automaticos nao consomem o link.
      if (
        tokenHash &&
        (tipoLink === "recovery" || tipoLink === "invite")
      ) {
        setTokenPendente({
          tokenHash,
          tipo: tipoLink as "recovery" | "invite",
        });
        setVerificando(false);
        return;
      }

      let sessaoCriada = false;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) sessaoCriada = true;
      }

      if (!sessaoCriada && code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) sessaoCriada = true;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setMensagem("Link invalido ou expirado. Solicite uma nova redefinicao de senha.");
        setVerificando(false);
        return;
      }

      if (tipoLink !== "invite" && tipoLink !== "recovery") {
        router.replace("/inicio");
        return;
      }

      window.history.replaceState({}, document.title, "/definir-senha");
      setVerificando(false);
    }

    verificarSessao();
  }, [router]);

  async function handleConfirmarLink() {
    if (!tokenPendente) return;

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenPendente.tokenHash,
      type: tokenPendente.tipo,
    });

    setLoading(false);

    if (error) {
      console.error("Falha ao validar link de redefinicao:", error);
      setTokenPendente(null);
      setMensagem("Link invalido ou expirado. Solicite uma nova redefinicao de senha.");
      return;
    }

    window.history.replaceState({}, document.title, "/definir-senha");
    setTokenPendente(null);
  }

  async function handleDefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");

    if (!senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas nao coincidem.");
      return;
    }

    const temMinimo = senha.length >= 8;
    const temMaiuscula = /[A-Z]/.test(senha);
    const temNumero = /[0-9]/.test(senha);
    const temEspecial = /[^A-Za-z0-9]/.test(senha);

    if (!temMinimo || !temMaiuscula || !temNumero || !temEspecial) {
      setMensagem(
        "A senha deve ter pelo menos 8 caracteres, 1 letra maiuscula, 1 numero e 1 caractere especial."
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

  if (verificando) {
    return (
      <TelaBase>
        <CardSenha>
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo-ronaldo-gazolla.png"
              alt="Hospital Municipal Ronaldo Gazolla"
              width={711}
              height={230}
              className="voxx-brand-image h-auto w-64 animate-pulse object-contain"
            />
            <p className={temaDia ? "mt-5 text-sm font-medium text-slate-500" : "mt-5 text-sm font-medium text-slate-400"}>
              Verificando acesso...
            </p>
          </div>
        </CardSenha>
      </TelaBase>
    );
  }

  if (mensagem.includes("Link invalido")) {
    return (
      <TelaBase>
        <CardSenha>
          <div className="flex flex-col items-center text-center">
            <LogoTopo />

            <h1 className={temaDia ? "mt-5 text-2xl font-semibold tracking-tight text-slate-950" : "mt-5 text-2xl font-semibold tracking-tight text-white"}>
              Link expirado
            </h1>
            <p className={temaDia ? "mt-3 text-sm leading-6 text-red-700" : "mt-3 text-sm leading-6 text-red-100"}>
              {mensagem}
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="voxx-button-primary mt-6 h-11 w-full rounded-xl text-sm font-bold transition active:scale-[0.98]"
            >
              Voltar para o login
            </button>
          </div>
        </CardSenha>
      </TelaBase>
    );
  }

  if (tokenPendente) {
    return (
      <TelaBase>
        <CardSenha>
          <div className="flex flex-col items-center text-center">
            <LogoTopo />

            <h1 className={temaDia ? "mt-5 text-2xl font-semibold tracking-tight text-slate-950" : "mt-5 text-2xl font-semibold tracking-tight text-white"}>
              Redefinir sua senha
            </h1>
            <p className={temaDia ? "mt-3 text-sm leading-6 text-slate-600" : "mt-3 text-sm leading-6 text-slate-300"}>
              Confirme abaixo para validar o link e criar uma nova senha.
            </p>

            <button
              type="button"
              onClick={handleConfirmarLink}
              disabled={loading}
              className="voxx-button-primary mt-6 h-11 w-full rounded-xl text-sm font-bold transition active:scale-[0.98]"
            >
              {loading ? "Validando..." : "Continuar com a redefinicao"}
            </button>
          </div>
        </CardSenha>
      </TelaBase>
    );
  }

  return (
    <TelaBase>
      <CardSenha>
        <div className="mb-7 flex flex-col items-center">
          <LogoTopo />

          <h1 className={temaDia ? "mt-5 text-2xl font-semibold tracking-tight text-slate-950" : "mt-5 text-2xl font-semibold tracking-tight text-white"}>
            Definir senha de acesso
          </h1>
          <p className={temaDia ? "mt-2 text-center text-sm leading-6 text-slate-500" : "mt-2 text-center text-sm leading-6 text-slate-400"}>
            Crie uma nova senha segura para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleDefinirSenha} className="space-y-5">
          <div>
            <label className={temaDia ? "mb-1 block text-sm font-semibold text-slate-700" : "mb-1 block text-sm font-medium text-slate-300"}>
              Nova senha <span className={temaDia ? "text-red-500" : "text-red-300"}>*</span>
            </label>

            <div className="relative">
              <input
                required
                type={mostrarSenha ? "text" : "password"}
                placeholder=""
                className="voxx-field h-11 w-full rounded-xl px-4 pr-12 transition"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className={
                  temaDia
                    ? "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    : "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                }
              >
                <IconeOlho aberto={mostrarSenha} />
              </button>
            </div>

            <div className={temaDia ? "mt-3 grid grid-cols-1 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" : "mt-3 grid grid-cols-1 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"}>
              <RequisitoSenha ok={senha.length >= 8} texto="Minimo de 8 caracteres" temaDia={temaDia} />
              <RequisitoSenha ok={/[A-Z]/.test(senha)} texto="Uma letra maiuscula" temaDia={temaDia} />
              <RequisitoSenha ok={/[0-9]/.test(senha)} texto="Um numero" temaDia={temaDia} />
              <RequisitoSenha ok={/[^A-Za-z0-9]/.test(senha)} texto="Um caractere especial" temaDia={temaDia} />
            </div>
          </div>

          <div>
            <label className={temaDia ? "mb-1 block text-sm font-semibold text-slate-700" : "mb-1 block text-sm font-medium text-slate-300"}>
              Confirmar senha <span className={temaDia ? "text-red-500" : "text-red-300"}>*</span>
            </label>

            <div className="relative">
              <input
                required
                type={mostrarConfirmarSenha ? "text" : "password"}
                placeholder=""
                className="voxx-field h-11 w-full rounded-xl px-4 pr-12 transition"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className={
                  temaDia
                    ? "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    : "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                }
              >
                <IconeOlho aberto={mostrarConfirmarSenha} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="voxx-button-primary h-11 w-full rounded-xl text-sm font-bold transition active:scale-[0.98]"
          >
            {loading ? "Salvando..." : "Salvar senha"}
          </button>
        </form>

        {mensagem && (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-center text-sm ${
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

        {loading && (
          <div className="voxx-auth-loading fixed inset-0 z-50 flex items-center justify-center">
            <Image
              src="/logo-ronaldo-gazolla.png"
              alt="Carregando"
              width={711}
              height={230}
              className="voxx-brand-image h-auto w-64 animate-pulse object-contain drop-shadow-2xl"
            />
          </div>
        )}
      </CardSenha>
    </TelaBase>
  );
}
