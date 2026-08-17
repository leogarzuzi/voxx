"use client";

import ControleTransferenciasTabela from "./ControleTransferenciasTabela";

export default function ControleTransferenciasClient() {
  return (
    <main className="voxx-page min-h-screen min-w-0 p-8">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Gestão de RH
        </p>
        <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
          Controle de Transferências
        </h1>
        <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
          Gerencie entradas e saídas de colaboradores por transferência entre
          unidades.
        </p>
      </section>

      <ControleTransferenciasTabela />
    </main>
  );
}
