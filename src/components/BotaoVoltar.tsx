"use client";

export function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="voxx-medical-access absolute left-4 top-4 z-20 flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold sm:left-8 sm:top-8"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M19 12H5M11 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Voltar</span>
    </button>
  );
}
