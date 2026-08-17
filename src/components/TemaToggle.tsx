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
        className={`voxx-surface relative flex h-12 w-full items-center justify-between rounded-full p-1 text-xs font-bold transition ${noLogin ? "backdrop-blur-xl" : ""}`}
        aria-label={temaDia ? "Ativar modo noite" : "Ativar modo dia"}
        title={temaDia ? "Ativar modo noite" : "Ativar modo dia"}
      >
        <span
          className={`absolute top-1 h-10 w-[calc(50%-4px)] rounded-full transition-all duration-300 ${
            temaDia
              ? "left-1 bg-[var(--voxx-surface-raised)] shadow-[0_8px_22px_rgba(23,59,99,0.16),inset_0_0_0_1px_var(--voxx-border)]"
              : "left-[calc(50%+0px)] bg-[var(--rs-navy-700)] shadow-[0_0_24px_rgba(53,181,229,0.30),inset_0_0_0_1px_rgba(69,194,239,0.38)]"
          }`}
        />

        <span
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 transition ${
            temaDia ? "text-[var(--rs-navy-700)]" : "text-[var(--voxx-text-subtle)]"
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
            temaDia ? "text-[var(--voxx-text-subtle)]" : "text-[var(--rs-cyan-300)]"
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
