"use client";

import { useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type TrocaPlantaoModalProps = {
  onClose: () => void;
  modo?: "criar" | "editar";
  registro?: TrocaPlantaoEdicao | null;
  onSaved?: () => void | Promise<void>;
};

type TipoPlantao = "" | "SD" | "SN" | "24";

type TrocaPlantaoEdicao = {
  id: string;
  protocolo: string;
  matricula_solicitante: string;
  nome_solicitante: string;
  funcao_solicitante: string;
  email_solicitante?: string | null;
  data_plantao_solicitante: string;
  tipo_plantao_solicitante: string;
  matricula_solicitado: string;
  nome_solicitado: string;
  funcao_solicitado?: string | null;
  data_plantao_solicitado: string;
  tipo_plantao_solicitado: string;
};

type Colaborador = {
  matricula: string;
  nome: string;
  funcao: string;
  email: string;
};

function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 8);
}

function tipoPlantao(valor?: string | null): TipoPlantao {
  if (valor === "24 horas") return "24";
  if (valor === "SD" || valor === "SN" || valor === "24") return valor;
  return "";
}

function chPlantao(tipo: TipoPlantao) {
  if (tipo === "24") return 24;
  if (tipo === "SD" || tipo === "SN") return 12;
  return 0;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function categoriaFuncao(funcao: string) {
  const normalizada = normalizarTexto(funcao);

  if (normalizada.includes("MEDIC")) return "MEDICO";
  if (normalizada.includes("TECNIC") && normalizada.includes("ENFERM")) {
    return "TECNICO_ENFERMAGEM";
  }
  if (normalizada.includes("AUXILIAR") && normalizada.includes("ENFERM")) {
    return "AUXILIAR_ENFERMAGEM";
  }
  if (normalizada.includes("ENFERMEIR")) return "ENFERMEIRO";

  return normalizada.replace(/\s+/g, " ").trim();
}

function mesmoMes(dataA: string, dataB: string) {
  return Boolean(dataA && dataB && dataA.slice(0, 7) === dataB.slice(0, 7));
}

export function TrocaPlantaoModal({
  onClose,
  modo = "criar",
  registro,
  onSaved,
}: TrocaPlantaoModalProps) {
  const { temaDia } = useTema();
  const modoEdicao = modo === "editar" && Boolean(registro);

  const [matriculaSolicitante, setMatriculaSolicitante] = useState("");
  const [nomeSolicitante, setNomeSolicitante] = useState("");
  const [funcaoSolicitante, setFuncaoSolicitante] = useState("");
  const [dataSolicitante, setDataSolicitante] = useState("");
  const [tipoSolicitante, setTipoSolicitante] = useState<TipoPlantao>("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [erroSolicitante, setErroSolicitante] = useState("");
  const [buscandoSolicitante, setBuscandoSolicitante] = useState(false);

  const [matriculaSolicitado, setMatriculaSolicitado] = useState("");
  const [nomeSolicitado, setNomeSolicitado] = useState("");
  const [funcaoSolicitado, setFuncaoSolicitado] = useState("");
  const [dataSolicitado, setDataSolicitado] = useState("");
  const [tipoSolicitado, setTipoSolicitado] = useState<TipoPlantao>("");
  const [erroSolicitado, setErroSolicitado] = useState("");
  const [buscandoSolicitado, setBuscandoSolicitado] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [sucesso, setSucesso] = useState<{ titulo: string; protocolo?: string } | null>(null);

  const pageOverlay = temaDia
    ? "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm";
  const modalClass = temaDia
    ? "max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
    : "max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.55)]";
  const sectionClass = temaDia
    ? "h-full rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
    : "h-full rounded-[24px] border border-white/10 bg-[#202532]/65 p-5";
  const labelClass = temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-medium text-slate-300";
  const inputClass = temaDia
    ? "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
    : "mt-1 w-full rounded-xl border border-white/10 bg-[#11141b] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15";
  const readOnlyClass = temaDia
    ? "mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none"
    : "mt-1 w-full cursor-not-allowed rounded-xl border border-white/10 bg-[#11141b]/80 px-3 py-2 text-sm text-slate-400 outline-none";
  const errorClass = temaDia
    ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    : "rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100";
  const titleText = temaDia ? "text-slate-950" : "text-white";
  const mutedText = temaDia ? "text-slate-500" : "text-slate-400";

  function limparSolicitante() {
    setNomeSolicitante("");
    setFuncaoSolicitante("");
    setEmailSolicitante("");
  }

  function limparSolicitado() {
    setNomeSolicitado("");
    setFuncaoSolicitado("");
  }

  async function buscarColaborador(matricula: string) {
    const resposta = await fetch(
      `/api/central-memorandos/buscar-colaborador?matricula=${matricula}`
    );
    const dados = await resposta.json();

    if (!resposta.ok || !dados.success || !dados.encontrado) {
      throw new Error(
        dados.error ||
          "Esta matrícula não se encontra ativa na base de colaboradores. Caso a informação esteja correta, procure o RH."
      );
    }

    return dados.colaborador as Colaborador;
  }

  async function buscarSolicitante() {
    setErroSolicitante("");
    setErroEnvio("");
    limparSolicitante();

    if (matriculaSolicitante.length !== 8) {
      setErroSolicitante("Informe uma matrícula válida com 8 dígitos.");
      return;
    }

    try {
      setBuscandoSolicitante(true);
      const colaborador = await buscarColaborador(matriculaSolicitante);
      setNomeSolicitante(colaborador.nome);
      setFuncaoSolicitante(colaborador.funcao);
      setEmailSolicitante(colaborador.email);
    } catch (error) {
      setErroSolicitante(error instanceof Error ? error.message : "Não foi possível consultar a matrícula.");
    } finally {
      setBuscandoSolicitante(false);
    }
  }

  async function buscarSolicitado() {
    setErroSolicitado("");
    setErroEnvio("");
    limparSolicitado();

    if (matriculaSolicitado.length !== 8) {
      setErroSolicitado("Informe uma matrícula válida com 8 dígitos.");
      return;
    }

    try {
      setBuscandoSolicitado(true);
      const colaborador = await buscarColaborador(matriculaSolicitado);
      setNomeSolicitado(colaborador.nome);
      setFuncaoSolicitado(colaborador.funcao);
    } catch (error) {
      setErroSolicitado(error instanceof Error ? error.message : "Não foi possível consultar a matrícula.");
    } finally {
      setBuscandoSolicitado(false);
    }
  }

  const matriculasIguais =
    matriculaSolicitante.length === 8 &&
    matriculaSolicitado.length === 8 &&
    matriculaSolicitante === matriculaSolicitado;
  const funcoesDiferentes =
    funcaoSolicitante.trim() !== "" &&
    funcaoSolicitado.trim() !== "" &&
    categoriaFuncao(funcaoSolicitante) !== categoriaFuncao(funcaoSolicitado);
  const cargaHorariaDiferente =
    tipoSolicitante !== "" &&
    tipoSolicitado !== "" &&
    chPlantao(tipoSolicitante) !== chPlantao(tipoSolicitado);
  const datasMesDiferente =
    dataSolicitante !== "" && dataSolicitado !== "" && !mesmoMes(dataSolicitante, dataSolicitado);
  const mesmoDiaMesmoTipo =
    dataSolicitante !== "" &&
    dataSolicitado !== "" &&
    tipoSolicitante !== "" &&
    tipoSolicitado !== "" &&
    dataSolicitante === dataSolicitado &&
    tipoSolicitante === tipoSolicitado;

  const formularioValido = useMemo(() => {
    return (
      matriculaSolicitante.length === 8 &&
      nomeSolicitante.trim() !== "" &&
      funcaoSolicitante.trim() !== "" &&
      dataSolicitante !== "" &&
      tipoSolicitante !== "" &&
      emailSolicitante.trim() !== "" &&
      matriculaSolicitado.length === 8 &&
      nomeSolicitado.trim() !== "" &&
      funcaoSolicitado.trim() !== "" &&
      dataSolicitado !== "" &&
      tipoSolicitado !== "" &&
      !matriculasIguais &&
      !funcoesDiferentes &&
      !cargaHorariaDiferente &&
      !datasMesDiferente &&
      !mesmoDiaMesmoTipo &&
      !enviando
    );
  }, [
    matriculaSolicitante,
    nomeSolicitante,
    funcaoSolicitante,
    dataSolicitante,
    tipoSolicitante,
    emailSolicitante,
    matriculaSolicitado,
    nomeSolicitado,
    funcaoSolicitado,
    dataSolicitado,
    tipoSolicitado,
    matriculasIguais,
    funcoesDiferentes,
    cargaHorariaDiferente,
    datasMesDiferente,
    mesmoDiaMesmoTipo,
    enviando,
  ]);

  async function enviarSolicitacao() {
    setErroEnvio("");

    if (!formularioValido) {
      setErroEnvio("Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    try {
      setEnviando(true);
      const resposta = await fetch("/api/central-memorandos/troca-plantao", {
        method: modoEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: registro?.id,
          matricula_solicitante: matriculaSolicitante,
          email_solicitante: emailSolicitante,
          data_plantao_solicitante: dataSolicitante,
          tipo_plantao_solicitante: tipoSolicitante,
          matricula_solicitado: matriculaSolicitado,
          data_plantao_solicitado: dataSolicitado,
          tipo_plantao_solicitado: tipoSolicitado,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Não foi possível enviar a solicitação.");
      }

      setSucesso({
        titulo: modoEdicao ? "Troca alterada com sucesso" : "Solicitação enviada com sucesso",
        protocolo: dados.troca?.protocolo || registro?.protocolo,
      });
    } catch (error) {
      setErroEnvio(error instanceof Error ? error.message : "Não foi possível enviar a solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  async function fecharSucesso() {
    if (onSaved) await onSaved();
    else onClose();
  }

  useEffect(() => {
    if (!modoEdicao || !registro) return;
    setMatriculaSolicitante(registro.matricula_solicitante || "");
    setNomeSolicitante(registro.nome_solicitante || "");
    setFuncaoSolicitante(registro.funcao_solicitante || "");
    setEmailSolicitante(registro.email_solicitante || "");
    setDataSolicitante(registro.data_plantao_solicitante || "");
    setTipoSolicitante(tipoPlantao(registro.tipo_plantao_solicitante));
    setMatriculaSolicitado(registro.matricula_solicitado || "");
    setNomeSolicitado(registro.nome_solicitado || "");
    setFuncaoSolicitado(registro.funcao_solicitado || "");
    setDataSolicitado(registro.data_plantao_solicitado || "");
    setTipoSolicitado(tipoPlantao(registro.tipo_plantao_solicitado));
  }, [modoEdicao, registro]);

  useEffect(() => {
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === "Escape" && !enviando) onClose();
    }

    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [onClose, enviando]);

  return (
    <div className={pageOverlay} onMouseDown={() => !enviando && onClose()}>
      <div className={modalClass} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${mutedText}`}>Central de Memorandos</p>
            <h2 className={`mt-2 text-2xl font-bold ${titleText}`}>
              {modoEdicao ? "Alterar troca de plantão" : "Troca de plantão"}
            </h2>
            <p className={`mt-1 text-sm ${mutedText}`}>Preencha os dados da troca entre solicitante e solicitado.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className={temaDia ? "rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" : "rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"}
            aria-label="Fechar modal"
          >
            X
          </button>
        </div>

        <form className="space-y-5">
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <section className={sectionClass}>
              <h3 className={`text-base font-semibold ${titleText}`}>Plantão original</h3>
              <p className={`mt-1 text-xs ${mutedText}`}>Colaborador que está solicitando a troca.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>Matrícula</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={matriculaSolicitante}
                      onChange={(e) => {
                        setMatriculaSolicitante(apenasNumeros(e.target.value));
                        setErroSolicitante("");
                        setErroEnvio("");
                        limparSolicitante();
                      }}
                      readOnly={modoEdicao}
                      placeholder="00000000"
                      className={modoEdicao ? "w-32 " + readOnlyClass.replace("mt-1 ", "") : "w-32 " + inputClass.replace("mt-1 ", "")}
                    />
                    {!modoEdicao && (
                      <button type="button" onClick={buscarSolicitante} disabled={buscandoSolicitante || enviando} className={temaDia ? "rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50" : "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"}>
                        {buscandoSolicitante ? "Buscando..." : "Buscar"}
                      </button>
                    )}
                  </div>
                  {erroSolicitante && <div className={`mt-3 ${errorClass}`}>{erroSolicitante}</div>}
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                  <div>
                    <label className={labelClass}>Nome</label>
                    <input value={nomeSolicitante} readOnly placeholder="Preenchido pela base" className={readOnlyClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Função</label>
                    <input value={funcaoSolicitante} readOnly placeholder="Preenchida pela base" className={readOnlyClass} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Data original</label>
                    <input type="date" value={dataSolicitante} onChange={(e) => setDataSolicitante(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo original</label>
                    <select value={tipoSolicitante} onChange={(e) => setTipoSolicitante(e.target.value as TipoPlantao)} className={inputClass}>
                      <option value="">Selecione</option>
                      <option value="SD">SD</option>
                      <option value="SN">SN</option>
                      <option value="24">24</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={emailSolicitante} onChange={(e) => setEmailSolicitante(e.target.value.toLowerCase())} placeholder="email@exemplo.com" className={inputClass} />
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <h3 className={`text-base font-semibold ${titleText}`}>Novo plantão</h3>
              <p className={`mt-1 text-xs ${mutedText}`}>Colaborador que fará a troca.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>Matrícula</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={matriculaSolicitado}
                      onChange={(e) => {
                        setMatriculaSolicitado(apenasNumeros(e.target.value));
                        setErroSolicitado("");
                        setErroEnvio("");
                        limparSolicitado();
                      }}
                      readOnly={modoEdicao}
                      placeholder="00000000"
                      className={modoEdicao ? "w-32 " + readOnlyClass.replace("mt-1 ", "") : "w-32 " + inputClass.replace("mt-1 ", "")}
                    />
                    {!modoEdicao && (
                      <button type="button" onClick={buscarSolicitado} disabled={buscandoSolicitado || enviando} className={temaDia ? "rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50" : "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"}>
                        {buscandoSolicitado ? "Buscando..." : "Buscar"}
                      </button>
                    )}
                  </div>
                  {erroSolicitado && <div className={`mt-3 ${errorClass}`}>{erroSolicitado}</div>}
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                  <div>
                    <label className={labelClass}>Nome</label>
                    <input value={nomeSolicitado} readOnly placeholder="Preenchido pela base" className={readOnlyClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Função</label>
                    <input value={funcaoSolicitado} readOnly placeholder="Preenchida pela base" className={readOnlyClass} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nova data</label>
                    <input type="date" value={dataSolicitado} onChange={(e) => setDataSolicitado(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Novo tipo</label>
                    <select value={tipoSolicitado} onChange={(e) => setTipoSolicitado(e.target.value as TipoPlantao)} className={inputClass}>
                      <option value="">Selecione</option>
                      <option value="SD">SD</option>
                      <option value="SN">SN</option>
                      <option value="24">24</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {matriculasIguais && <p className={errorClass}>Solicitante e solicitado não podem ter a mesma matrícula.</p>}
          {funcoesDiferentes && <p className={errorClass}>A troca não pode ser solicitada entre colaboradores de funções diferentes.</p>}
          {cargaHorariaDiferente && <p className={errorClass}>A troca precisa respeitar a equivalência de carga horária: SD/SN com SD/SN, ou 24 com 24.</p>}
          {datasMesDiferente && <p className={errorClass}>A troca precisa acontecer dentro do mesmo mês de referência.</p>}
          {mesmoDiaMesmoTipo && <p className={errorClass}>No mesmo dia, o tipo de plantão precisa ser diferente.</p>}
          {erroEnvio && <div className={errorClass}>{erroEnvio}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={enviando} className={temaDia ? "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" : "rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"}>
              Fechar
            </button>
            <button type="button" onClick={enviarSolicitacao} disabled={!formularioValido} className={temaDia ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" : "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"}>
              {enviando ? "Enviando..." : modoEdicao ? "Salvar alteração" : "Confirmar solicitação"}
            </button>
          </div>
        </form>
      </div>

      {sucesso && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm" onMouseDown={(event) => event.stopPropagation()}>
          <div className={temaDia ? "w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.18)]" : "w-full max-w-sm rounded-[28px] border border-white/10 bg-[#171a23] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.55)]"}>
            <div className={temaDia ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-700" : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl font-bold text-emerald-100"}>✓</div>
            <h3 className={`mt-4 text-xl font-bold ${titleText}`}>{sucesso.titulo}</h3>
            {sucesso.protocolo && <p className={`mt-2 text-sm ${mutedText}`}>Protocolo <span className={titleText}>{sucesso.protocolo}</span></p>}
            <button type="button" onClick={fecharSucesso} className={temaDia ? "mt-6 rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" : "mt-6 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
