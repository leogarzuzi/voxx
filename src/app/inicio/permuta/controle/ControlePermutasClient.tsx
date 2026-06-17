"use client";

import { useTema } from "@/contexts/TemaContext";
import ControlePermutasTabela from "./ControlePermutasTabela";

export default function ControlePermutasClient() {
  const { temaDia } = useTema();

  return (
    <main
      className={
        temaDia
          ? "min-h-screen min-w-0 bg-[#f4f6fb] p-8 text-slate-950"
          : "min-h-screen min-w-0 bg-[#11141b] p-8 text-slate-100"
      }
    >
      <section
        className={
          temaDia
            ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef3fb_58%,#e8edf6_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
            : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        }
      >
        <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"}>
          Módulo VOXX
        </p>
        <h1 className={temaDia ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950" : "mt-3 text-4xl font-semibold tracking-tight text-white"}>
          Controle de Permutas
        </h1>
        <p className={temaDia ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600" : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"}>
          Controle trocas entre colaboradores do HMRG e outras unidades com
          histórico, status e dados de entrada.
        </p>
      </section>

      <ControlePermutasTabela />
    </main>
  );
}