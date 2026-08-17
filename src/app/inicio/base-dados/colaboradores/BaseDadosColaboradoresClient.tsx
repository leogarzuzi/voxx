"use client";

import BaseDadosTabela from "./BaseDadosTabela";

export default function BaseDadosColaboradoresClient() {
  return (
    <main className="voxx-page min-h-screen p-8">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Base de dados
        </p>
        <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
          Colaboradores
        </h1>
        <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
          Consulte a base principal de colaboradores, aplique filtros e exporte
          os registros conforme a necessidade da operação.
        </p>
      </section>

      <BaseDadosTabela />
    </main>
  );
}
