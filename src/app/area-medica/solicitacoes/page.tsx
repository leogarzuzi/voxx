"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
type SessaoMedica = { cpf: string; dataNascimento: string; vinculo: Vinculo };
type Filtro = "todas" | "substituicao" | "troca";
type Solicitacao = {
  id: number;
  modalidade: "substituicao" | "troca";
  protocolo: string;
  papel: string;
  outroNome: string;
  outroMatricula: string;
  dataPrincipal: string;
  tipoPrincipal: string;
  outraData?: string;
  outroTipo?: string;
  status: "recebido" | "cancelado";
  criadoEm: string;
  podeCancelar: boolean;
  emailSolicitante: string;
  emailParticipante: string;
  ladoEsquerdo: {
    rotulo: string;
    nome: string;
    matricula: string;
    data?: string;
    tipo?: string;
  };
  ladoDireito: {
    rotulo: string;
    nome: string;
    matricula: string;
    data?: string;
    tipo?: string;
  };
};

function formatarData(data: string) {
  const [ano, mes, dia] = String(data || "").split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function competenciaAtual() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

export default function MinhasSolicitacoesPage() {
  const router = useRouter();
  const { tema, temaDia, alternarTema } = useTema();
  const [sessao, setSessao] = useState<SessaoMedica | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [cancelamento, setCancelamento] = useState<Solicitacao | null>(null);
  const [reenvio, setReenvio] = useState<Solicitacao | null>(null);
  const [emailReenvioSolicitante, setEmailReenvioSolicitante] = useState("");
  const [emailReenvioParticipante, setEmailReenvioParticipante] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [erroReenvio, setErroReenvio] = useState("");
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    try {
      const valor = sessionStorage.getItem("voxx-area-medica");
      if (!valor) return;
      const dados = JSON.parse(valor) as SessaoMedica;
      if (dados?.vinculo?.id) setSessao(dados);
    } catch {
      /* sessão inválida */
    }
  }, []);

  useEffect(() => {
    if (!sessao) return;
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await fetch("/api/area-medica/solicitacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpf: sessao!.cpf,
            dataNascimento: sessao!.dataNascimento,
            vinculoId: sessao!.vinculo.id,
            competencia,
          }),
        });
        const dados = await resposta.json();
        if (!ativo) return;
        if (!resposta.ok) {
          setErro(dados.error || "Não foi possível carregar as solicitações.");
          return;
        }
        setSolicitacoes(dados.solicitacoes || []);
      } catch {
        if (ativo) setErro("Não foi possível carregar as solicitações.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [sessao, competencia]);

  const painel = temaDia
    ? "border-slate-200 bg-white/94"
    : "border-white/10 bg-[#112d49]/94";
  const suave = temaDia
    ? "border-slate-200 bg-slate-50"
    : "border-white/10 bg-white/5";
  const secundario = temaDia ? "text-slate-600" : "text-slate-300";

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

  const filtros: Array<{ id: Filtro; label: string }> = [
    { id: "todas", label: "Todas" },
    { id: "substituicao", label: "Substituições" },
    { id: "troca", label: "Trocas médicas" },
  ];
  const termo = busca.trim().toUpperCase();
  const registrosFiltrados = solicitacoes.filter(
    (item) =>
      (filtro === "todas" || item.modalidade === filtro) &&
      (!termo || item.protocolo.toUpperCase().includes(termo)),
  );

  async function cancelarSolicitacao(item: Solicitacao) {
    if (!sessao || !item.podeCancelar) return;
    const chave = `${item.modalidade}-${item.id}`;
    setCancelando(chave);
    setMensagemAcao("");
    try {
      const resposta = await fetch("/api/area-medica/solicitacoes/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: sessao.cpf,
          dataNascimento: sessao.dataNascimento,
          vinculoId: sessao.vinculo.id,
          solicitacaoId: item.id,
          modalidade: item.modalidade,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setMensagemAcao(dados.error || "Não foi possível cancelar.");
        return;
      }
      setSolicitacoes((atuais) =>
        atuais.map((registro) =>
          registro.id === item.id && registro.modalidade === item.modalidade
            ? { ...registro, status: "cancelado", podeCancelar: false }
            : registro,
        ),
      );
      setMensagemAcao(
        dados.avisoEmail
          ? `Solicitação ${item.protocolo} cancelada. ${dados.avisoEmail}`
          : `Solicitação ${item.protocolo} cancelada com sucesso.`,
      );
      setCancelamento(null);
    } catch {
      setMensagemAcao("Não foi possível cancelar esta solicitação.");
    } finally {
      setCancelando(null);
    }
  }

  function abrirReenvio(item: Solicitacao) {
    setReenvio(item);
    setEmailReenvioSolicitante(item.emailSolicitante || "");
    setEmailReenvioParticipante(item.emailParticipante || "");
    setErroReenvio("");
  }

  async function reenviarProtocolo() {
    if (!sessao || !reenvio) return;
    setReenviando(true);
    setErroReenvio("");
    try {
      const resposta = await fetch("/api/area-medica/solicitacoes/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: sessao.cpf,
          dataNascimento: sessao.dataNascimento,
          vinculoId: sessao.vinculo.id,
          solicitacaoId: reenvio.id,
          modalidade: reenvio.modalidade,
          emailSolicitante: emailReenvioSolicitante,
          emailParticipante: emailReenvioParticipante,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErroReenvio(dados.error || "Não foi possível reenviar o protocolo.");
        return;
      }
      setSolicitacoes((atuais) =>
        atuais.map((item) =>
          item.id === reenvio.id && item.modalidade === reenvio.modalidade
            ? {
                ...item,
                emailSolicitante: emailReenvioSolicitante.trim().toLowerCase(),
                emailParticipante: emailReenvioParticipante
                  .trim()
                  .toLowerCase(),
              }
            : item,
        ),
      );
      setMensagemAcao(`Protocolo ${reenvio.protocolo} reenviado com sucesso.`);
      setReenvio(null);
    } catch {
      setErroReenvio("Não foi possível reenviar o protocolo agora.");
    } finally {
      setReenviando(false);
    }
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
          <h1 className="mt-4 text-2xl font-bold">Minhas solicitações</h1>
        </header>

        <div className={`mt-7 rounded-2xl border p-5 ${suave}`}>
          <p className="font-bold">{sessao.vinculo.nome}</p>
          <p className={`mt-1 text-sm ${secundario}`}>
            Matrícula {sessao.vinculo.matricula} · {sessao.vinculo.funcao}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {filtros.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFiltro(item.id)}
                className={`h-9 rounded-lg border px-4 text-sm font-bold transition ${filtro === item.id ? "border-[var(--voxx-primary)] bg-[var(--voxx-primary)] text-white" : "voxx-button-secondary"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-40">
              <label
                htmlFor="competencia-solicitacoes"
                className="mb-1 block text-xs font-bold"
              >
                Mês e ano
              </label>
              <input
                id="competencia-solicitacoes"
                type="month"
                value={competencia}
                onChange={(evento) => setCompetencia(evento.target.value)}
                className="voxx-field h-9 w-full rounded-lg px-3 text-sm"
              />
            </div>
            <div className="w-full sm:w-64">
              <label
                htmlFor="busca-protocolo"
                className="mb-1 block text-xs font-bold"
              >
                Buscar protocolo
              </label>
              <input
                id="busca-protocolo"
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value.replace(/\s/g, "").toUpperCase())
                }
                className="voxx-field h-9 w-full rounded-lg px-3 uppercase"
                placeholder=""
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {mensagemAcao && (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm font-semibold ${temaDia ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-white/5 text-slate-200"}`}
          >
            {mensagemAcao}
          </p>
        )}

        {carregando ? (
          <div
            className={`mt-5 rounded-2xl border px-6 py-12 text-center ${suave}`}
          >
            <p className={`text-sm ${secundario}`}>
              Carregando solicitações...
            </p>
          </div>
        ) : erro ? (
          <div
            className={`mt-5 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-700`}
          >
            {erro}
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div
            className={`mt-5 rounded-2xl border px-6 py-12 text-center ${suave}`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--voxx-focus)] text-3xl text-[var(--voxx-primary)]">
              ⌕
            </div>
            <h2 className="mt-4 text-lg font-bold">
              Nenhuma solicitação encontrada
            </h2>
            <p
              className={`mx-auto mt-2 max-w-md text-sm leading-6 ${secundario}`}
            >
              Não há registros deste vínculo para os filtros informados.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {registrosFiltrados.map((item) => (
              <article
                key={`${item.modalidade}-${item.id}`}
                className={`overflow-hidden rounded-2xl border ${suave}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[var(--voxx-primary)]">
                      {item.protocolo}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${item.status === "cancelado" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {item.status === "cancelado" ? "Cancelado" : "Recebido"}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${secundario}`}
                  >
                    {item.modalidade === "substituicao"
                      ? "Substituição médica"
                      : "Troca médica"}
                  </p>
                </div>

                <div
                  className={`grid border-t sm:grid-cols-2 ${temaDia ? "border-slate-200" : "border-white/10"}`}
                >
                  {[item.ladoEsquerdo, item.ladoDireito].map((lado, indice) => (
                    <div
                      key={lado.rotulo}
                      className={`px-5 py-4 ${
                        indice === 1
                          ? temaDia
                            ? "border-t border-slate-200 sm:border-l sm:border-t-0"
                            : "border-t border-white/10 sm:border-l sm:border-t-0"
                          : ""
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--voxx-primary)]">
                        {lado.rotulo}
                      </p>
                      <p className="mt-2 font-bold leading-snug">{lado.nome}</p>
                      <p className={`mt-1 text-sm ${secundario}`}>
                        Matrícula {lado.matricula}
                      </p>
                      {((lado.data && lado.tipo) ||
                        (item.modalidade === "substituicao" &&
                          indice === 0)) && (
                        <p
                          className={`mt-3 inline-flex rounded-lg border px-3 py-2 text-xs font-bold ${temaDia ? "border-slate-200 bg-white" : "border-white/10 bg-white/5"}`}
                        >
                          {formatarData(lado.data || item.dataPrincipal)} ·{" "}
                          {lado.tipo || item.tipoPrincipal}
                        </p>
                      )}
                      {indice === 1 && (
                        <div className="mt-4 flex flex-wrap justify-start gap-2">
                          <button
                            type="button"
                            onClick={() => abrirReenvio(item)}
                            className="voxx-button-secondary h-9 rounded-lg px-4 text-xs font-bold"
                          >
                            Reenviar protocolo
                          </button>
                          {item.podeCancelar && (
                            <button
                              type="button"
                              onClick={() => setCancelamento(item)}
                              disabled={
                                cancelando === `${item.modalidade}-${item.id}`
                              }
                              className="h-9 rounded-lg border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white disabled:cursor-wait disabled:opacity-60"
                            >
                              {cancelando === `${item.modalidade}-${item.id}`
                                ? "Cancelando..."
                                : "Cancelar solicitação"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {item.podeCancelar && (
                  <p
                    className={`border-t px-5 py-3 text-xs font-semibold text-amber-700 ${temaDia ? "border-slate-200" : "border-white/10"}`}
                  >
                    Cancelamento disponível até o dia anterior ao primeiro
                    plantão.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <p className={`mt-5 text-center text-xs leading-5 ${secundario}`}>
          Solicitações futuras poderão ser canceladas até o dia anterior ao
          plantão. Registros retroativos permanecerão disponíveis apenas para
          consulta.
        </p>
      </section>
      {cancelamento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={() => !cancelando && setCancelamento(null)}
        >
          <section
            className={`w-full max-w-md rounded-[26px] border p-6 text-center shadow-2xl ${painel}`}
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold ${
                temaDia
                  ? "bg-red-50 text-red-700"
                  : "bg-red-400/10 text-red-100"
              }`}
            >
              !
            </div>
            <h2 className="mt-4 text-xl font-bold">Cancelar solicitação?</h2>
            <p className={`mt-2 text-sm leading-6 ${secundario}`}>
              Confirma o cancelamento do protocolo{" "}
              <strong>{cancelamento.protocolo}</strong>? Esta ação não poderá
              ser desfeita.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={Boolean(cancelando)}
                onClick={() => setCancelamento(null)}
                className="voxx-button-secondary h-10 rounded-lg px-5 font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={Boolean(cancelando)}
                onClick={() => cancelarSolicitacao(cancelamento)}
                className="h-10 rounded-lg bg-red-600 px-5 font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </section>
        </div>
      )}
      {reenvio && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={() => !reenviando && setReenvio(null)}
        >
          <section
            className={`w-full max-w-md rounded-[26px] border p-6 shadow-2xl ${painel}`}
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <h2 className="text-xl font-bold">Reenviar protocolo</h2>
            <p className={`mt-2 text-sm leading-6 ${secundario}`}>
              Estes são os e-mails informados no envio. Você pode corrigi-los
              antes de reenviar o protocolo <strong>{reenvio.protocolo}</strong>
              .
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold">
                  E-mail do solicitante <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={emailReenvioSolicitante}
                  onChange={(evento) =>
                    setEmailReenvioSolicitante(evento.target.value)
                  }
                  className="voxx-field h-10 w-full rounded-lg px-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold">
                  E-mail do{" "}
                  {reenvio.modalidade === "troca" ? "solicitado" : "substituto"}{" "}
                  <span className={`font-normal ${secundario}`}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="email"
                  value={emailReenvioParticipante}
                  onChange={(evento) =>
                    setEmailReenvioParticipante(evento.target.value)
                  }
                  className="voxx-field h-10 w-full rounded-lg px-3"
                />
              </div>
            </div>
            <p className={`mt-4 text-xs leading-5 ${secundario}`}>
              É permitido um reenvio a cada 2 minutos, limitado a 3 reenvios por
              protocolo em 24 horas.
            </p>
            {erroReenvio && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erroReenvio}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={reenviando}
                onClick={() => setReenvio(null)}
                className="voxx-button-secondary h-10 rounded-lg px-5 font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={reenviando || !emailReenvioSolicitante.trim()}
                onClick={reenviarProtocolo}
                className="voxx-button-primary h-10 rounded-lg px-5 font-bold disabled:opacity-50"
              >
                {reenviando ? "Reenviando..." : "Reenviar"}
              </button>
            </div>
          </section>
        </div>
      )}
      <TemaToggle tema={tema} onToggle={alternarTema} variant="login" />
    </main>
  );
}
