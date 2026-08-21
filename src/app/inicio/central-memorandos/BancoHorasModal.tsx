"use client";

import { useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type Colaborador = {
  matricula: string;
  nome: string;
  funcao: string;
  email: string;
};

type TipoPlantao = "" | "SD" | "SN" | "24";

type BancoHorasRegistro = {
  id: string;
  protocolo: string;
  matricula: string;
  nome: string;
  funcao: string;
  email?: string | null;
  data_plantao_original: string;
  tipo_plantao_original: string;
  data_novo_plantao: string;
  tipo_novo_plantao: string;
};

type BancoHorasModalProps = {
  onClose: () => void;
  modo?: "criar" | "editar";
  registro?: BancoHorasRegistro | null;
  onSaved?: () => void | Promise<void>;
};

function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 8);
}

function tipoPlantao(valor?: string | null): TipoPlantao {
  if (valor === "24 horas") return "24";
  if (valor === "SD" || valor === "SN" || valor === "24") return valor;
  return "";
}

export function BancoHorasModal({ onClose, modo = "criar", registro, onSaved }: BancoHorasModalProps) {
  const { temaDia } = useTema();
  const modoEdicao = modo === "editar" && Boolean(registro);
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [email, setEmail] = useState("");
  const [dataOriginal, setDataOriginal] = useState("");
  const [tipoOriginal, setTipoOriginal] = useState<TipoPlantao>("");
  const [dataReposicao, setDataReposicao] = useState("");
  const [tipoReposicao, setTipoReposicao] = useState<TipoPlantao>("");
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<{
    protocolo: string;
    aviso?: string | null;
  } | null>(null);

  const overlayClass = "fixed inset-0 z-50 flex items-center justify-center bg-[var(--voxx-overlay)] px-4 backdrop-blur-sm";
  const modalClass = "voxx-surface-raised voxx-scrollbar max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[30px] p-6";
  const labelClass = "voxx-text-primary text-sm font-semibold";
  const inputClass = "voxx-field mt-1 w-full rounded-xl px-3 py-2 text-sm";
  const readOnlyClass = "voxx-field mt-1 w-full cursor-not-allowed rounded-xl px-3 py-2 text-sm opacity-70";
  const errorClass = temaDia
    ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    : "rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100";
  const titleText = "voxx-text-primary";
  const mutedText = "voxx-text-muted";
  const cargaHorariaDiferente =
    tipoOriginal !== "" &&
    tipoReposicao !== "" &&
    (tipoOriginal === "24") !== (tipoReposicao === "24");

  const formularioValido = useMemo(() => {
    return (
      matricula.length === 8 &&
      nome.trim() !== "" &&
      funcao.trim() !== "" &&
      dataOriginal !== "" &&
      tipoOriginal !== "" &&
      dataReposicao !== "" &&
      tipoReposicao !== "" &&
      email.trim() !== "" &&
      !cargaHorariaDiferente &&
      !enviando
    );
  }, [matricula, nome, funcao, dataOriginal, tipoOriginal, dataReposicao, tipoReposicao, email, cargaHorariaDiferente, enviando]);

  function limparColaborador() {
    setNome("");
    setFuncao("");
    setEmail("");
  }

  async function buscarColaborador() {
    setErro("");
    limparColaborador();

    if (matricula.length !== 8) {
      setErro("Informe uma matrícula válida com 8 dígitos.");
      return;
    }

    try {
      setBuscando(true);
      const resposta = await fetch(`/api/central-memorandos/buscar-colaborador?matricula=${matricula}`);
      const dados = await resposta.json();

      if (!resposta.ok || !dados.success || !dados.encontrado) {
        throw new Error(dados.error || "Colaborador não encontrado na base ativa.");
      }

      const colaborador = dados.colaborador as Colaborador;
      setNome(colaborador.nome || "");
      setFuncao(colaborador.funcao || "");
      setEmail((colaborador.email || "").toLowerCase());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível consultar a matrícula.");
    } finally {
      setBuscando(false);
    }
  }

  async function confirmarSolicitacao() {
    setErro("");

    if (!formularioValido) {
      setErro("Preencha todos os campos obrigatórios antes de confirmar.");
      return;
    }

    try {
      setEnviando(true);
      const resposta = await fetch("/api/central-memorandos/banco-horas", {
        method: modoEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: registro?.id,
          matricula,
          email,
          data_plantao_original: dataOriginal,
          tipo_plantao_original: tipoOriginal,
          data_novo_plantao: dataReposicao,
          tipo_novo_plantao: tipoReposicao,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados.error || "Não foi possível confirmar a solicitação.");
      }

      setSucesso({
        protocolo: dados.bancoHoras?.protocolo || registro?.protocolo || "-",
        aviso: dados.avisoEmail,
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível confirmar a solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    if (!modoEdicao || !registro) return;
    setMatricula(registro.matricula || "");
    setNome(registro.nome || "");
    setFuncao(registro.funcao || "");
    setEmail((registro.email || "").toLowerCase());
    setDataOriginal(registro.data_plantao_original || "");
    setTipoOriginal(tipoPlantao(registro.tipo_plantao_original));
    setDataReposicao(registro.data_novo_plantao || "");
    setTipoReposicao(tipoPlantao(registro.tipo_novo_plantao));
  }, [modoEdicao, registro]);

  useEffect(() => {
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === "Escape" && !enviando) onClose();
    }

    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [onClose, enviando]);

  return (
    <div className={overlayClass} onMouseDown={() => !enviando && onClose()}>
      <div className={modalClass} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${mutedText}`}>Central de Memorandos</p>
            <h2 className={`mt-2 text-2xl font-bold ${titleText}`}>{modoEdicao ? "Alterar banco de horas" : "Banco de horas"}</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>Solicitação simples de compensação de plantão.</p>
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
          <section className="voxx-surface rounded-[24px] p-5">
            <h3 className={`text-base font-semibold ${titleText}`}>Dados do solicitante</h3>
            <p className={`mt-1 text-xs ${mutedText}`}>Informe a matrícula para preencher nome e função pela base.</p>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[220px_1.4fr_1fr]">
                <div>
                  <label className={labelClass}>Matrícula</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={matricula}
                      onChange={(e) => {
                        setMatricula(apenasNumeros(e.target.value));
                        setErro("");
                        limparColaborador();
                      }}
                      placeholder="00000000"
                      readOnly={modoEdicao}
                      className={"w-32 " + (modoEdicao ? readOnlyClass : inputClass).replace("mt-1 ", "")}
                    />
                    <button
                      type="button"
                      onClick={buscarColaborador}
                      disabled={buscando || enviando}
                      className="voxx-button-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {buscando ? "Buscando..." : "Buscar"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nome</label>
                  <input value={nome} readOnly placeholder="Preenchido pela base" className={readOnlyClass} />
                </div>

                <div>
                  <label className={labelClass}>Função</label>
                  <input value={funcao} readOnly placeholder="Preenchida pela base" className={readOnlyClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} placeholder="email@exemplo.com" className={inputClass} />
              </div>
            </div>
          </section>

          <section className="voxx-surface rounded-[24px] p-5">
            <h3 className={`text-base font-semibold ${titleText}`}>Plantão original</h3>
            <p className={`mt-1 text-xs ${mutedText}`}>Plantão que será compensado no banco de horas.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-[220px_180px]">
              <div>
                <label className={labelClass}>Data original</label>
                <input type="date" value={dataOriginal} onChange={(e) => setDataOriginal(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tipo original</label>
                <select value={tipoOriginal} onChange={(e) => setTipoOriginal(e.target.value as TipoPlantao)} className={inputClass}>
                  <option value="">Selecione</option>
                  <option value="SD">SD</option>
                  <option value="SN">SN</option>
                  <option value="24">24</option>
                </select>
              </div>
            </div>
          </section>

          <section className="voxx-surface rounded-[24px] p-5">
            <h3 className={`text-base font-semibold ${titleText}`}>Novo plantão</h3>
            <p className={`mt-1 text-xs ${mutedText}`}>Nova data em que o colaborador fará a compensação.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-[220px_180px]">
              <div>
                <label className={labelClass}>Nova data</label>
                <input type="date" value={dataReposicao} onChange={(e) => setDataReposicao(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Novo tipo</label>
                <select value={tipoReposicao} onChange={(e) => setTipoReposicao(e.target.value as TipoPlantao)} className={inputClass}>
                  <option value="">Selecione</option>
                  <option value="SD" disabled={tipoOriginal === "24"}>SD</option>
                  <option value="SN" disabled={tipoOriginal === "24"}>SN</option>
                  <option value="24" disabled={tipoOriginal === "SD" || tipoOriginal === "SN"}>24</option>
                </select>
              </div>
            </div>
          </section>
          {cargaHorariaDiferente && (
            <div className={errorClass}>
              O banco de horas precisa respeitar a equivalência: SD/SN com SD/SN, ou 24 com 24.
            </div>
          )}
          {erro && <div className={errorClass}>{erro}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={enviando} className="voxx-button-secondary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Fechar
            </button>
            <button type="button" onClick={confirmarSolicitacao} disabled={!formularioValido} className="voxx-button-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? "Confirmando..." : modoEdicao ? "Salvar alteração" : "Confirmar solicitação"}
            </button>
          </div>
        </form>
      </div>

      {sucesso && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm" onMouseDown={(event) => event.stopPropagation()}>
          <div className={temaDia ? "w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.18)]" : "w-full max-w-sm rounded-[28px] border border-white/10 bg-[#171a23] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.55)]"}>
            <div className={temaDia ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-700" : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl font-bold text-emerald-100"}>✓</div>
            <h3 className={`mt-4 text-xl font-bold ${titleText}`}>{modoEdicao ? "Alteração salva" : "Solicitação confirmada"}</h3>
            <p className={`mt-2 text-sm ${mutedText}`}>Protocolo <span className={titleText}>{sucesso.protocolo}</span></p>
            {sucesso.aviso && <p className={`mt-3 ${errorClass}`}>{sucesso.aviso}</p>}
            <button type="button" onClick={async () => { if (onSaved) await onSaved(); else onClose(); }} className={temaDia ? "mt-6 rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" : "mt-6 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}








