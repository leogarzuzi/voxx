"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TemaToggle } from "@/components/TemaToggle";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { useTema } from "@/contexts/TemaContext";
import { emailTemFormatoValido, normalizarEmail } from "@/lib/emailSeguro";

type Vinculo = {
  id: number;
  matricula: string;
  nome: string;
  funcao: string;
  email: string;
};
type SessaoMedica = { cpf: string; dataNascimento: string; vinculo: Vinculo };
type MedicoSolicitado = {
  id: number;
  matricula: string;
  nome: string;
  funcao: string;
  email: string;
};

const TIPOS = ["SD", "SN", "24H", "ROTINA", "AMBULATÓRIO"];
const DOMINIOS_COM_ERRO: Record<string, string> = {
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.com.br": "yahoo.com.br",
};

function validarEmail(valor: string) {
  const email = normalizarEmail(valor);
  if (!email) return "O e-mail é obrigatório.";
  if (!emailTemFormatoValido(email)) return "Informe um e-mail válido.";
  const dominio = email.split("@")[1];
  return DOMINIOS_COM_ERRO[dominio]
    ? `O domínio “${dominio}” parece incorreto. Você quis dizer “${DOMINIOS_COM_ERRO[dominio]}”?`
    : "";
}

function validarEmailOpcional(valor: string) {
  return valor.trim() ? validarEmail(valor) : "";
}

function competenciaAtual() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")?.value}-${partes.find((p) => p.type === "month")?.value}`;
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return data ? `${dia}/${mes}/${ano}` : "—";
}

function normalizarFuncao(valor: string | undefined) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export default function TrocaMedicaPage() {
  const router = useRouter();
  const { tema, temaDia, alternarTema } = useTema();
  const [sessao, setSessao] = useState<SessaoMedica | null>(null);
  const [email, setEmail] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [dataSolicitante, setDataSolicitante] = useState("");
  const [tipoSolicitante, setTipoSolicitante] = useState("");
  const [matriculaSolicitado, setMatriculaSolicitado] = useState("");
  const [solicitado, setSolicitado] = useState<MedicoSolicitado | null>(null);
  const [emailSolicitado, setEmailSolicitado] = useState("");
  const [erroEmailSolicitado, setErroEmailSolicitado] = useState("");
  const [dataSolicitado, setDataSolicitado] = useState("");
  const [tipoSolicitado, setTipoSolicitado] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [revisando, setRevisando] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [avisoEmail, setAvisoEmail] = useState("");

  useEffect(() => {
    try {
      const valor = sessionStorage.getItem("voxx-area-medica");
      if (!valor) return;
      const dados = JSON.parse(valor) as SessaoMedica;
      if (!dados?.vinculo?.id) return;
      setSessao(dados);
      setEmail(dados.vinculo.email || "");
    } catch {
      /* sessão inválida */
    }
  }, []);

  const competencia = useMemo(() => competenciaAtual(), []);
  const [ano, mes] = competencia.split("-").map(Number);
  const limiteInicial = `${competencia}-01`;
  const limiteFinal = `${competencia}-${String(new Date(ano, mes, 0).getDate()).padStart(2, "0")}`;
  const painel = temaDia
    ? "border-slate-200 bg-white/94"
    : "border-white/10 bg-[#112d49]/94";
  const suave = temaDia
    ? "border-slate-200 bg-slate-50"
    : "border-white/10 bg-white/5";
  const secundario = temaDia ? "text-slate-600" : "text-slate-300";
  const divisor = temaDia ? "border-slate-200" : "border-white/10";
  const erroClass = temaDia
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-red-300/20 bg-red-400/10 text-red-100";
  const funcoesDiferentes = Boolean(
    solicitado &&
    normalizarFuncao(sessao?.vinculo.funcao) !==
      normalizarFuncao(solicitado.funcao),
  );

  function alterarMatricula(valor: string) {
    setMatriculaSolicitado(valor.replace(/\D/g, "").slice(0, 8));
    setSolicitado(null);
    setEmailSolicitado("");
    setErroEmailSolicitado("");
    setMensagem("");
  }

  async function buscarSolicitado() {
    if (!sessao || matriculaSolicitado.length !== 8) {
      setMensagem("Informe os 8 dígitos da matrícula do médico solicitado.");
      return;
    }
    setBuscando(true);
    setMensagem("");
    try {
      const resposta = await fetch("/api/area-medica/buscar-substituto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: sessao.cpf,
          dataNascimento: sessao.dataNascimento,
          vinculoId: sessao.vinculo.id,
          matricula: matriculaSolicitado,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setMensagem(dados.error || "Médico não encontrado.");
        return;
      }
      setSolicitado(dados.substituto);
      setEmailSolicitado(dados.substituto.email || "");
    } catch {
      setMensagem("Não foi possível consultar a matrícula agora.");
    } finally {
      setBuscando(false);
    }
  }

  function revisar(event: React.FormEvent) {
    event.preventDefault();
    const erro = validarEmail(email);
    const erroSolicitado = validarEmailOpcional(emailSolicitado);
    setErroEmail(erro);
    setErroEmailSolicitado(erroSolicitado);
    if (erro || erroSolicitado) return;
    if (
      !dataSolicitante ||
      !tipoSolicitante ||
      !solicitado ||
      !dataSolicitado ||
      !tipoSolicitado
    ) {
      setMensagem("Preencha os dois plantões e localize o médico solicitado.");
      return;
    }
    if (
      dataSolicitante === dataSolicitado &&
      tipoSolicitante === tipoSolicitado
    ) {
      setMensagem("Os plantões não podem ter a mesma data e o mesmo tipo.");
      return;
    }
    if (
      dataSolicitante.slice(0, 7) !== competencia ||
      dataSolicitado.slice(0, 7) !== competencia
    ) {
      setMensagem(
        `As duas datas devem pertencer ao mês vigente (${String(mes).padStart(2, "0")}/${ano}). Escolha datas entre ${formatarData(limiteInicial)} e ${formatarData(limiteFinal)}.`,
      );
      return;
    }
    setMensagem("");
    setRevisando(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmar() {
    if (!sessao || !solicitado || !aceitouTermos) return;
    setSalvando(true);
    setMensagem("");
    try {
      const resposta = await fetch("/api/area-medica/trocas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: sessao.cpf,
          dataNascimento: sessao.dataNascimento,
          solicitanteId: sessao.vinculo.id,
          solicitadoId: solicitado.id,
          email,
          emailSolicitado,
          dataSolicitante,
          tipoSolicitante,
          dataSolicitado,
          tipoSolicitado,
          aceitouTermos,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setMensagem(dados.error || "Não foi possível registrar a troca.");
        return;
      }
      setProtocolo(dados.troca.protocolo);
      setAvisoEmail(dados.avisoEmail || "");
    } catch {
      setMensagem("Não foi possível registrar a troca agora.");
    } finally {
      setSalvando(false);
    }
  }

  if (!sessao)
    return (
      <main className="voxx-auth-page px-4">
        <div className="voxx-auth-backdrop" />
        <section
          className={`relative z-10 max-w-md rounded-3xl border p-8 text-center ${painel}`}
        >
          <h1 className="text-xl font-bold">Identificação necessária</h1>
          <p className={`mt-3 text-sm ${secundario}`}>
            Acesse novamente a Área Médica e confirme seus dados.
          </p>
          <button
            onClick={() => router.push("/area-medica")}
            className="voxx-button-primary mt-6 h-10 rounded-lg px-5 font-bold"
          >
            Ir para identificação
          </button>
        </section>
      </main>
    );

  return (
    <main className="voxx-auth-page min-h-screen px-4 py-24 sm:px-8">
      <div className="voxx-auth-backdrop" />
      <div className="voxx-auth-glow-left" />
      <div className="voxx-auth-glow-right" />
      <BotaoVoltar onClick={() => router.back()} />
      <section
        className={`relative z-10 w-full max-w-3xl rounded-[28px] border p-5 shadow-xl backdrop-blur-xl sm:p-8 ${painel}`}
      >
        <header className="text-center">
          <Image
            src="/logo-ronaldo-gazolla.png"
            alt="Hospital Municipal Ronaldo Gazolla"
            width={711}
            height={230}
            priority
            className="voxx-brand-image mx-auto h-auto w-full max-w-[230px] object-contain"
          />
          <h1 className="mt-4 text-2xl font-bold">Troca médica</h1>
        </header>
        {protocolo ? (
          <div className="mx-auto mt-8 max-w-lg text-center">
            <div
              className={`rounded-2xl border p-7 ${temaDia ? "border-emerald-200 bg-emerald-50" : "border-emerald-300/20 bg-emerald-400/10"}`}
            >
              <div className="text-4xl">✓</div>
              <h2 className="mt-4 text-xl font-bold">
                Troca médica registrada
              </h2>
              <p className={`mt-2 text-sm ${secundario}`}>
                Guarde o protocolo para consultar ou cancelar a solicitação.
              </p>
              <p className="mt-5 text-lg font-bold text-[var(--voxx-primary)]">
                {protocolo}
              </p>
              {avisoEmail && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {avisoEmail}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push("/area-medica")}
              className="voxx-button-primary mt-6 h-10 rounded-lg px-6 font-bold"
            >
              Voltar à Área Médica
            </button>
          </div>
        ) : revisando ? (
          <div className="mt-8">
            <h2 className="text-lg font-bold">Revise antes de confirmar</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-2xl border p-5 ${suave}`}>
                <p className={`text-xs font-bold uppercase ${secundario}`}>
                  Médico solicitante
                </p>
                <p className="mt-2 font-bold">{sessao.vinculo.nome}</p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {sessao.vinculo.matricula} · {sessao.vinculo.funcao}
                </p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {formatarData(dataSolicitante)} · {tipoSolicitante}
                </p>
              </div>
              <div className={`rounded-2xl border p-5 ${suave}`}>
                <p className={`text-xs font-bold uppercase ${secundario}`}>
                  Médico solicitado
                </p>
                <p className="mt-2 font-bold">{solicitado?.nome}</p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {solicitado?.matricula} · {solicitado?.funcao}
                </p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {emailSolicitado.trim().toLowerCase() ||
                    "E-mail não informado"}
                </p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {formatarData(dataSolicitado)} · {tipoSolicitado}
                </p>
              </div>
            </div>
            {funcoesDiferentes && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${
                  temaDia
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-red-300/25 bg-red-400/10 text-red-100"
                }`}
              >
                <span className="font-bold">Atenção:</span> ao confirmar,
                declaro estar ciente de que estou realizando uma troca de
                plantão com um médico de função ou especialidade diferente da
                minha.
              </div>
            )}
            <div
              className={`mt-5 rounded-2xl border p-5 ${temaDia ? "border-sky-200 bg-sky-50" : "border-sky-300/20 bg-sky-300/10"}`}
            >
              <h3 className="font-bold">
                Declaração de ciência e responsabilidade
              </h3>
              <p className={`mt-3 text-sm ${secundario}`}>
                Reconheço que o preenchimento é de minha inteira
                responsabilidade e declaro estar ciente de que:
              </p>
              <ul
                className={`mt-3 list-disc space-y-2 pl-5 text-sm leading-6 ${secundario}`}
              >
                <li>
                  as substituições e trocas de plantão somente poderão ser
                  registradas para plantões pertencentes ao mês vigente;
                </li>
                <li>
                  informações incorretas, incompletas ou divergentes poderão
                  impactar o processamento da minha remuneração;
                </li>
                <li>
                  o RH poderá desconsiderar a solicitação caso as informações
                  fornecidas não estejam de acordo com as regras estabelecidas.
                </li>
              </ul>
              <label className="mt-5 flex cursor-pointer items-start gap-3 font-semibold">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Declaro que li, compreendi e concordo com a Declaração de
                  ciência e responsabilidade.
                </span>
              </label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setRevisando(false);
                  setAceitouTermos(false);
                }}
                className="voxx-button-secondary h-10 rounded-lg px-5 font-bold"
              >
                Alterar dados
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={!aceitouTermos || salvando}
                className="voxx-button-primary h-10 rounded-lg px-6 font-bold disabled:opacity-50"
              >
                {salvando ? "Registrando..." : "Confirmar troca"}
              </button>
            </div>
            {mensagem && (
              <div
                className={`mt-4 rounded-xl border p-3 text-center text-sm ${erroClass}`}
              >
                {mensagem}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={revisar} noValidate className="mt-8 space-y-6">
            <section className={`rounded-2xl border p-5 ${suave}`}>
              <h2 className="font-bold">Médico solicitante</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className={`text-xs font-semibold ${secundario}`}>Nome</p>
                  <p className="mt-1 font-bold">{sessao.vinculo.nome}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold ${secundario}`}>
                    Matrícula
                  </p>
                  <p className="mt-1 font-bold">{sessao.vinculo.matricula}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold ${secundario}`}>
                    Função
                  </p>
                  <p className="mt-1 font-bold">{sessao.vinculo.funcao}</p>
                </div>
              </div>
              <div
                className={`mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3 ${divisor}`}
              >
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-sm font-bold">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErroEmail("");
                    }}
                    onBlur={() => {
                      setEmail((v) => v.trim().toLowerCase());
                      setErroEmail(validarEmail(email));
                    }}
                    className="voxx-field h-10 w-full rounded-lg px-3"
                    placeholder="nome@dominio.com"
                  />
                  {erroEmail && (
                    <p className="mt-2 text-sm text-red-600">{erroEmail}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">
                    Data do plantão <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    min={limiteInicial}
                    max={limiteFinal}
                    value={dataSolicitante}
                    onChange={(e) => setDataSolicitante(e.target.value)}
                    className="voxx-field h-10 w-full rounded-lg px-3"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={tipoSolicitante}
                    onChange={(e) => setTipoSolicitante(e.target.value)}
                    className="voxx-field h-10 w-full rounded-lg px-3"
                  >
                    <option value="">Selecione</option>
                    {TIPOS.map((tipo) => (
                      <option key={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
            <section className={`rounded-2xl border p-5 ${suave}`}>
              <h2 className="font-bold">Médico solicitado</h2>
              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="matricula-solicitado"
              >
                Matrícula do médico solicitado{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  id="matricula-solicitado"
                  required
                  inputMode="numeric"
                  maxLength={8}
                  value={matriculaSolicitado}
                  onChange={(e) => alterarMatricula(e.target.value)}
                  className="voxx-field h-10 w-36 max-w-full rounded-lg px-3 tracking-wider"
                  placeholder="00000000"
                />
                <button
                  type="button"
                  onClick={buscarSolicitado}
                  disabled={buscando || matriculaSolicitado.length !== 8}
                  className="voxx-button-secondary h-10 rounded-lg px-5 font-bold"
                >
                  {buscando ? "Buscando..." : "Buscar matrícula"}
                </button>
              </div>
              {solicitado && (
                <>
                  <div
                    className={`mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 ${divisor}`}
                  >
                    <div className="sm:col-span-2">
                      <p className={`text-xs font-semibold ${secundario}`}>
                        Nome
                      </p>
                      <p className="mt-1 font-bold">{solicitado.nome}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${secundario}`}>
                        Matrícula
                      </p>
                      <p className="mt-1 font-bold">{solicitado.matricula}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${secundario}`}>
                        Função
                      </p>
                      <p className="mt-1 font-bold">{solicitado.funcao}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-bold">
                        E-mail do médico solicitado{" "}
                        <span className={`font-normal ${secundario}`}>
                          (opcional)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={emailSolicitado}
                        onChange={(e) => {
                          setEmailSolicitado(e.target.value);
                          setErroEmailSolicitado("");
                        }}
                        onBlur={() => {
                          setEmailSolicitado((valor) =>
                            valor.trim().toLowerCase(),
                          );
                          setErroEmailSolicitado(
                            validarEmailOpcional(emailSolicitado),
                          );
                        }}
                        className="voxx-field h-10 w-full rounded-lg px-3"
                        placeholder="nome@dominio.com"
                      />
                      {erroEmailSolicitado && (
                        <p className="mt-2 text-sm text-red-600">
                          {erroEmailSolicitado}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3 ${divisor}`}
                  >
                    <div>
                      <label className="mb-1 block text-sm font-bold">
                        Data do plantão <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        min={limiteInicial}
                        max={limiteFinal}
                        value={dataSolicitado}
                        onChange={(e) => setDataSolicitado(e.target.value)}
                        className="voxx-field h-10 w-full rounded-lg px-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-bold">
                        Tipo <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={tipoSolicitado}
                        onChange={(e) => setTipoSolicitado(e.target.value)}
                        className="voxx-field h-10 w-full rounded-lg px-3"
                      >
                        <option value="">Selecione</option>
                        {TIPOS.map((tipo) => (
                          <option key={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </section>
            {mensagem && (
              <div
                className={`rounded-xl border p-3 text-center text-sm ${erroClass}`}
              >
                {mensagem}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="voxx-medical-access inline-flex h-10 items-center justify-center rounded-lg px-7 font-bold"
              >
                Enviar troca
              </button>
            </div>
          </form>
        )}
      </section>
      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />
    </main>
  );
}
