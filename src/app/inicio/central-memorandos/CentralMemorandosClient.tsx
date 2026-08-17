"use client";

import { useState } from "react";
import { BancoHorasModal } from "./BancoHorasModal";
import { TrocaPlantaoModal } from "./TrocaPlantaoModal";

export default function CentralMemorandosClient() {
  const [modalTrocaAberto, setModalTrocaAberto] = useState(false);
  const [modalBancoHorasAberto, setModalBancoHorasAberto] = useState(false);

  const cardClass = "voxx-surface group rounded-[26px] p-6 text-left transition hover:-translate-y-0.5 hover:border-[var(--rs-cyan-500)]";
  const iconClass = "flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] text-[var(--voxx-primary)]";
  const titleClass = "voxx-text-primary mt-5 text-lg font-semibold";
  const descriptionClass = "voxx-text-muted mt-2 text-sm leading-6";
  const linkClass = "mt-5 inline-flex text-sm font-bold text-[var(--voxx-primary)] transition group-hover:translate-x-1";

  return (
    <main className="voxx-page min-h-screen px-8 py-8">
      <section className="voxx-surface-raised relative overflow-hidden rounded-[30px] p-7">
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--voxx-focus)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
          Memorandos
        </p>
        <h1 className="voxx-text-primary relative mt-3 text-4xl font-semibold tracking-tight">
          Central de Memorandos
        </h1>
        <p className="voxx-text-muted relative mt-2 max-w-2xl text-sm leading-6">
          Área para solicitações eletrônicas entre coordenação e RH.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <button type="button" onClick={() => setModalTrocaAberto(true)} className={cardClass}>
          <div className="flex items-start justify-between gap-4">
            <span className={iconClass}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 7h11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 17H6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 7l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 17l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          <h2 className={titleClass}>Troca de plantão</h2>
          <p className={descriptionClass}>Solicitação de troca de plantão entre dois colaboradores.</p>
          <span className={linkClass}>Abrir memorando</span>
        </button>

        <button type="button" onClick={() => setModalBancoHorasAberto(true)} className={cardClass}>
          <div className="flex items-start justify-between gap-4">
            <span className={iconClass}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M21 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          <h2 className={titleClass}>Banco de horas</h2>
          <p className={descriptionClass}>Solicitação de compensação entre plantão original e novo plantão.</p>
          <span className={linkClass}>Abrir memorando</span>
        </button>
      </section>

      {modalTrocaAberto && (
        <TrocaPlantaoModal onClose={() => setModalTrocaAberto(false)} />
      )}

      {modalBancoHorasAberto && (
        <BancoHorasModal onClose={() => setModalBancoHorasAberto(false)} />
      )}
    </main>
  );
}




