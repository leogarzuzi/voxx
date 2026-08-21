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
type Substituto = {
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
  const sugestao = DOMINIOS_COM_ERRO[dominio];
  return sugestao
    ? `O domínio “${dominio}” parece incorreto. Você quis dizer “${sugestao}”?`
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
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarFuncao(valor: string | undefined) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export default function SubstituicaoMedicaPage() {
  const router = useRouter();
  const { tema, temaDia, alternarTema } = useTema();
  const [sessao, setSessao] = useState<SessaoMedica | null>(null);
  const [email, setEmail] = useState("");
  const [dataPlantao, setDataPlantao] = useState("");
  const [tipoPlantao, setTipoPlantao] = useState("");
  const [matriculaSubstituto, setMatriculaSubstituto] = useState("");
  const [substituto, setSubstituto] = useState<Substituto | null>(null);
  const [erroEmail, setErroEmail] = useState("");
  const [emailSubstituto, setEmailSubstituto] = useState("");
  const [erroEmailSubstituto, setErroEmailSubstituto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [avisoEmail, setAvisoEmail] = useState("");

  useEffect(() => {
    try {
      const valor = window.sessionStorage.getItem("voxx-area-medica");
      if (!valor) return;
      const dados = JSON.parse(valor) as SessaoMedica;
      if (!dados?.vinculo?.id) return;
      setSessao(dados);
      setEmail(dados.vinculo.email || "");
    } catch {
      /* sessão inválida será tratada na tela */
    }
  }, []);

  const competencia = useMemo(() => competenciaAtual(), []);
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = String(new Date(ano, mes, 0).getDate()).padStart(2, "0");
  const dataMinima = `${competencia}-01`;
  const dataMaxima = `${competencia}-${ultimoDia}`;
  const painel = temaDia
    ? "border-slate-200 bg-white/94"
    : "border-white/10 bg-[#112d49]/94";
  const suave = temaDia
    ? "border-slate-200 bg-slate-50"
    : "border-white/10 bg-white/5";
  const secundario = temaDia ? "text-slate-600" : "text-slate-300";
  const erroClass = temaDia
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-red-300/20 bg-red-400/10 text-red-100";
  const funcoesDiferentes = Boolean(
    substituto &&
      normalizarFuncao(sessao?.vinculo.funcao) !==
        normalizarFuncao(substituto.funcao),
  );

  function alterarMatricula(valor: string) {
    setMatriculaSubstituto(valor.replace(/\D/g, "").slice(0, 8));
    setSubstituto(null);
    setEmailSubstituto("");
    setErroEmailSubstituto("");
    setMensagem("");
  }

  async function buscarSubstituto() {
    if (!sessao || matriculaSubstituto.length !== 8) {
      setMensagem("Informe os 8 dígitos da matrícula do médico substituto.");
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
          matricula: matriculaSubstituto,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setMensagem(dados.error || "Médico não encontrado.");
        return;
      }
      setSubstituto(dados.substituto);
      setEmailSubstituto(dados.substituto.email || "");
    } catch {
      setMensagem("Não foi possível consultar a matrícula agora.");
    } finally {
      setBuscando(false);
    }
  }

  function revisar(event: React.FormEvent) {
    event.preventDefault();
    const erro = validarEmail(email);
    const erroSubstituto = validarEmailOpcional(emailSubstituto);
    setErroEmail(erro);
    setErroEmailSubstituto(erroSubstituto);
    if (erro || erroSubstituto) return;
    if (!dataPlantao || !tipoPlantao || !substituto) {
      setMensagem(
        "Preencha os dados do plantão e localize o médico substituto.",
      );
      return;
    }
    if (dataPlantao.slice(0, 7) !== competencia) {
      setMensagem(
        `A data do plantão deve pertencer ao mês vigente (${String(mes).padStart(2, "0")}/${ano}). Escolha uma data entre ${formatarData(dataMinima)} e ${formatarData(dataMaxima)}.`,
      );
      return;
    }
    setMensagem("");
    setRevisando(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmar() {
    if (!sessao || !substituto || !aceitouTermos) return;
    setSalvando(true);
    setMensagem("");
    try {
      const resposta = await fetch("/api/area-medica/substituicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: sessao.cpf,
          dataNascimento: sessao.dataNascimento,
          solicitanteId: sessao.vinculo.id,
          substitutoId: substituto.id,
          email,
          emailSubstituto,
          dataPlantao,
          tipoPlantao,
          aceitouTermos,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setMensagem(
          dados.error || "Não foi possível registrar a substituição.",
        );
        return;
      }
      setProtocolo(dados.substituicao.protocolo);
      setAvisoEmail(dados.avisoEmail || "");
    } catch {
      setMensagem("Não foi possível registrar a substituição agora.");
    } finally {
      setSalvando(false);
    }
  }

  if (!sessao) {
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
  }

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
          <h1 className="mt-4 text-2xl font-bold">Substituição médica</h1>
        </header>

        {protocolo ? (
          <div className="mx-auto mt-8 max-w-lg text-center">
            <div
              className={`rounded-2xl border p-7 ${temaDia ? "border-emerald-200 bg-emerald-50" : "border-emerald-300/20 bg-emerald-400/10"}`}
            >
              <div className="text-4xl">✓</div>
              <h2 className="mt-4 text-xl font-bold">
                Substituição registrada
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
                  {email.trim().toLowerCase()}
                </p>
              </div>
              <div className={`rounded-2xl border p-5 ${suave}`}>
                <p className={`text-xs font-bold uppercase ${secundario}`}>
                  Médico substituto
                </p>
                <p className="mt-2 font-bold">{substituto?.nome}</p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {substituto?.matricula} · {substituto?.funcao}
                </p>
                <p className={`mt-1 text-sm ${secundario}`}>
                  {emailSubstituto.trim().toLowerCase() ||
                    "E-mail não informado"}
                </p>
              </div>
            </div>
            <div className={`mt-4 rounded-2xl border p-5 ${suave}`}>
              <p className={`text-xs font-bold uppercase ${secundario}`}>
                Plantão
              </p>
              <p className="mt-2 font-bold">
                {formatarData(dataPlantao)} · {tipoPlantao}
              </p>
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
                declaro estar ciente de que esta substituição será realizada
                por um médico de função ou especialidade diferente da minha.
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
                  o limite máximo de substituições corresponde a 25% da minha
                  carga horária mensal. Substituições acima desse limite
                  dependerão de autorização expressa da Coordenação, formalizada
                  e encaminhada ao RH por meio de memorando;
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
            {mensagem && (
              <div
                className={`mt-4 rounded-xl border p-3 text-center text-sm ${erroClass}`}
              >
                {mensagem}
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setRevisando(false);
                  setAceitouTermos(false);
                  setMensagem("");
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
                {salvando ? "Registrando..." : "Confirmar substituição"}
              </button>
            </div>
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
                className={`mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3 ${temaDia ? "border-slate-200" : "border-white/10"}`}
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
                    min={dataMinima}
                    max={dataMaxima}
                    value={dataPlantao}
                    onChange={(e) => setDataPlantao(e.target.value)}
                    className="voxx-field h-10 w-full rounded-lg px-3"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={tipoPlantao}
                    onChange={(e) => setTipoPlantao(e.target.value)}
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
              <h2 className="font-bold">Médico substituto</h2>
              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="matricula-substituto"
              >
                Matrícula do médico substituto{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  id="matricula-substituto"
                  required
                  inputMode="numeric"
                  maxLength={8}
                  value={matriculaSubstituto}
                  onChange={(e) => alterarMatricula(e.target.value)}
                  className="voxx-field h-10 w-36 max-w-full flex-none rounded-lg px-3 tracking-wider"
                  placeholder="00000000"
                />
                <button
                  type="button"
                  onClick={buscarSubstituto}
                  disabled={buscando || matriculaSubstituto.length !== 8}
                  className="voxx-button-secondary h-10 rounded-lg px-5 font-bold"
                >
                  {buscando ? "Buscando..." : "Buscar matrícula"}
                </button>
              </div>
              {substituto && (
                <div
                  className={`mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 ${temaDia ? "border-slate-200" : "border-white/10"}`}
                >
                  <div className="sm:col-span-2">
                    <p className={`text-xs font-semibold ${secundario}`}>
                      Nome
                    </p>
                    <p className="mt-1 font-bold">{substituto.nome}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${secundario}`}>
                      Matrícula
                    </p>
                    <p className="mt-1 font-bold">{substituto.matricula}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${secundario}`}>
                      Função
                    </p>
                    <p className="mt-1 font-bold">{substituto.funcao}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-bold">
                      E-mail do médico substituto{" "}
                      <span className={`font-normal ${secundario}`}>
                        (opcional)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={emailSubstituto}
                      onChange={(e) => {
                        setEmailSubstituto(e.target.value);
                        setErroEmailSubstituto("");
                      }}
                      onBlur={() => {
                        setEmailSubstituto((valor) =>
                          valor.trim().toLowerCase(),
                        );
                        setErroEmailSubstituto(
                          validarEmailOpcional(emailSubstituto),
                        );
                      }}
                      className="voxx-field h-10 w-full rounded-lg px-3"
                      placeholder="nome@dominio.com"
                    />
                    {erroEmailSubstituto && (
                      <p className="mt-2 text-sm text-red-600">
                        {erroEmailSubstituto}
                      </p>
                    )}
                  </div>
                </div>
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
                Revisar substituição
              </button>
            </div>
          </form>
        )}
      </section>
      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />
    </main>
  );
}
