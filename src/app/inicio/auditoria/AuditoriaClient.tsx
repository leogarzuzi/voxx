"use client";

import AuditoriaTabela from "./AuditoriaTabela";

export default function AuditoriaClient() {
  return (
    <main className="voxx-page min-h-screen p-8">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Segurança do sistema
        </p>
        <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
          Auditoria
        </h1>
        <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
          Acompanhe eventos importantes do sistema, alterações sensíveis e
          rastros de operação dos módulos.
        </p>
      </section>

      <AuditoriaTabela />
    </main>
  );
}
