"use client";

import type { TemaInterface } from "@/contexts/TemaContext";

type TemaToggleProps = {
  tema: TemaInterface;
  onToggle: () => void;
  variant?: "sidebar" | "login";
};

export function TemaToggle({ tema, onToggle, variant = "sidebar" }: TemaToggleProps) {
  const temaDia = tema === "dia";
  const noLogin = variant === "login";

  return (
    <div
      className={
        noLogin
          ? "pointer-events-auto fixed bottom-5 left-1/2 z-20 w-[230px] -translate-x-1/2"
          : "w-full"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        className={
          temaDia
            ? `relative flex h-12 w-full items-center justify-between rounded-full border border-slate-200 bg-white p-1 text-xs font-bold text-slate-500 transition ${
                noLogin
                  ? "shadow-[0_18px_44px_rgba(15,23,42,0.14)]"
                  : "shadow-[0_12px_28px_rgba(15,23,42,0.10)]"
              }`
            : `relative flex h-12 w-full items-center justify-between rounded-full border border-white/10 p-1 text-xs font-bold text-slate-400 transition ${
                noLogin
                  ? "bg-slate-950/55 shadow-[0_18px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
                  : "bg-slate-950/35 shadow-[0_12px_32px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]"
              }`
        }
        aria-label={temaDia ? "Ativar modo noite" : "Ativar modo dia"}
        title={temaDia ? "Ativar modo noite" : "Ativar modo dia"}
      >
        <span
          className={`absolute top-1 h-10 w-[calc(50%-4px)] rounded-full transition-all duration-300 ${
            temaDia
              ? "left-1 bg-white shadow-[0_10px_24px_rgba(245,158,11,0.22),inset_0_0_0_1px_rgba(245,158,11,0.20)]"
              : "left-[calc(50%+0px)] bg-slate-800 shadow-[0_0_24px_rgba(96,165,250,0.45),inset_0_0_0_1px_rgba(96,165,250,0.35)]"
          }`}
        />

        <span
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 transition ${
            temaDia ? "text-amber-500" : "text-slate-500"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Dia
        </span>

        <span
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 transition ${
            temaDia ? "text-slate-400" : "text-blue-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 13.2A8.2 8.2 0 1 1 10.8 3a6.6 6.6 0 0 0 10.2 10.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Noite
        </span>
      </button>
    </div>
  );
}
