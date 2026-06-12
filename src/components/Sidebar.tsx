"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PERMISSOES,
  podeVerMenuBaseDados,
  temPermissao,
} from "@/lib/perfis";

type SidebarProps = {
  perfil: string;
  onNavigate?: () => void; // dispara o loading ao trocar de módulo
};

export function Sidebar({ perfil, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  // abre/fecha o grupo Base de Dados
  const [baseDadosOpen, setBaseDadosOpen] = useState(
    pathname.startsWith("/inicio/base-dados")
  );

  // abre/fecha o grupo Dashboard
  const [dashboardOpen, setDashboardOpen] = useState(
    pathname.startsWith("/inicio/dashboard")
  );

  // permissões do menu lateral vindas do src/lib/perfis.ts
  const podeVerSolicitacoes = temPermissao(
    perfil,
    PERMISSOES.SOLICITACOES
  );

  const podeVerAuditoria = temPermissao(perfil, PERMISSOES.AUDITORIA);

  const podeVerUsuarios = temPermissao(perfil, PERMISSOES.USUARIOS);

  const podeVerBaseDados = podeVerMenuBaseDados(perfil);

  const podeVerBaseDadosColaboradores = temPermissao(
    perfil,
    PERMISSOES.BASE_DADOS_COLABORADORES
  );

  const podeVerBaseDadosGestaoRh = temPermissao(
    perfil,
    PERMISSOES.BASE_DADOS_GESTAO_RH
  );

  const podeVerDashboard = temPermissao(perfil, PERMISSOES.DASHBOARD);

  const podeVerDashboardAdmissoes = temPermissao(
    perfil,
    PERMISSOES.ADMISSOES
  );

  const podeVerDashboardDesligamentos = temPermissao(
    perfil,
    PERMISSOES.DESLIGAMENTOS
  );

  const podeVerDashboardAtestados = temPermissao(
    perfil,
    PERMISSOES.ATESTADOS
  );

  const podeVerConferenciaFolha = temPermissao(
    perfil,
    PERMISSOES.CONFERENCIA_FOLHA
  );

  // mantém Base de Dados aberto quando estiver em qualquer submódulo dele
  useEffect(() => {
    if (pathname.startsWith("/inicio/base-dados")) {
      setBaseDadosOpen(true);
    }
  }, [pathname]);

  // mantém o Dashboard aberto quando estiver em qualquer submódulo dele
  useEffect(() => {
    if (pathname.startsWith("/inicio/dashboard")) {
      setDashboardOpen(true);
    }
  }, [pathname]);

  // confere se uma rota está ativa
  function rotaAtiva(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // inicia loading somente se estiver indo para uma rota diferente
  function iniciarNavegacao(href: string) {
    if (!rotaAtiva(href)) {
      onNavigate?.();
    }
  }

  // classe padrão dos itens principais do menu
  function itemMenuClass(ativo: boolean) {
    return `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
      ativo
        ? "bg-blue-700 shadow-inner ring-1 ring-blue-300/40"
        : "hover:bg-blue-700"
    }`;
  }

  // classe padrão dos subitens
  function subItemMenuClass(ativo: boolean) {
    return `block rounded-lg px-3 py-2 text-sm transition ${
      ativo
        ? "bg-blue-700 font-semibold text-white"
        : "text-blue-50 hover:bg-blue-700"
    }`;
  }

  const baseDadosAtivo = pathname.startsWith("/inicio/base-dados");
  const dashboardAtivo = pathname.startsWith("/inicio/dashboard");

  return (
    <aside className="min-h-screen w-56 overflow-hidden rounded-tr-[28px] rounded-br-[28px] bg-blue-800 text-white shadow-xl">
      {/* logo do sistema */}
      <div className="flex justify-center py-4">
        <Link
          href="/inicio"
          title="Ir para o início"
          onClick={() => iniciarNavegacao("/inicio")}
        >
          <img
            src="/logo-simbolo.png"
            alt="VOXX"
            className="h-20 w-20 object-contain transition hover:scale-105"
          />
        </Link>
      </div>

      <nav className="mt-0 space-y-1 px-4">
        {/* solicitações */}
        {podeVerSolicitacoes && (
          <Link
            className={itemMenuClass(rotaAtiva("/inicio/solicitacoes"))}
            href="/inicio/solicitacoes"
            onClick={() => iniciarNavegacao("/inicio/solicitacoes")}
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

        {/* auditoria */}
        {podeVerAuditoria && (
          <Link
            className={itemMenuClass(rotaAtiva("/inicio/auditoria"))}
            href="/inicio/auditoria"
            onClick={() => iniciarNavegacao("/inicio/auditoria")}
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

        {/* gestão de usuários */}
        {podeVerUsuarios && (
          <Link
            className={itemMenuClass(rotaAtiva("/inicio/usuarios"))}
            href="/inicio/usuarios"
            onClick={() => iniciarNavegacao("/inicio/usuarios")}
          >
            <svg
              className="h-5 w-5 text-blue-100"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
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
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            Usuários
          </Link>
        )}

        {/* base de dados */}
        {podeVerBaseDados && (
          <>
            <button
              type="button"
              onClick={() => setBaseDadosOpen(!baseDadosOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                baseDadosAtivo
                  ? "bg-blue-700 shadow-inner ring-1 ring-blue-300/40"
                  : "hover:bg-blue-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-blue-100"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <ellipse
                    cx="12"
                    cy="5"
                    rx="8"
                    ry="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                Base de Dados
              </span>

              <span
                className={`text-xs text-blue-100 transition ${
                  baseDadosOpen ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </button>

            {baseDadosOpen && (
              <div className="ml-8 mt-1 space-y-1 border-l border-blue-600 pl-3">
                {podeVerBaseDadosColaboradores && (
                  <Link
                    prefetch={false}
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/base-dados/colaboradores")
                    )}
                    href="/inicio/base-dados/colaboradores"
                    onClick={() =>
                      iniciarNavegacao("/inicio/base-dados/colaboradores")
                    }
                  >
                    Colaboradores
                  </Link>
                )}

                {podeVerBaseDadosGestaoRh && (
                  <Link
                    prefetch={false}
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/base-dados/gestao-rh")
                    )}
                    href="/inicio/base-dados/gestao-rh"
                    onClick={() =>
                      iniciarNavegacao("/inicio/base-dados/gestao-rh")
                    }
                  >
                    Gestão e RH
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* dashboard */}
        {podeVerDashboard && (
          <>
            <button
              type="button"
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                dashboardAtivo
                  ? "bg-blue-700 shadow-inner ring-1 ring-blue-300/40"
                  : "hover:bg-blue-700"
              }`}
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
                  className={subItemMenuClass(
                    rotaAtiva("/inicio/dashboard/visao-geral")
                  )}
                  href="/inicio/dashboard/visao-geral"
                  onClick={() =>
                    iniciarNavegacao("/inicio/dashboard/visao-geral")
                  }
                >
                  Visão Geral
                </Link>

                {podeVerDashboardAdmissoes && (
                  <Link
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/dashboard/admissoes")
                    )}
                    href="/inicio/dashboard/admissoes"
                    onClick={() =>
                      iniciarNavegacao("/inicio/dashboard/admissoes")
                    }
                  >
                    Admissões
                  </Link>
                )}

                {podeVerDashboardDesligamentos && (
                  <Link
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/dashboard/desligamentos")
                    )}
                    href="/inicio/dashboard/desligamentos"
                    onClick={() =>
                      iniciarNavegacao("/inicio/dashboard/desligamentos")
                    }
                  >
                    Desligamentos
                  </Link>
                )}

                {podeVerDashboardAtestados && (
                  <Link
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/dashboard/atestados")
                    )}
                    href="/inicio/dashboard/atestados"
                    onClick={() =>
                      iniciarNavegacao("/inicio/dashboard/atestados")
                    }
                  >
                    Atestados
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* conferência de folha */}
        {podeVerConferenciaFolha && (
          <Link
            className={itemMenuClass(rotaAtiva("/inicio/conferencia-folha"))}
            href="/inicio/conferencia-folha"
            onClick={() => iniciarNavegacao("/inicio/conferencia-folha")}
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

            Análise FOPAG
          </Link>
        )}
      </nav>
    </aside>
  );
}