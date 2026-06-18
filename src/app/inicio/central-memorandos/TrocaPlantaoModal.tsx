"use client";

import { useEffect, useMemo, useState } from "react";

type TrocaPlantaoModalProps = {
  onClose: () => void;
  modo?: "criar" | "editar";
  registro?: any;
  onSaved?: () => void | Promise<void>;
};

type TipoPlantao = "" | "SD" | "SN" | "24 horas";

type Colaborador = {
  matricula: string;
  nome: string;
  funcao: string;
  email: string;
};

export function TrocaPlantaoModal({ onClose }: TrocaPlantaoModalProps) {
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
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  function apenasNumeros(valor: string) {
    return valor.replace(/\D/g, "").slice(0, 8);
  }

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

    if (!resposta.ok || !dados.success) {
      throw new Error(dados.error || "Não foi possível consultar a matrícula.");
    }

    if (!dados.encontrado) {
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
    setMensagemSucesso("");
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
      setErroSolicitante(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a matrícula."
      );
    } finally {
      setBuscandoSolicitante(false);
    }
  }

  async function buscarSolicitado() {
    setErroSolicitado("");
    setErroEnvio("");
    setMensagemSucesso("");
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
      setErroSolicitado(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a matrícula."
      );
    } finally {
      setBuscandoSolicitado(false);
    }
  }

  function chPlantao(tipo: TipoPlantao) {
    if (tipo === "24 horas") return 24;
    if (tipo === "SD" || tipo === "SN") return 12;
    return 0;
  }

  const matriculasIguais =
    matriculaSolicitante.length === 8 &&
    matriculaSolicitado.length === 8 &&
    matriculaSolicitante === matriculaSolicitado;

  const funcoesDiferentes =
    funcaoSolicitante.trim() !== "" &&
    funcaoSolicitado.trim() !== "" &&
    funcaoSolicitante.trim().toUpperCase() !==
      funcaoSolicitado.trim().toUpperCase();

  const cargaHorariaDiferente =
    tipoSolicitante !== "" &&
    tipoSolicitado !== "" &&
    chPlantao(tipoSolicitante) !== chPlantao(tipoSolicitado);

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
    enviando,
  ]);

  async function enviarSolicitacao() {
    setErroEnvio("");
    setMensagemSucesso("");

    if (!formularioValido) {
      setErroEnvio("Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    try {
      setEnviando(true);

      const resposta = await fetch("/api/central-memorandos/troca-plantao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

      const mensagem =
        dados.message || "Troca de plantão registrada com sucesso.";

      window.alert(mensagem);
      onClose();
    } catch (error) {
      setErroEnvio(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação."
      );
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === "Escape" && !enviando) {
        onClose();
      }
    }

    window.addEventListener("keydown", fecharComEsc);

    return () => {
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [onClose, enviando]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      onClick={() => {
        if (!enviando) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Troca de Plantão
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Preencha os dados da troca entre solicitante e solicitado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <form className="space-y-5">
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <section className="h-full rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Dados do solicitante
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Matrícula
                  </label>

                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={matriculaSolicitante}
                      onChange={(e) => {
                        setMatriculaSolicitante(apenasNumeros(e.target.value));
                        setErroSolicitante("");
                        setErroEnvio("");
                        setMensagemSucesso("");
                        limparSolicitante();
                      }}
                      placeholder="00000000"
                      className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={buscarSolicitante}
                      disabled={buscandoSolicitante || enviando}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      {buscandoSolicitante ? "Buscando..." : "Buscar"}
                    </button>
                  </div>

                  {erroSolicitante && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                      {erroSolicitante}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome
                  </label>

                  <input
                    value={nomeSolicitante}
                    readOnly
                    placeholder="Preenchido pela base de dados"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Função
                  </label>

                  <input
                    value={funcaoSolicitante}
                    readOnly
                    placeholder="Preenchida pela base de dados"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Data do plantão
                    </label>

                    <input
                      type="date"
                      value={dataSolicitante}
                      onChange={(e) => {
                        setDataSolicitante(e.target.value);
                        setErroEnvio("");
                        setMensagemSucesso("");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tipo de plantão
                    </label>

                    <select
                      value={tipoSolicitante}
                      onChange={(e) => {
                        setTipoSolicitante(e.target.value as TipoPlantao);
                        setErroEnvio("");
                        setMensagemSucesso("");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">Selecione</option>
                      <option value="SD">SD</option>
                      <option value="SN">SN</option>
                      <option value="24 horas">24 horas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={emailSolicitante}
                    onChange={(e) => {
                      setEmailSolicitante(e.target.value);
                      setErroEnvio("");
                      setMensagemSucesso("");
                    }}
                    placeholder="Preenchido pela base, mas pode ser alterado"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </section>

            <section className="h-full rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Dados do solicitado
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Matrícula
                  </label>

                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={matriculaSolicitado}
                      onChange={(e) => {
                        setMatriculaSolicitado(apenasNumeros(e.target.value));
                        setErroSolicitado("");
                        setErroEnvio("");
                        setMensagemSucesso("");
                        limparSolicitado();
                      }}
                      placeholder="00000000"
                      className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={buscarSolicitado}
                      disabled={buscandoSolicitado || enviando}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      {buscandoSolicitado ? "Buscando..." : "Buscar"}
                    </button>
                  </div>

                  {erroSolicitado && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                      {erroSolicitado}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome
                  </label>

                  <input
                    value={nomeSolicitado}
                    readOnly
                    placeholder="Preenchido pela base de dados"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Função
                  </label>

                  <input
                    value={funcaoSolicitado}
                    readOnly
                    placeholder="Preenchida pela base de dados"
                    className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Data do plantão
                    </label>

                    <input
                      type="date"
                      value={dataSolicitado}
                      onChange={(e) => {
                        setDataSolicitado(e.target.value);
                        setErroEnvio("");
                        setMensagemSucesso("");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tipo de plantão
                    </label>

                    <select
                      value={tipoSolicitado}
                      onChange={(e) => {
                        setTipoSolicitado(e.target.value as TipoPlantao);
                        setErroEnvio("");
                        setMensagemSucesso("");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">Selecione</option>
                      <option value="SD">SD</option>
                      <option value="SN">SN</option>
                      <option value="24 horas">24 horas</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {matriculasIguais && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              Solicitante e solicitado não podem ter a mesma matrícula.
            </p>
          )}

          {funcoesDiferentes && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              A troca não pode ser solicitada entre colaboradores de funções
              diferentes.
            </p>
          )}

          {cargaHorariaDiferente && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              A troca precisa respeitar a equivalência de carga horária: SD/SN
              com SD/SN, ou 24 horas com 24 horas.
            </p>
          )}

          {erroEnvio && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {erroEnvio}
            </div>
          )}

          {mensagemSucesso && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {mensagemSucesso}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={enviarSolicitacao}
              disabled={!formularioValido}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}