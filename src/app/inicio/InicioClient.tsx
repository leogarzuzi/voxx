"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTema } from "@/contexts/TemaContext";

type Vinculo = {
  matricula: string;
  nome: string | null;
  cpf: string | null;
  cargo: string | null;
  cargaHoraria: string | null;
  admissao: string | null;
  desligamento: string | null;
  statusAtual: string | null;
};

type RegistroHistorico = {
  id: string;
  modulo: string;
  titulo: string;
  descricao: string;
  data: string | null;
  status?: string | null;
};

type GrupoHistorico = {
  registros: RegistroHistorico[];
  total: number;
  temMais: boolean;
};

type Ficha = {
  dadosPrincipais: Vinculo | null;
  historico: Record<string, GrupoHistorico>;
};

const NOMES_MODULOS: Record<string, string> = {
  colaboradores: "Base de colaboradores",
  gestaoRh: "Gestão e RH",
  admissoes: "Admissões",
  desligamentos: "Desligamentos",
  transferencias: "Transferências",
  permutas: "Permutas",
  atestados: "Atestados",
  trocasPlantao: "Trocas de plantão",
  bancoHoras: "Banco de horas",
};

const ORDEM_MODULOS = [
  "trocasPlantao",
  "bancoHoras",
  "atestados",
  "transferencias",
  "permutas",
  "desligamentos",
];

function texto(valor: string | null | undefined) {
  return valor || "Não informado";
}

function formatarData(valor: string | null | undefined) {
  if (!valor) return "-";
  const data = valor.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return valor;
}

export default function InicioClient({ buscaInicial }: { buscaInicial: string }) {
  const router = useRouter();
  const { temaDia } = useTema();
  const [campoBusca, setCampoBusca] = useState("");
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [matriculaSelecionada, setMatriculaSelecionada] = useState("");
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [loading, setLoading] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarSelecao, setMostrarSelecao] = useState(false);

  const carregarFicha = useCallback(async (matricula: string) => {
    setLoading(true);
    setErro("");
    setMatriculaSelecionada(matricula);

    const response = await fetch(`/api/consulta-colaborador?matricula=${encodeURIComponent(matricula)}`, { cache: "no-store" });
    const resultado = await response.json();
    setLoading(false);

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Não foi possível carregar a ficha.");
      setFicha(null);
      return;
    }

    setFicha({ dadosPrincipais: resultado.dadosPrincipais, historico: resultado.historico || {} });
    setMostrarSelecao(false);
  }, []);

  const pesquisar = useCallback(async (busca: string) => {
    setLoading(true);
    setErro("");
    setFicha(null);
    setVinculos([]);
    setMatriculaSelecionada("");

    const response = await fetch(`/api/consulta-colaborador?busca=${encodeURIComponent(busca)}`, { cache: "no-store" });
    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setLoading(false);
      setErro(resultado.error || "Não foi possível realizar a busca.");
      return;
    }

    const encontrados = (resultado.vinculos || []) as Vinculo[];
    setVinculos(encontrados);

    if (encontrados.length === 1) {
      await carregarFicha(encontrados[0].matricula);
      return;
    }

    setMostrarSelecao(encontrados.length > 1);
    setLoading(false);
  }, [carregarFicha]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (buscaInicial) {
        void pesquisar(buscaInicial);
        return;
      }

      setFicha(null);
      setVinculos([]);
      setMatriculaSelecionada("");
      setErro("");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [buscaInicial, pesquisar]);

  async function verMais(modulo: string) {
    const grupo = ficha?.historico[modulo];
    if (!grupo || !matriculaSelecionada) return;

    setCarregandoMais(modulo);
    const response = await fetch(
      `/api/consulta-colaborador?matricula=${encodeURIComponent(matriculaSelecionada)}&modulo=${encodeURIComponent(modulo)}&offset=${grupo.registros.length}`,
      { cache: "no-store" }
    );
    const resultado = await response.json();
    setCarregandoMais("");

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Não foi possível carregar mais registros.");
      return;
    }

    setFicha((atual) => atual ? {
      ...atual,
      historico: {
        ...atual.historico,
        [modulo]: {
          registros: [...atual.historico[modulo].registros, ...resultado.registros],
          total: resultado.total,
          temMais: resultado.temMais,
        },
      },
    } : atual);
  }

  function recolher(modulo: string) {
    setFicha((atual) => atual ? {
      ...atual,
      historico: {
        ...atual.historico,
        [modulo]: {
          ...atual.historico[modulo],
          registros: atual.historico[modulo].registros.slice(0, 4),
          temMais: atual.historico[modulo].total > 4,
        },
      },
    } : atual);
  }

  const gruposComDados = useMemo(() =>
    ORDEM_MODULOS.filter((modulo) => (ficha?.historico[modulo]?.total || 0) > 0),
  [ficha]);

  const painel = temaDia
    ? "border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
    : "border-white/10 bg-[#171a23] shadow-[0_22px_70px_rgba(0,0,0,0.28)]";
  const secundario = temaDia ? "text-slate-500" : "text-slate-400";

  function enviarPesquisa(event: FormEvent) {
    event.preventDefault();
    const termo = campoBusca.trim();
    if (termo.length < 2) return;
    setCampoBusca("");
    router.push(`/inicio?busca=${encodeURIComponent(termo)}`);
  }

  const cabecalho = (
    <section className={`rounded-[30px] border p-7 ${painel}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <span className={temaDia ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950"}>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </span>
        <h1 className="shrink-0 text-3xl font-semibold">Ficha do colaborador</h1>
        <form onSubmit={enviarPesquisa} className="relative w-full lg:ml-auto lg:max-w-xl">
          <button type="submit" aria-label="Pesquisar" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
          <input type="search" value={campoBusca} onChange={(event) => setCampoBusca(event.target.value)} placeholder="Nome, CPF ou matrícula" className={temaDia ? "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-slate-400" : "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30"}/>
        </form>
      </div>
    </section>
  );

  if (!buscaInicial && !loading && !ficha) {
    return (
      <main className={temaDia ? "flex min-h-screen items-center bg-[#f4f7fb] p-8 text-slate-900" : "flex min-h-screen items-center bg-[#11141b] p-8 text-slate-100"}>
        <section className={`mx-auto w-full max-w-md rounded-[30px] border p-8 text-center ${painel}`}>
          <span className={temaDia ? "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white" : "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950"}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Ficha do colaborador</h1>
          <form onSubmit={enviarPesquisa} className="relative mt-6 w-full text-left">
            <button type="submit" aria-label="Pesquisar" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
            <input type="search" value={campoBusca} onChange={(event) => setCampoBusca(event.target.value)} placeholder="Nome, CPF ou matrícula" autoFocus className={temaDia ? "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-slate-400" : "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30"}/>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={temaDia ? "min-h-screen bg-[#f4f7fb] p-8 text-slate-900" : "min-h-screen bg-[#11141b] p-8 text-slate-100"}>
      {cabecalho}
      {vinculos.length > 1 && ficha && (
        <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setMostrarSelecao(true)} className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100" : "rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold hover:bg-white/[0.1]"}>Trocar vínculo</button>
        </div>
      )}

      {loading && <section className={`mt-6 flex min-h-64 flex-col items-center justify-center rounded-[28px] border ${painel}`}><span className={temaDia ? "h-10 w-10 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" : "h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent"}/><p className="mt-4 text-sm font-semibold">Consultando registros...</p></section>}

      {!loading && erro && <div className={temaDia ? "mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700" : "mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-red-100"}>{erro}</div>}

      {!loading && !erro && vinculos.length === 0 && <section className={`mt-6 rounded-[28px] border p-10 text-center ${painel}`}><h2 className="text-xl font-bold">Nenhum colaborador encontrado</h2><p className={`mt-2 text-sm ${secundario}`}>Confira o nome, CPF ou matrícula e faça uma nova pesquisa.</p></section>}

      {!loading && mostrarSelecao && vinculos.length > 1 && (
        <section className={`mt-6 rounded-[28px] border p-6 ${painel}`}>
          <h2 className="text-xl font-bold">Selecione o vínculo</h2>
          <p className={`mt-2 text-sm ${secundario}`}>Encontramos {vinculos.length} matrículas relacionadas à pesquisa.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {vinculos.map((vinculo) => (
              <button key={vinculo.matricula} type="button" onClick={() => carregarFicha(vinculo.matricula)} className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-400 hover:bg-white" : "rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-white/30 hover:bg-white/[0.08]"}>
                <p className="font-bold">{texto(vinculo.nome)}</p>
                <p className={`mt-2 text-sm ${secundario}`}>Matrícula {vinculo.matricula}</p>
                <p className={`mt-1 text-sm ${secundario}`}>{texto(vinculo.cargo)} · {texto(vinculo.cargaHoraria)}</p>
                <span className="mt-4 inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-600">{texto(vinculo.statusAtual)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && ficha && !mostrarSelecao && (
        <>
          <section className={`mt-6 rounded-[28px] border p-6 ${painel}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Vínculo selecionado</p><h2 className="mt-2 text-2xl font-bold">{texto(ficha.dadosPrincipais?.nome)}</h2><p className={`mt-2 text-sm ${secundario}`}>{texto(ficha.dadosPrincipais?.cargo)}</p></div>
              <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-600">{texto(ficha.dadosPrincipais?.statusAtual)}</span>
            </div>
            <div className={temaDia ? "mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-5" : "mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-5"}>
              {[["Matrícula", ficha.dadosPrincipais?.matricula], ["CPF", ficha.dadosPrincipais?.cpf], ["Carga horária", ficha.dadosPrincipais?.cargaHoraria], ["Admissão", formatarData(ficha.dadosPrincipais?.admissao)], ...(ficha.dadosPrincipais?.desligamento ? [["Desligamento", formatarData(ficha.dadosPrincipais.desligamento)]] : [])].map(([rotulo, valor]) => <div key={rotulo}><p className={`text-[11px] font-semibold uppercase tracking-wide ${secundario}`}>{rotulo}</p><p className="mt-1 text-sm font-bold">{texto(valor)}</p></div>)}
            </div>
          </section>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {gruposComDados.map((modulo) => {
              const grupo = ficha.historico[modulo];
              return (
                <section key={modulo} className={`overflow-hidden rounded-[26px] border ${painel}`}>
                  <div className={temaDia ? "border-b border-slate-200 px-5 py-4" : "border-b border-white/10 px-5 py-4"}><h3 className="font-bold">{NOMES_MODULOS[modulo]}</h3></div>
                  <div className={temaDia ? "divide-y divide-slate-200 px-5" : "divide-y divide-white/10 px-5"}>
                    {grupo.registros.map((registro) => <article key={registro.id} className="py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{registro.titulo}</p><p className={`mt-1 text-sm leading-6 ${secundario}`}>{registro.descricao}</p></div><div className="shrink-0 text-right"><p className={`text-xs ${secundario}`}>{formatarData(registro.data)}</p>{registro.status && <span className={temaDia ? "mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600" : "mt-2 inline-flex rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-300"}>{registro.status}</span>}</div></div></article>)}
                  </div>
                  {(grupo.temMais || grupo.registros.length > 4) && <div className={temaDia ? "flex gap-2 border-t border-slate-200 p-4" : "flex gap-2 border-t border-white/10 p-4"}>{grupo.temMais && <button type="button" disabled={carregandoMais === modulo} onClick={() => verMais(modulo)} className={temaDia ? "flex-1 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" : "flex-1 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"}>{carregandoMais === modulo ? "Carregando..." : `Ver mais (${grupo.total - grupo.registros.length})`}</button>}{grupo.registros.length > 4 && <button type="button" onClick={() => recolher(modulo)} className={temaDia ? "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold" : "rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold"}>Recolher</button>}</div>}
                </section>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
