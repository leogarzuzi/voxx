"use client";

import Link from "next/link";

export default function NovosAdmitidosManutencao() {
  return (
    <main className="voxx-page min-h-screen p-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[32px] p-8">
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-dashed border-current opacity-10 md:block" />
        <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Novos admitidos
        </p>
        <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
          Estamos em construção
        </h1>
        <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
          Esta área ainda está tomando forma. Por enquanto, ela está de capacete,
          prancheta na mão e fingindo que entende perfeitamente o cronograma.
        </p>
      </section>

      <section className="voxx-surface mt-6 rounded-[30px] p-8 text-center">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] text-[var(--voxx-primary)] shadow-inner"
          aria-hidden="true"
        >
          <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none">
            <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 18V9.5a5 5 0 0 1 10 0V18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="voxx-text-primary mt-6 text-2xl font-semibold">
          Quase lá, mas ainda não hoje
        </h2>
        <p className="voxx-text-muted mx-auto mt-2 max-w-xl text-sm leading-6">
          Quando este submódulo estiver pronto, ele vai ajudar a acompanhar os
          admitidos recém-chegados com mais clareza. Até lá, o Controle de
          Admissões continua sendo o caminho oficial.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/inicio/admissao/controle"
            className="voxx-button-primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
          >
            Ir para Controle de Admissões
          </Link>

          <span className="voxx-button-secondary rounded-2xl px-5 py-2.5 text-sm font-semibold">
            Status: em obras elegantes
          </span>
        </div>
      </section>
    </main>
  );
}
