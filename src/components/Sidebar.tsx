"use client";

import { useState } from "react";
import Link from "next/link";

export function Sidebar() {
  const [dashboardOpen, setDashboardOpen] = useState(false); // abre/fecha opções do dashboard

  return (
    <aside className="min-h-screen w-56 bg-blue-800 text-white">
      <div className="flex justify-center py-7">
        <Link href="/inicio" title="Ir para o início">
          <img
            src="/logo-simbolo.png"
            alt="VOXX"
            className="h-20 w-20 object-contain transition hover:scale-105"
          />
        </Link>
      </div>

      <nav className="mt-2 space-y-1 px-4">
        <button
          type="button"
          onClick={() => setDashboardOpen(!dashboardOpen)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-blue-700"
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

          Analisar FOPAG
        </Link>
      </nav>
    </aside>
  );
}