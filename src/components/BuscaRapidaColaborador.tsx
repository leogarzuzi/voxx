"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DadosPrincipais = {
  nome: string | null;
  Matrícula: string | null;
  cpf: string | null;
  cargo: string | null;
  cargaHoraria: string | null;
  Admissão: string | null;
  statusAtual: string | null;
};

type Registrohistórico = {
  id: string;
  módulo: string;
  titulo: string;
  descricao: string;
  data: string | null;
  status?: string | null;
};

type ResultadoConsulta = {
  encontrado: boolean;
  dadosPrincipais: DadosPrincipais | null;
  histórico: Record<string, Registrohistórico[]>;
};

function texto(valor: string | null | undefined) {
  return valor && String(valor).trim() ? valor : "-";
}

function formatarData(valor: string | null | undefined) {
  if (!valor) return "-";

  const textoData = String(valor).trim();
  const apenasData = textoData.split("T")[0];

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(textoData)) return textoData;

  if (/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) {
    const [ano, mes, dia] = apenasData.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return textoData;
}

function formatarNomemódulo(chave: string) {
  const mapa: Record<string, string> = {
    colaboradores: "Base de colaboradores",
    gestaoRh: "Gestão e RH",
    admissoes: "Admissões",
    desligamentos: "Desligamentos",
    transferencias: "Transferências",
    permutas: "Permutas",
    atestados: "Atestados",
  };

  return mapa[chave] || chave;
}

type BuscaRapidaColaboradorProps = {
  tema?: "dia" | "noite";
};

export function BuscaRapidaColaborador({ tema = "noite" }: BuscaRapidaColaboradorProps) {
  const temaDia = tema === "dia";
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);

  function fecharModal() {
    setModalAberto(false);
    setLoading(false);
  }

  useEffect(() => {
    if (!modalAberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        fecharModal();
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [modalAberto]);

  async function pesquisar(e: FormEvent) {
    e.preventDefault();

    const termo = busca.trim();

    if (termo.length < 2) {
      setErro("Digite pelo menos 2 caracteres.");
      setResultado(null);
      setModalAberto(true);
      return;
    }

    setErro("");
    setResultado(null);
    setLoading(true);
    setModalAberto(true);

    try {
      const response = await fetch(
        `/api/consulta-colaborador?busca=${encodeURIComponent(termo)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        setErro(data.error || "Não foi possível consultar o colaborador.");
        setResultado(null);
        setLoading(false);
        return;
      }

      setResultado({
        encontrado: Boolean(data.encontrado),
        dadosPrincipais: data.dadosPrincipais ?? null,
        histórico: data.histórico ?? {},
      });
    } catch {
      setErro("Não foi possível consultar o colaborador.");
      setResultado(null);
    } finally {
      setLoading(false);
    }
  }

  const módulos = resultado
    ? Object.entries(resultado.histórico).filter(
        ([, registros]) => registros.length > 0
      )
    : [];

  const painelClass = temaDia
    ? "border-slate-200 bg-white text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
    : "border-white/10 bg-[#171b24] text-white shadow-[0_30px_90px_rgba(0,0,0,0.58)]";
  const cardClass = temaDia
    ? "border-slate-200 bg-slate-50/80"
    : "border-white/10 bg-white/[0.045]";
  const textoSecundarioClass = temaDia ? "text-slate-500" : "text-slate-400";

  return (
    <>
      <form onSubmit={pesquisar} className="px-4 pb-3">
        <label className="relative block">
          <button
            type="submit"
            className={
              temaDia
                ? "absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                : "absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
            }
            aria-label="Buscar colaborador"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m20 20-3.5-3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar colaborador..."
            className={
              temaDia
                ? "h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 shadow-[0_10px_22px_rgba(15,23,42,0.06)] outline-none placeholder:text-slate-400 transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-11 pr-3 text-sm text-white shadow-inner shadow-black/10 outline-none placeholder:text-slate-500 transition focus:border-white/30 focus:bg-white/[0.1] focus:ring-2 focus:ring-blue-300/10"
            }
          />
        </label>
      </form>

      {modalAberto &&
        createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 px-3 py-5 backdrop-blur-sm sm:px-6"
          onMouseDown={fecharModal}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-busca-colaborador"
            className={`voxx-scrollbar max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[26px] border ${painelClass}`}
          >
            <div
              className={`sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-5 backdrop-blur-xl sm:px-7 ${
                temaDia
                  ? "border-slate-200 bg-white/95"
                  : "border-white/10 bg-[#171b24]/95"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                    temaDia
                      ? "border-slate-200 bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                      : "border-white/10 bg-white text-slate-950 shadow-lg shadow-black/30"
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 id="titulo-busca-colaborador" className="text-lg font-bold tracking-normal sm:text-xl">
                    Busca de colaborador
                  </h3>
                  <p className={`mt-0.5 truncate text-sm ${textoSecundarioClass}`}>
                    Resultado para &quot;{busca.trim()}&quot;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm transition ${
                  temaDia
                    ? "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-950 hover:text-white"
                    : "border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white hover:text-slate-950"
                }`}
                aria-label="Fechar busca"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-7">
              {loading && (
                <div className={`flex min-h-44 flex-col items-center justify-center rounded-2xl border px-4 text-center ${cardClass}`}>
                  <span className={`h-9 w-9 animate-spin rounded-full border-2 border-t-transparent ${temaDia ? "border-slate-900" : "border-white"}`} />
                  <p className="mt-4 text-sm font-semibold">Consultando histórico do colaborador...</p>
                  <p className={`mt-1 text-xs ${textoSecundarioClass}`}>Reunindo os registros disponíveis no VOXX.</p>
                </div>
              )}

              {!loading && erro && (
                <div className={`rounded-2xl border px-4 py-5 text-sm font-medium ${temaDia ? "border-red-200 bg-red-50 text-red-700" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
                  {erro}
                </div>
              )}

              {!loading && resultado && !resultado.encontrado && (
                <div className={`flex min-h-44 flex-col items-center justify-center rounded-2xl border px-4 text-center ${cardClass}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${temaDia ? "bg-slate-200 text-slate-600" : "bg-white/10 text-slate-300"}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p className="mt-4 text-sm font-semibold">Nenhum colaborador encontrado</p>
                  <p className={`mt-1 text-xs ${textoSecundarioClass}`}>Confira a matrícula, o CPF ou o nome pesquisado.</p>
                </div>
              )}

              {!loading && resultado?.encontrado && (
                <>
                  <section className={`rounded-2xl border p-5 ${cardClass}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${textoSecundarioClass}`}>Dados principais</p>
                        <h4 className="mt-1 text-lg font-bold">{texto(resultado.dadosPrincipais?.nome)}</h4>
                      </div>
                      {resultado.dadosPrincipais?.statusAtual && (
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${temaDia ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>
                          {resultado.dadosPrincipais.statusAtual}
                        </span>
                      )}
                    </div>

                    <div className={`mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t pt-5 text-sm sm:grid-cols-3 ${temaDia ? "border-slate-200" : "border-white/10"}`}>
                      {[
                        ["Matrícula", texto(resultado.dadosPrincipais?.Matrícula)],
                        ["CPF", texto(resultado.dadosPrincipais?.cpf)],
                        ["Cargo", texto(resultado.dadosPrincipais?.cargo)],
                        ["Carga horária", texto(resultado.dadosPrincipais?.cargaHoraria)],
                        ["Admissão", formatarData(resultado.dadosPrincipais?.Admissão)],
                      ].map(([rotulo, valor]) => (
                        <div key={rotulo} className={rotulo === "Cargo" ? "col-span-2 sm:col-span-1" : ""}>
                          <p className={`text-[11px] font-semibold uppercase tracking-wide ${textoSecundarioClass}`}>{rotulo}</p>
                          <p className="mt-1 font-semibold">{valor}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${textoSecundarioClass}`}>Histórico</p>
                      <h4 className="mt-1 text-base font-bold">Onde este colaborador aparece</h4>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${temaDia ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/[0.05] text-slate-300"}`}>
                      {módulos.length} {módulos.length === 1 ? "módulo" : "módulos"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {módulos.map(([chave, registros]) => (
                      <section key={chave} className={`overflow-hidden rounded-2xl border ${cardClass}`}>
                        <div className={`flex items-center justify-between gap-3 border-b px-4 py-3.5 ${temaDia ? "border-slate-200" : "border-white/10"}`}>
                          <h5 className="text-sm font-bold">{formatarNomemódulo(chave)}</h5>
                          <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold ${temaDia ? "bg-slate-200 text-slate-600" : "bg-white/10 text-slate-300"}`}>
                            {registros.length}
                          </span>
                        </div>
                        <div className={`divide-y px-4 ${temaDia ? "divide-slate-200" : "divide-white/10"}`}>
                          {registros.map((registro) => (
                            <div
                              key={registro.id}
                              className="py-3.5 text-sm"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-semibold">{registro.titulo}</p>
                                  <p className={`mt-1 leading-relaxed ${textoSecundarioClass}`}>{registro.descricao}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                                  <p className={`text-xs ${textoSecundarioClass}`}>{formatarData(registro.data)}</p>
                                  {registro.status && (
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${temaDia ? "bg-slate-200 text-slate-700" : "bg-white/10 text-slate-200"}`}>
                                      {registro.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}




