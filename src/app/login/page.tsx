"use client";

import { useState } from "react";
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
  placeholder,
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
  const temaDia = tema === "dia";

  return (
    <div>
      <label
        className={
          temaDia
            ? "mb-1 block text-sm font-semibold text-slate-700"
            : "mb-1 block text-sm font-medium text-slate-300"
        }
      >
        {label} {required && <span className={temaDia ? "text-red-500" : "text-red-300"}>*</span>}
      </label>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        className={
          temaDia
            ? "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            : "h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

      <div className="relative z-10 w-full max-w-[430px]">
        <div
          className={
            temaDia
              ? "rounded-[30px] border border-white bg-white/92 p-8 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl"
              : "rounded-[30px] border border-white/10 bg-[#171a23]/95 p-8 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl"
          }
        >
          <div className="mb-7 flex flex-col items-center">
            <div
              className={
                temaDia
                  ? "flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_18px_38px_rgba(15,23,42,0.22)]"
                  : "flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-inner shadow-white/5"
              }
            >
              <img src="/logo-simbolo.png" alt="VOXX" className="h-12 w-12 object-contain" />
            </div>

            <h1
              className={
                temaDia
                  ? "mt-5 text-2xl font-semibold tracking-tight text-slate-950"
                  : "mt-5 text-2xl font-semibold tracking-tight text-white"
              }
            >
              {modoTela === "login" ? "Entrar no sistema" : "Solicitar acesso"}
            </h1>
            <p
              className={
                temaDia
                  ? "mt-2 text-center text-sm font-medium text-slate-500"
                  : "mt-2 text-center text-sm font-medium text-slate-400"
              }
            >
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
                tema={tema}
              />

              <div>
                <label
                  className={
                    temaDia
                      ? "mb-1 block text-sm font-semibold text-slate-700"
                      : "mb-1 block text-sm font-medium text-slate-300"
                  }
                >
                  Senha <span className={temaDia ? "text-red-500" : "text-red-300"}>*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className={
                      temaDia
                        ? "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        : "h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
                    }
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
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
                className={
                  temaDia
                    ? "h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
                    : "h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
                }
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
              className={
                temaDia
                  ? "h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.97]"
                  : "h-10 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
              }
            >
              {loading ? "Enviando..." : "Esqueci a senha"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMensagem("");
                setModoTela(modoTela === "login" ? "primeiro-acesso" : "login");
              }}
              className={
                temaDia
                  ? "h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.97]"
                  : "h-10 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
              }
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

          <p className={temaDia ? "mt-6 text-center text-xs text-slate-400" : "mt-6 text-center text-xs text-slate-500"}>
            VOXX • v1.0
          </p>
        </div>
      </div>

      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />

      {loading && (
        <div className={temaDia ? "fixed inset-0 z-50 flex items-center justify-center bg-white/45 backdrop-blur-[1.5px]" : "fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[1.5px]"}>
          <img src="/logo-simbolo.png" alt="Carregando" className="h-20 w-20 animate-pulse object-contain drop-shadow-2xl" />
        </div>
      )}
    </div>
  );
}



