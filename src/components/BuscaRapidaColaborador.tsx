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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          onMouseDown={fecharModal}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-blue-700">
                  Busca de colaborador
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Resultado para â€œ{busca.trim()}â€
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="rounded-full px-3 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar busca"
              >
                x
              </button>
            </div>

            {loading && (
              <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-8 text-center text-sm font-semibold text-blue-700">
                Consultando histórico do colaborador...
              </div>
            )}

            {!loading && erro && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            {!loading && resultado && !resultado.encontrado && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum colaborador encontrado para essa busca.
              </div>
            )}

            {!loading && resultado?.encontrado && (
              <>
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Dados principais
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <p>
                      <span className="font-semibold">Nome:</span>{" "}
                      {texto(resultado.dadosPrincipais?.nome)}
                    </p>
                    <p>
                      <span className="font-semibold">Matrícula:</span>{" "}
                      {texto(resultado.dadosPrincipais?.Matrícula)}
                    </p>
                    <p>
                      <span className="font-semibold">CPF:</span>{" "}
                      {texto(resultado.dadosPrincipais?.cpf)}
                    </p>
                    <p>
                      <span className="font-semibold">Cargo:</span>{" "}
                      {texto(resultado.dadosPrincipais?.cargo)}
                    </p>
                    <p>
                      <span className="font-semibold">Carga horária:</span>{" "}
                      {texto(resultado.dadosPrincipais?.cargaHoraria)}
                    </p>
                    <p>
                      <span className="font-semibold">Admissão:</span>{" "}
                      {formatarData(resultado.dadosPrincipais?.Admissão)}
                    </p>
                    <p className="md:col-span-2">
                      <span className="font-semibold">Status atual:</span>{" "}
                      {texto(resultado.dadosPrincipais?.statusAtual)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {módulos.map(([chave, registros]) => (
                    <div key={chave} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-800">
                          {formatarNomemódulo(chave)}
                        </h4>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          {registros.length}
                        </span>
                      </div>

                      {registros.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-400">
                          Nenhum registro encontrado neste módulo.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {registros.map((registro) => (
                            <div
                              key={registro.id}
                              className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            >
                              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                <p className="font-semibold text-slate-700">
                                  {registro.titulo}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatarData(registro.data)}
                                </p>
                              </div>
                              <p className="mt-1 text-slate-500">
                                {registro.descricao}
                              </p>
                              {registro.status && (
                                <p className="mt-1 text-xs font-semibold text-blue-700">
                                  {registro.status}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}




