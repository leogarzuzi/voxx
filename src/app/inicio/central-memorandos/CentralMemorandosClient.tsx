"use client";

import { useState } from "react";
import { useTema } from "@/contexts/TemaContext";
import { BancoHorasModal } from "./BancoHorasModal";
import { TrocaPlantaoModal } from "./TrocaPlantaoModal";

export default function CentralMemorandosClient() {
  const { temaDia } = useTema();
  const [modalTrocaAberto, setModalTrocaAberto] = useState(false);
  const [modalBancoHorasAberto, setModalBancoHorasAberto] = useState(false);

  const cardClass = temaDia
    ? "group rounded-[26px] border border-slate-200 bg-white p-6 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
    : "group rounded-[26px] border border-white/10 bg-[#171a23] p-6 text-left shadow-[0_22px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#1d2230]";
  const iconClass = temaDia
    ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 ring-1 ring-slate-200"
    : "flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-100 ring-1 ring-white/10";
  const titleClass = temaDia
    ? "mt-5 text-lg font-semibold text-slate-950"
    : "mt-5 text-lg font-semibold text-white";
  const descriptionClass = temaDia
    ? "mt-2 text-sm leading-6 text-slate-500"
    : "mt-2 text-sm leading-6 text-slate-400";
  const linkClass = temaDia
    ? "mt-5 inline-flex text-sm font-bold text-slate-950 transition group-hover:translate-x-1"
    : "mt-5 inline-flex text-sm font-bold text-slate-100 transition group-hover:translate-x-1";

  return (
    <main
      className={
        temaDia
          ? "min-h-screen bg-[#f4f6fb] px-8 py-8 text-slate-950"
          : "min-h-screen bg-[#11141b] px-8 py-8 text-slate-100"
      }
    >
      <section
        className={
          temaDia
            ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef3fb_58%,#e8edf6_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.1)]"
            : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        }
      >
        <p
          className={
            temaDia
              ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500"
              : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"
          }
        >
          Memorandos
        </p>
        <h1
          className={
            temaDia
              ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950"
              : "mt-3 text-4xl font-semibold tracking-tight text-white"
          }
        >
          Central de Memorandos
        </h1>
        <p
          className={
            temaDia
              ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600"
              : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"
          }
        >
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




