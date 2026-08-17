"use client";

import BaseGestaoRhTabela from "./BaseGestaoRhTabela";

export default function BaseGestaoRhClient() {
  return (
    <main className="voxx-page min-h-screen p-8">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Base de dados
        </p>
        <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
          Gestão e RH
        </h1>
        <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
          Consulte a base de apoio da Gestão e RH, filtre colaboradores e
          exporte os registros para conferência.
        </p>
      </section>

      <BaseGestaoRhTabela />
    </main>
  );
}
