"use client";

import ControlePermutasTabela from "./ControlePermutasTabela";

export default function ControlePermutasClient() {
  return (
    <main className="voxx-page min-h-screen min-w-0 p-8">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Gestão de RH
        </p>
        <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
          Controle de Permutas
        </h1>
        <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
          Controle trocas entre colaboradores do HMRG e outras unidades com
          histórico, status e dados de entrada.
        </p>
      </section>

      <ControlePermutasTabela />
    </main>
  );
}
