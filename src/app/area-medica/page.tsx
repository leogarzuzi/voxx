"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TemaToggle } from "@/components/TemaToggle";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { useTema } from "@/contexts/TemaContext";

type Vinculo = {
  id: number;
  matricula: string;
  nome: string;
  funcao: string;
  email: string;
};

function formatarCpf(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function IconePessoa() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AreaMedicaPage() {
  const router = useRouter();
  const { tema, temaDia, alternarTema } = useTema();
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [vinculoSelecionado, setVinculoSelecionado] = useState<Vinculo | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    try {
      const valor = window.sessionStorage.getItem("voxx-area-medica");
      if (!valor) return;
      const sessao = JSON.parse(valor) as {
        cpf?: string;
        dataNascimento?: string;
        vinculo?: Vinculo;
      };
      if (!sessao.cpf || !sessao.dataNascimento || !sessao.vinculo?.id) return;
      setCpf(sessao.cpf);
      setDataNascimento(sessao.dataNascimento);
      setVinculos([sessao.vinculo]);
      setVinculoSelecionado(sessao.vinculo);
    } catch {
      window.sessionStorage.removeItem("voxx-area-medica");
    }
  }, []);

  async function identificar(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMensagem("");

    try {
      const resposta = await fetch("/api/area-medica/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, dataNascimento }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.error || "Não foi possível identificar seus dados.");
        return;
      }

      const encontrados = (dados.vinculos ?? []) as Vinculo[];
      setVinculos(encontrados);
      if (encontrados.length === 1) setVinculoSelecionado(encontrados[0]);
    } catch {
      setMensagem(
        "Não foi possível consultar seus dados agora. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function reiniciar() {
    window.sessionStorage.removeItem("voxx-area-medica");
    setCpf("");
    setDataNascimento("");
    setVinculos([]);
    setVinculoSelecionado(null);
    setMensagem("");
  }

  function abrirSubstituicao() {
    if (!vinculoSelecionado) return;
    window.sessionStorage.setItem(
      "voxx-area-medica",
      JSON.stringify({ cpf, dataNascimento, vinculo: vinculoSelecionado }),
    );
    router.push("/area-medica/substituicao");
  }

  function abrirTroca() {
    if (!vinculoSelecionado) return;
    window.sessionStorage.setItem(
      "voxx-area-medica",
      JSON.stringify({ cpf, dataNascimento, vinculo: vinculoSelecionado }),
    );
    router.push("/area-medica/troca");
  }

  function abrirSolicitacoes() {
    if (!vinculoSelecionado) return;
    window.sessionStorage.setItem(
      "voxx-area-medica",
      JSON.stringify({ cpf, dataNascimento, vinculo: vinculoSelecionado }),
    );
    router.push("/area-medica/solicitacoes");
  }

  const painel = temaDia
    ? "border-slate-200 bg-white/92 shadow-[0_24px_70px_rgba(15,45,75,0.13)]"
    : "border-white/10 bg-[#112d49]/92 shadow-[0_24px_70px_rgba(0,0,0,0.32)]";
  const textoSecundario = temaDia ? "text-slate-600" : "text-slate-300";
  const larguraPainel = vinculoSelecionado
    ? "max-w-3xl"
    : vinculos.length > 1
      ? "max-w-2xl"
      : "max-w-[390px]";

  return (
    <main className="voxx-auth-page min-h-screen px-4 py-24 sm:px-8">
      <div className="voxx-auth-backdrop" />
      <div className="voxx-auth-glow-left" />
      <div className="voxx-auth-glow-right" />

      <BotaoVoltar
        onClick={() => {
          if (vinculoSelecionado || vinculos.length > 0) reiniciar();
          else router.push("/login");
        }}
      />

      <div
        className={`relative z-10 w-full transition-[max-width] duration-300 ${larguraPainel}`}
      >
        <section
          className={`rounded-[26px] border p-5 backdrop-blur-xl sm:p-7 ${painel}`}
        >
          <header className="flex flex-col items-center text-center">
            <div className="voxx-auth-logo">
              <Image
                src="/logo-ronaldo-gazolla.png"
                alt="Hospital Municipal Ronaldo Gazolla"
                width={711}
                height={230}
                priority
                className="voxx-brand-image h-auto w-full object-contain"
              />
            </div>
            <h1 className="mt-4 text-xl font-bold sm:text-2xl">Área Médica</h1>
          </header>

          {vinculoSelecionado ? (
            <div className="mt-8">
              <div
                className={`rounded-2xl border px-5 py-4 ${temaDia ? "border-sky-200 bg-sky-50" : "border-sky-300/20 bg-sky-300/10"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{vinculoSelecionado.nome}</p>
                    <p className={`mt-1 text-sm ${textoSecundario}`}>
                      Matrícula {vinculoSelecionado.matricula} ·{" "}
                      {vinculoSelecionado.funcao}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="text-sm font-bold text-[var(--voxx-primary)] hover:underline"
                  >
                    Trocar identificação
                  </button>
                </div>
              </div>

              <h2 className="mt-8 text-center text-xl font-bold">
                O que você deseja fazer?
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={abrirSubstituicao}
                  className={`rounded-2xl border p-6 text-left transition hover:-translate-y-1 ${temaDia ? "border-sky-200 bg-sky-50 hover:border-sky-400" : "border-sky-300/20 bg-sky-300/10 hover:border-sky-300/50"}`}
                >
                  <span
                    className="block text-center text-4xl leading-none"
                    aria-hidden="true"
                  >
                    ↪
                  </span>
                  <h3 className="mt-5 text-lg font-bold">
                    Substituição médica
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${textoSecundario}`}>
                    Registrar outro médico para assumir o plantão.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={abrirTroca}
                  className={`rounded-2xl border p-6 text-left transition hover:-translate-y-1 ${temaDia ? "border-sky-200 bg-sky-50 hover:border-sky-400" : "border-sky-300/20 bg-sky-300/10 hover:border-sky-300/50"}`}
                >
                  <span
                    className="block text-center text-4xl leading-none"
                    aria-hidden="true"
                  >
                    ⇄
                  </span>
                  <h3 className="mt-5 text-lg font-bold">Troca de plantão</h3>
                  <p className={`mt-2 text-sm leading-6 ${textoSecundario}`}>
                    Registrar a troca de plantões entre dois médicos.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={abrirSolicitacoes}
                  className={`rounded-2xl border p-6 text-left transition hover:-translate-y-1 ${temaDia ? "border-amber-200 bg-amber-50 hover:border-amber-400" : "border-amber-300/20 bg-amber-300/10 hover:border-amber-300/50"}`}
                >
                  <span
                    className="block text-center text-4xl leading-none"
                    aria-hidden="true"
                  >
                    ⌕
                  </span>
                  <h3 className="mt-5 text-lg font-bold">
                    Minhas solicitações
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${textoSecundario}`}>
                    Consultar protocolos e cancelar registros dentro do prazo.
                  </p>
                </button>
              </div>
            </div>
          ) : vinculos.length > 1 ? (
            <div className="mt-8">
              <h2 className="text-center text-xl font-bold">
                Selecione seu vínculo
              </h2>
              <p className={`mt-2 text-center text-sm ${textoSecundario}`}>
                Encontramos dois vínculos ativos. Escolha aquele relacionado à
                solicitação.
              </p>
              <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
                {vinculos.map((vinculo) => (
                  <button
                    key={vinculo.id}
                    type="button"
                    onClick={() => setVinculoSelecionado(vinculo)}
                    className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${temaDia ? "border-slate-200 bg-slate-50 hover:border-sky-400 hover:bg-sky-50" : "border-white/10 bg-white/5 hover:border-sky-300/50 hover:bg-sky-300/10"}`}
                  >
                    <span className="text-[var(--voxx-primary)]">
                      <IconePessoa />
                    </span>
                    <h3 className="mt-4 font-bold">{vinculo.nome}</h3>
                    <dl className={`mt-3 space-y-1 text-sm ${textoSecundario}`}>
                      <div>
                        <dt className="inline font-semibold">Matrícula: </dt>
                        <dd className="inline">{vinculo.matricula}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Função: </dt>
                        <dd className="inline">{vinculo.funcao}</dd>
                      </div>
                    </dl>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={reiniciar}
                className="mx-auto mt-6 block text-sm font-bold text-[var(--voxx-primary)] hover:underline"
              >
                Voltar à identificação
              </button>
            </div>
          ) : (
            <form
              onSubmit={identificar}
              className="mx-auto mt-6 max-w-[310px] space-y-4"
            >
              <p className={`text-center text-xs leading-5 ${textoSecundario}`}>
                Informe seus dados para acessar substituições e trocas de
                plantão.
              </p>
              <div>
                <label
                  htmlFor="cpf-medico"
                  className="voxx-auth-label mb-1 block text-sm font-semibold"
                >
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  id="cpf-medico"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  className="voxx-field h-10 w-full rounded-lg px-3"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(event) => setCpf(formatarCpf(event.target.value))}
                />
              </div>
              <div>
                <label
                  htmlFor="nascimento-medico"
                  className="voxx-auth-label mb-1 block text-sm font-semibold"
                >
                  Data de nascimento <span className="text-red-500">*</span>
                </label>
                <input
                  id="nascimento-medico"
                  required
                  type="date"
                  className="voxx-field h-10 w-full rounded-lg px-3"
                  value={dataNascimento}
                  onChange={(event) => setDataNascimento(event.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="voxx-button-primary h-10 w-full rounded-lg text-sm font-bold transition active:scale-[0.98]"
              >
                {loading ? "Verificando..." : "Continuar"}
              </button>
              {mensagem && (
                <div
                  className={`rounded-xl border px-4 py-3 text-center text-sm ${temaDia ? "border-red-200 bg-red-50 text-red-700" : "border-red-300/20 bg-red-400/10 text-red-100"}`}
                >
                  {mensagem}
                </div>
              )}
            </form>
          )}
        </section>
      </div>

      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />
    </main>
  );
}
