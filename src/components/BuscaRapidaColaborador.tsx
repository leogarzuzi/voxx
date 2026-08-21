"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type BuscaRapidaColaboradorProps = {
  tema?: "dia" | "noite";
};

export function BuscaRapidaColaborador({ tema = "noite" }: BuscaRapidaColaboradorProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");

  function pesquisar(event: FormEvent) {
    event.preventDefault();
    const termo = busca.trim();
    if (termo.length < 2) return;

    setBusca("");
    router.push(
      `/inicio?busca=${encodeURIComponent(termo)}&consulta=${Date.now()}`,
    );
  }

  return (
    <form onSubmit={pesquisar} className="px-4 pb-3" data-tema={tema}>
      <label className="relative block">
        <button
          type="submit"
          className="voxx-text-muted absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl transition hover:bg-[var(--voxx-surface-raised)] hover:text-[var(--voxx-primary)]"
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
          className="voxx-field h-11 w-full rounded-2xl pl-11 pr-3 text-sm transition"
        />
      </label>
    </form>
  );
}
