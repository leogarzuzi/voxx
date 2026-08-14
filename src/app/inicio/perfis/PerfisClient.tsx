"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";
import { MODULOS_PERFIL } from "@/lib/modulosPerfis";

type PerfilAcesso = {
  id: string;
  nome: string;
  ativo: boolean;
  protegido: boolean;
  modulos: string[];
  totalUsuarios: number;
};

type FormularioPerfil = {
  id?: string;
  nome: string;
  ativo: boolean;
  protegido: boolean;
  modulos: string[];
};

const formularioVazio: FormularioPerfil = {
  nome: "",
  ativo: true,
  protegido: false,
  modulos: [],
};

export default function PerfisClient() {
  const { temaDia } = useTema();
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioPerfil>(formularioVazio);

  const carregarPerfis = useCallback(async () => {
    const response = await fetch("/api/perfis", { cache: "no-store" });
    const resultado = await response.json();
    setCarregando(false);

    if (!response.ok || !resultado.success) {
      setMensagem(resultado.error || "Não foi possível carregar os perfis.");
      return;
    }

    setPerfis(resultado.perfis);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void carregarPerfis();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [carregarPerfis]);

  const perfisFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return perfis;
    return perfis.filter((perfil) => perfil.nome.toLocaleLowerCase("pt-BR").includes(termo));
  }, [busca, perfis]);

  function abrirCriacao() {
    setMensagem("");
    setFormulario(formularioVazio);
    setModalAberto(true);
  }

  function abrirEdicao(perfil: PerfilAcesso) {
    setMensagem("");
    setFormulario({
      id: perfil.id,
      nome: perfil.nome,
      ativo: perfil.ativo,
      protegido: perfil.protegido,
      modulos: perfil.protegido ? MODULOS_PERFIL.map((modulo) => modulo.id) : perfil.modulos,
    });
    setModalAberto(true);
  }

  function alternarModulo(id: string) {
    if (formulario.protegido) return;
    setFormulario((atual) => ({
      ...atual,
      modulos: atual.modulos.includes(id)
        ? atual.modulos.filter((modulo) => modulo !== id)
        : [...atual.modulos, id],
    }));
  }

  async function salvarPerfil() {
    setSalvando(true);
    setMensagem("");
    const response = await fetch("/api/perfis", {
      method: formulario.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario),
    });
    const resultado = await response.json();
    setSalvando(false);

    if (!response.ok || !resultado.success) {
      setMensagem(resultado.error || "Não foi possível salvar o perfil.");
      return;
    }

    setModalAberto(false);
    setMensagem(formulario.id ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso.");
    await carregarPerfis();
  }

  async function excluirPerfil(perfil: PerfilAcesso) {
    if (perfil.protegido) return;
    if (!window.confirm(`Excluir o perfil “${perfil.nome}”? Essa ação não poderá ser desfeita.`)) return;

    setMensagem("");
    const response = await fetch("/api/perfis", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: perfil.id }),
    });
    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setMensagem(resultado.error || "Não foi possível excluir o perfil.");
      return;
    }

    setMensagem("Perfil excluído com sucesso.");
    await carregarPerfis();
  }

  const painel = temaDia
    ? "border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
    : "border-white/10 bg-[#171a23] shadow-[0_22px_70px_rgba(0,0,0,0.28)]";
  const input = temaDia
    ? "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-200"
    : "border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-white/30 focus:ring-blue-300/10";

  return (
    <main className={temaDia ? "min-h-screen bg-[#f4f7fb] p-8 text-slate-900" : "min-h-screen bg-[#11141b] p-8 text-slate-100"}>
      <section className={`rounded-[30px] border p-7 ${painel}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Controle de acesso</p>
            <h1 className={temaDia ? "mt-3 text-4xl font-semibold text-slate-950" : "mt-3 text-4xl font-semibold text-white"}>Perfis</h1>
            <p className={temaDia ? "mt-2 max-w-2xl text-sm text-slate-600" : "mt-2 max-w-2xl text-sm text-slate-300"}>
              Defina quais módulos cada grupo de usuários pode acessar.
            </p>
          </div>
          <button type="button" onClick={abrirCriacao} className={temaDia ? "h-11 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800" : "h-11 rounded-2xl bg-white px-5 text-sm font-bold text-slate-950 hover:bg-slate-200"}>
            Criar perfil
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 p-4" : "rounded-2xl border border-white/10 bg-white/[0.04] p-4"}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-semibold">{perfis.length}</p>
          </div>
          <div className={temaDia ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4" : "rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"}>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Ativos</p>
            <p className="mt-2 text-3xl font-semibold">{perfis.filter((perfil) => perfil.ativo).length}</p>
          </div>
          <div className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 p-4" : "rounded-2xl border border-white/10 bg-white/[0.04] p-4"}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Usuários alocados</p>
            <p className="mt-2 text-3xl font-semibold">{perfis.reduce((total, perfil) => total + perfil.totalUsuarios, 0)}</p>
          </div>
        </div>
      </section>

      <section className={`mt-6 overflow-hidden rounded-[26px] border ${painel}`}>
        <div className={temaDia ? "border-b border-slate-200 p-5" : "border-b border-white/10 p-5"}>
          <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar perfil..." className={`h-11 w-full max-w-md rounded-2xl border px-4 text-sm outline-none ring-2 ring-transparent transition ${input}`} />
        </div>

        {mensagem && (
          <div className={mensagem.includes("sucesso") ? (temaDia ? "m-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" : "m-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100") : (temaDia ? "m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" : "m-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100")}>
            {mensagem}
          </div>
        )}

        <div className="space-y-3 p-4">
          {carregando ? (
            <p className="p-8 text-center text-sm text-slate-500">Carregando perfis...</p>
          ) : perfisFiltrados.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Nenhum perfil encontrado.</p>
          ) : perfisFiltrados.map((perfil) => (
            <article key={perfil.id} className={temaDia ? "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between" : "flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between"}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">{perfil.nome}</h2>
                  <span className={perfil.ativo ? "rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-600" : "rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"}>{perfil.ativo ? "Ativo" : "Inativo"}</span>
                  {perfil.protegido && <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-2.5 py-1 text-xs font-bold text-blue-600">Protegido</span>}
                </div>
                <p className="mt-2 text-sm text-slate-500">{perfil.totalUsuarios} usuário{perfil.totalUsuarios === 1 ? "" : "s"} · {perfil.modulos.length} módulo{perfil.modulos.length === 1 ? "" : "s"}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{perfil.modulos.map((id) => MODULOS_PERFIL.find((modulo) => modulo.id === id)?.nome).filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => abrirEdicao(perfil)} className={temaDia ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold hover:bg-slate-100" : "rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold hover:bg-white/[0.1]"}>Alterar</button>
                {!perfil.protegido && <button type="button" onClick={() => excluirPerfil(perfil)} className="rounded-xl border border-red-300/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-400/20">Excluir</button>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {modalAberto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm" onMouseDown={() => !salvando && setModalAberto(false)}>
          <div className={temaDia ? "max-h-full w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl" : "max-h-full w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-2xl"} onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{formulario.id ? "Alterar perfil" : "Novo perfil"}</p>
                <h2 className="mt-2 text-2xl font-bold">{formulario.id ? formulario.nome : "Criar perfil de acesso"}</h2>
              </div>
              <button type="button" onClick={() => setModalAberto(false)} className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-500/10">×</button>
            </div>

            <label className="mt-6 block text-sm font-semibold">Nome do perfil</label>
            <input value={formulario.nome} disabled={formulario.protegido} onChange={(event) => setFormulario((atual) => ({ ...atual, nome: event.target.value }))} className={`mt-2 h-11 w-full rounded-2xl border px-4 text-sm outline-none ring-2 ring-transparent disabled:opacity-60 ${input}`} />

            <div className="mt-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Módulos permitidos</h3>
                <p className="mt-1 text-sm text-slate-500">A hierarquia interna de cada módulo será adicionada depois.</p>
              </div>
              <span className="text-sm font-semibold text-slate-500">{formulario.modulos.length}/{MODULOS_PERFIL.length}</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {MODULOS_PERFIL.map((modulo) => {
                const marcado = formulario.modulos.includes(modulo.id);
                const exclusivoAdmin = modulo.id === "perfis";
                return (
                  <label key={modulo.id} className={marcado ? (temaDia ? "flex cursor-pointer gap-3 rounded-2xl border border-slate-950 bg-slate-50 p-4" : "flex cursor-pointer gap-3 rounded-2xl border border-white bg-white/[0.1] p-4") : (temaDia ? "flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" : "flex cursor-pointer gap-3 rounded-2xl border border-white/10 p-4 hover:bg-white/[0.05]")}>
                    <input type="checkbox" checked={marcado} disabled={formulario.protegido || exclusivoAdmin} onChange={() => alternarModulo(modulo.id)} className="mt-1 h-4 w-4 accent-slate-950" />
                    <span><span className="block text-sm font-bold">{modulo.nome}{exclusivoAdmin && !formulario.protegido ? " · exclusivo Admin" : ""}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{modulo.descricao}</span></span>
                  </label>
                );
              })}
            </div>

            {!formulario.protegido && formulario.id && (
              <label className={temaDia ? "mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4" : "mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"}>
                <span><span className="block text-sm font-bold">Perfil ativo</span><span className="mt-1 block text-xs text-slate-500">Perfis com usuários alocados não podem ser inativados.</span></span>
                <input type="checkbox" checked={formulario.ativo} onChange={(event) => setFormulario((atual) => ({ ...atual, ativo: event.target.checked }))} className="h-5 w-5 accent-slate-950" />
              </label>
            )}

            {mensagem && modalAberto && <p className="mt-5 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm text-red-500">{mensagem}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={salvando} onClick={() => setModalAberto(false)} className={temaDia ? "rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50" : "rounded-2xl border border-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/[0.05]"}>Cancelar</button>
              <button type="button" disabled={salvando} onClick={salvarPerfil} className={temaDia ? "rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60" : "rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60"}>{salvando ? "Salvando..." : "Salvar perfil"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
