"use client";

import { useEffect, useState } from "react";
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
      className={`flex items-center gap-2 text-xs ${
        ok
          ? temaDia
            ? "text-emerald-700"
            : "text-emerald-300"
          : temaDia
            ? "text-slate-500"
            : "text-slate-500"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          ok
            ? temaDia
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25"
            : temaDia
              ? "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
              : "bg-white/[0.05] text-slate-500 ring-1 ring-white/10"
        }`}
      >
        {ok ? "ok" : "-"}
      </span>
      {texto}
    </div>
  );
}

function TelaBase({ children }: { children: React.ReactNode }) {
  const { tema, temaDia, alternarTema } = useTema();

  return (
    <div
      className={
        temaDia
          ? "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-4 py-10 pb-24 text-slate-900"
          : "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#11141b] px-4 py-10 pb-24 text-slate-100"
      }
    >
      <div
        className={
          temaDia
            ? "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f5f7fb_52%,#e9eef6_100%)]"
            : "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.14),transparent_34%),linear-gradient(180deg,#151923_0%,#11141b_52%,#0d1016_100%)]"
        }
      />
      <div
        className={
          temaDia
            ? "pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
            : "pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
        }
      />
      <div
        className={
          temaDia
            ? "pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-slate-200/80 blur-3xl"
            : "pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-slate-700/20 blur-3xl"
        }
      />

      <div className="relative z-10 w-full max-w-[430px]">{children}</div>
      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />
    </div>
  );
}

function CardSenha({ children }: { children: React.ReactNode }) {
  const { temaDia } = useTema();

  return (
    <div
      className={
        temaDia
          ? "rounded-[30px] border border-white bg-white/92 p-8 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          : "rounded-[30px] border border-white/10 bg-[#171a23]/95 p-8 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl"
      }
    >
      {children}
    </div>
  );
}

function LogoTopo() {
  const { temaDia } = useTema();

  return (
    <div
      className={
        temaDia
          ? "flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_18px_38px_rgba(15,23,42,0.22)]"
          : "flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-inner shadow-white/5"
      }
    >
      <img src="/logo-simbolo.png" alt="VOXX" className="h-12 w-12 object-contain" />
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

      if (
        !sessaoCriada &&
        tokenHash &&
        (tipoLink === "recovery" || tipoLink === "invite")
      ) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: tipoLink as "recovery" | "invite",
        });

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
            <img
              src="/logo-simbolo.png"
              alt="VOXX"
              className="h-20 w-20 animate-pulse object-contain"
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
              className={
                temaDia
                  ? "mt-6 h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 active:scale-[0.98]"
                  : "mt-6 h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98]"
              }
            >
              Voltar para o login
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
                placeholder="Digite sua nova senha"
                className={
                  temaDia
                    ? "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    : "h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
                }
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
                placeholder="Digite novamente sua senha"
                className={
                  temaDia
                    ? "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    : "h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
                }
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
            className={
              temaDia
                ? "h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
                : "h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
            }
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
          <div className={temaDia ? "fixed inset-0 z-50 flex items-center justify-center bg-white/45 backdrop-blur-[1.5px]" : "fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[1.5px]"}>
            <img
              src="/logo-simbolo.png"
              alt="Carregando"
              className="h-20 w-20 animate-pulse object-contain drop-shadow-2xl"
            />
          </div>
        )}
      </CardSenha>
    </TelaBase>
  );
}