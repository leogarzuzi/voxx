"use client";

import { useTema } from "@/contexts/TemaContext";
import AuditoriaTabela from "./AuditoriaTabela";

export default function AuditoriaClient() {
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
            ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#edf2f7_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
            : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        }
      >
        <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"}>
          Segurança do sistema
        </p>
        <h1 className={temaDia ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950" : "mt-3 text-4xl font-semibold tracking-tight text-white"}>
          Auditoria
        </h1>
        <p className={temaDia ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600" : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"}>
          Acompanhe eventos importantes do sistema, alterações sensíveis e
          rastros de operação dos módulos.
        </p>
      </section>

      <AuditoriaTabela />
    </main>
  );
}
