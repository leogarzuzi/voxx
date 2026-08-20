"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TemaToggle } from "@/components/TemaToggle";
import { useTema, type TemaInterface } from "@/contexts/TemaContext";

type ModoTela = "login" | "primeiro-acesso";
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

function CampoTexto({
  label,
  required,
  type = "text",
  value,
  onChange,
  tema,
}: {
  label: string;
  required?: boolean;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  tema: TemaInterface;
}) {
  return (
    <div>
      <label className="voxx-auth-label mb-1 block text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        type={type}
        placeholder=""
        className="voxx-field h-11 w-full rounded-xl px-4 transition"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-tema={tema}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const { tema, temaDia, alternarTema } = useTema();
  const [modoTela, setModoTela] = useState<ModoTela>("login");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });

    setLoading(false);

    if (error) {
      setMensagem("E-mail ou senha inválidos.");
      return;
    }

    router.refresh();
    router.push("/inicio");
  }

  async function handleResetSenha() {
    if (!email) {
      setMensagem("Digite seu e-mail para redefinir a senha.");
      return;
    }

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/definir-senha`,
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

    const response = await fetch("/api/solicitacoes-acesso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email: email.trim().toLowerCase() }),
    });
    const resultado = await response.json();

    setLoading(false);

    if (!response.ok) {
      setMensagem(resultado.error || "Não foi possível enviar a solicitação.");
      return;
    }

    setNome("");
    setEmail("");
    setConfirmarEmail("");

    setMensagem("Solicitação enviada com sucesso. Aguarde a aprovação.");
  }
  const mensagemSucesso =
    mensagem.includes("enviado") ||
    mensagem.includes("enviada") ||
    mensagem.includes("aprovação");

  return (
    <div
      className="voxx-auth-page px-4 py-10 pb-24"
    >
      <div className="voxx-auth-backdrop" />
      <div className="voxx-auth-glow-left" />
      <div className="voxx-auth-glow-right" />

      <Link
        href="/area-medica"
        className="voxx-medical-access absolute right-4 top-4 z-20 flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold sm:right-8 sm:top-8"
        aria-label="Acessar a Área Médica"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 3v5a4 4 0 0 0 8 0V3M4 3h4M12 3h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 12v2a5 5 0 0 0 10 0v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="20" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>Área Médica</span>
      </Link>

      <div className="relative z-10 w-full max-w-[430px]">
        <div
          className="voxx-auth-card rounded-[30px] p-8"
        >
          <div className="mb-7 flex flex-col items-center">
            <div
              className="voxx-auth-logo"
            >
              <Image src="/logo-ronaldo-gazolla.png" alt="Hospital Municipal Ronaldo Gazolla" width={711} height={230} priority className="voxx-brand-image h-auto w-full object-contain" />
            </div>

            {modoTela === "primeiro-acesso" && (
              <>
                <h1 className="voxx-auth-title mt-5 text-2xl font-semibold tracking-tight">
                  Solicitar acesso
                </h1>
                <p className="voxx-auth-description mt-2 text-center text-sm font-medium">
                  Informe seus dados para solicitar liberação.
                </p>
              </>
            )}
          </div>

          {modoTela === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <CampoTexto
                required
                label="E-mail"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={setEmail}
                tema={tema}
              />

              <div>
                <label className="voxx-auth-label mb-1 block text-sm font-semibold">
                  Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    placeholder=""
                    className="voxx-field h-11 w-full rounded-xl px-4 pr-12 transition"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="voxx-text-muted absolute right-3 top-1/2 -translate-y-1/2 transition hover:text-[var(--voxx-primary)]"
                  >
                    <IconeOlho aberto={mostrarSenha} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="voxx-button-primary h-11 w-full rounded-xl text-sm font-bold transition active:scale-[0.98]"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePrimeiroAcesso} className="space-y-5">
              <CampoTexto required label="Nome completo" placeholder="Digite seu nome completo" value={nome} onChange={setNome} tema={tema} />
              <CampoTexto required label="E-mail" type="email" placeholder="seuemail@exemplo.com" value={email} onChange={setEmail} tema={tema} />
              <CampoTexto required label="Confirmar e-mail" type="email" placeholder="Digite novamente seu e-mail" value={confirmarEmail} onChange={setConfirmarEmail} tema={tema} />

              <button
                type="submit"
                disabled={loading}
                className="voxx-button-primary h-11 w-full rounded-xl text-sm font-bold transition active:scale-[0.98]"
              >
                {loading ? "Enviando..." : "Solicitar acesso"}
              </button>
            </form>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <button
              type="button"
              onClick={handleResetSenha}
              disabled={loading}
              className="voxx-button-secondary h-10 rounded-xl text-sm font-semibold transition active:scale-[0.97]"
            >
              {loading ? "Enviando..." : "Esqueci a senha"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMensagem("");
                setModoTela(modoTela === "login" ? "primeiro-acesso" : "login");
              }}
              className="voxx-button-secondary h-10 rounded-xl text-sm font-semibold transition active:scale-[0.97]"
            >
              {modoTela === "login" ? "Solicitar acesso" : "Voltar"}
            </button>
          </div>

          {mensagem && (
            <div
              className={`mt-5 rounded-xl border px-4 py-3 text-center text-sm ${
                mensagemSucesso
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
      </div>

      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />

      {loading && (
        <div className="voxx-auth-loading fixed inset-0 z-50 flex items-center justify-center">
          <Image src="/logo-ronaldo-gazolla.png" alt="Carregando" width={711} height={230} className="voxx-brand-image h-auto w-64 animate-pulse object-contain drop-shadow-2xl" />
        </div>
      )}
    </div>
  );
}



