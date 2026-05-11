"use client";

import { useState } from "react";
import Link from "next/link";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);

  return (
    <aside
      className={`min-h-screen bg-blue-800 text-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-6">
        {!collapsed && (
          <div>
            <h1 className="text-2xl font-bold tracking-wide">VOXX</h1>
            <p className="mt-1 text-sm text-blue-100">Sistema de RH</p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg bg-blue-700 px-3 py-2 hover:bg-blue-600"
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <nav className="mt-6 space-y-1 px-4">
        <button
          onClick={() => setDashboardOpen(!dashboardOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-blue-700 px-4 py-3 font-medium hover:bg-blue-600"
        >
          {!collapsed && (
            <>
              <span>Dashboard</span>
              <span>{dashboardOpen ? "−" : "+"}</span>
            </>
          )}

          {collapsed && <span>D</span>}
        </button>

        {!collapsed && dashboardOpen && (
          <div className="ml-4 mt-1 space-y-1">
            <Link
              className="block rounded-lg px-4 py-2 text-sm hover:bg-blue-700"
              href="/dashboard"
            >
              Visão Geral
            </Link>

            <Link
              className="block rounded-lg px-4 py-2 text-sm hover:bg-blue-700"
              href="/dashboard/admissoes"
            >
              Admissões
            </Link>

            <Link
              className="block rounded-lg px-4 py-2 text-sm hover:bg-blue-700"
              href="/dashboard/desligamentos"
            >
              Desligamentos
            </Link>

            <Link
              className="block rounded-lg px-4 py-2 text-sm hover:bg-blue-700"
              href="/dashboard/atestados"
            >
              Atestados
            </Link>
          </div>
        )}

        {!collapsed && (
          <div className="mt-6">
            <div className="px-4 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Ferramentas
            </div>

            <Link
              className="mt-2 block rounded-lg px-4 py-3 hover:bg-blue-700"
              href="/analise-folha"
            >
              Analisar folha de pagamento
            </Link>
          </div>
        )}

        {collapsed && (
          <Link
            className="block rounded-lg px-4 py-3 text-center hover:bg-blue-700"
            href="/analise-folha"
          >
            F
          </Link>
        )}
      </nav>
    </aside>
  );
}