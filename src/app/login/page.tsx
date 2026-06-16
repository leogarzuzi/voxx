"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M10.6 10.6A3 3 0 0 0 13.4 13.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.1 4.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.4-.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CampoTexto({
  label,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label} {required && <span className="text-red-300">*</span>}
      </label>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://voxx-beryl.vercel.app/definir-senha",
    });

    setLoading(false);

    if (error) {
      setMensagem(
        "Erro ao enviar e-mail de redefinição. Verifique o e-mail informado."
      );
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

  const mensagemSucesso =
    mensagem.includes("enviado") ||
    mensagem.includes("enviada") ||
    mensagem.includes("aprovação");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#11141b] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.14),transparent_34%),linear-gradient(180deg,#151923_0%,#11141b_52%,#0d1016_100%)]" />

      <div className="relative z-10 w-full max-w-[430px]">
        <div className="rounded-[30px] border border-white/10 bg-[#171a23]/95 p-8 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl">
          <div className="mb-7 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-inner shadow-white/5">
              <img
                src="/logo-simbolo.png"
                alt="VOXX"
                className="h-12 w-12 object-contain"
              />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
              {modoTela === "login" ? "Entrar no sistema" : "Solicitar acesso"}
            </h1>
            <p className="mt-2 text-center text-sm font-medium text-slate-400">
              {modoTela === "login"
                ? "Acesse sua conta para continuar."
                : "Informe seus dados para solicitar liberação."}
            </p>
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
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Senha <span className="text-red-300">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                  >
                    <IconeOlho aberto={mostrarSenha} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePrimeiroAcesso} className="space-y-5">
              <CampoTexto
                required
                label="Nome completo"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={setNome}
              />

              <CampoTexto
                required
                label="E-mail"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={setEmail}
              />

              <CampoTexto
                required
                label="Confirmar e-mail"
                type="email"
                placeholder="Digite novamente seu e-mail"
                value={confirmarEmail}
                onChange={setConfirmarEmail}
              />

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
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
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
            >
              {loading ? "Enviando..." : "Esqueci a senha"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMensagem("");
                setModoTela(modoTela === "login" ? "primeiro-acesso" : "login");
              }}
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
            >
              {modoTela === "login" ? "Solicitar acesso" : "Voltar"}
            </button>
          </div>

          {mensagem && (
            <div
              className={`mt-5 rounded-xl border px-4 py-3 text-center text-sm ${
                mensagemSucesso
                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                  : "border-red-300/20 bg-red-400/10 text-red-100"
              }`}
            >
              {mensagem}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            VOXX • v1.0
          </p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[1.5px]">
          <img
            src="/logo-simbolo.png"
            alt="Carregando"
            className="h-20 w-20 animate-pulse object-contain drop-shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
