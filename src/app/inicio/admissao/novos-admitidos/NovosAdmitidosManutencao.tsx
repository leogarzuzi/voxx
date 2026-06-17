"use client";

import Link from "next/link";
import { useTema } from "@/contexts/TemaContext";

export default function NovosAdmitidosManutencao() {
  const { temaDia } = useTema();

  return (
    <main
      className={
        temaDia
          ? "min-h-screen bg-[#f4f7fb] p-8 text-slate-900"
          : "min-h-screen bg-[#11141b] p-8 text-slate-100"
      }
    >
      <section
        className={
          temaDia
            ? "relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.14),transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#edf2f7_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
            : "relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.24),transparent_30%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        }
      >
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-dashed border-current opacity-10 md:block" />
        <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

        <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"}>
          Novos admitidos
        </p>
        <h1 className={temaDia ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950" : "mt-3 text-4xl font-semibold tracking-tight text-white"}>
          Estamos em construção
        </h1>
        <p className={temaDia ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600" : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"}>
          Esta área ainda está tomando forma. Por enquanto, ela está de capacete,
          prancheta na mão e fingindo que entende perfeitamente o cronograma.
        </p>
      </section>

      <section
        className={
          temaDia
            ? "mt-6 rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            : "mt-6 rounded-[30px] border border-white/10 bg-[#171a23] p-8 text-center shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
        }
      >
        <div
          className={
            temaDia
              ? "mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-blue-200 bg-blue-50 text-blue-700 shadow-inner"
              : "mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-blue-300/25 bg-blue-300/10 text-blue-100 shadow-inner shadow-white/5"
          }
          aria-hidden="true"
        >
          <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none">
            <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 18V9.5a5 5 0 0 1 10 0V18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className={temaDia ? "mt-6 text-2xl font-semibold text-slate-950" : "mt-6 text-2xl font-semibold text-white"}>
          Quase lá, mas ainda não hoje
        </h2>
        <p className={temaDia ? "mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600" : "mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300"}>
          Quando este submódulo estiver pronto, ele vai ajudar a acompanhar os
          admitidos recém-chegados com mais clareza. Até lá, o Controle de
          Admissões continua sendo o caminho oficial.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/inicio/admissao/controle"
            className={
              temaDia
                ? "rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                : "rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.24)] transition hover:bg-slate-200"
            }
          >
            Ir para Controle de Admissões
          </Link>

          <span className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-600" : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300"}>
            Status: em obras elegantes
          </span>
        </div>
      </section>
    </main>
  );
}