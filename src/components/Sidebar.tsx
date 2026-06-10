"use client";

import { useState } from "react";
import Link from "next/link";

type SidebarProps = {
  perfil: string;
};

export function Sidebar({ perfil }: SidebarProps) {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const podeVerSolicitacoes = perfil === "Admin";
  const podeVerAuditoria = perfil === "Admin";

  return (
    <aside className="min-h-screen w-56 bg-blue-800 text-white">
      {/* logo do sistema */}
      <div className="flex justify-center py-4">
        <Link href="/inicio" title="Ir para o início">
          <img
            src="/logo-simbolo.png"
            alt="VOXX"
            className="h-20 w-20 object-contain transition hover:scale-105"
          />
        </Link>
      </div>

      <nav className="mt-0 space-y-1 px-4">
        {/* solicitações - somente admin */}
        {podeVerSolicitacoes && (
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/inicio/solicitacoes"
          >
            <svg
              className="h-5 w-5 text-blue-100"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19 8v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M22 11h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            Solicitações
          </Link>
        )}

        {/* auditoria - somente admin */}
        {podeVerAuditoria && (
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/inicio/auditoria"
          >
            <svg
              className="h-5 w-5 text-blue-100"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 11l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>

            Auditoria
          </Link>
        )}

        {/* dashboard */}
        <button
          type="button"
          onClick={() => setDashboardOpen(!dashboardOpen)}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <span className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-blue-100"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 13h4v7H4v-7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M10 4h4v16h-4V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M16 9h4v11h-4V9Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>

            Dashboard
          </span>

          <span
            className={`text-xs text-blue-100 transition ${
              dashboardOpen ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </button>

        {/* opções do dashboard */}
        {dashboardOpen && (
          <div className="ml-8 mt-1 space-y-1 border-l border-blue-600 pl-3">
            <Link
              className="block rounded-lg px-3 py-2 text-sm text-blue-50 transition hover:bg-blue-700"
              href="/inicio/dashboard/visao-geral"
            >
              Visão Geral
            </Link>

            <Link
              className="block rounded-lg px-3 py-2 text-sm text-blue-50 transition hover:bg-blue-700"
              href="/inicio/dashboard/admissoes"
            >
              Admissões
            </Link>

            <Link
              className="block rounded-lg px-3 py-2 text-sm text-blue-50 transition hover:bg-blue-700"
              href="/inicio/dashboard/desligamentos"
            >
              Desligamentos
            </Link>

            <Link
              className="block rounded-lg px-3 py-2 text-sm text-blue-50 transition hover:bg-blue-700"
              href="/inicio/dashboard/atestados"
            >
              Atestados
            </Link>
          </div>
        )}

        {/* conferência de folha */}
        <Link
          className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-blue-700"
          href="/inicio/conferencia-folha"
        >
          <svg
            className="h-5 w-5 text-blue-100"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 3h9l3 3v15H6V3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M15 3v4h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 12h7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8.5 16h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          Analise FOPAG
        </Link>
      </nav>
    </aside>
  );
}