"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type BuscaRapidaColaboradorProps = {
  tema?: "dia" | "noite";
};

export function BuscaRapidaColaborador({ tema = "noite" }: BuscaRapidaColaboradorProps) {
  const router = useRouter();
  const temaDia = tema === "dia";
  const [busca, setBusca] = useState("");

  function pesquisar(event: FormEvent) {
    event.preventDefault();
    const termo = busca.trim();
    if (termo.length < 2) return;

    setBusca("");
    router.push(`/inicio?busca=${encodeURIComponent(termo)}`);
  }

  return (
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
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <input
          type="search"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar colaborador..."
          className={
            temaDia
              ? "h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 shadow-[0_10px_22px_rgba(15,23,42,0.06)] outline-none placeholder:text-slate-400 transition focus:border-slate-300 focus:ring-2 focus:ring-blue-100"
              : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-11 pr-3 text-sm text-white shadow-inner shadow-black/10 outline-none placeholder:text-slate-500 transition focus:border-white/30 focus:ring-2 focus:ring-blue-300/10"
          }
        />
      </label>
    </form>
  );
}
