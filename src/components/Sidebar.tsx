"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BuscaRapidaColaborador } from "@/components/BuscaRapidaColaborador";
import { TemaToggle } from "@/components/TemaToggle";
import { useTema } from "@/contexts/TemaContext";
import {
  PERMISSOES,
  podeVerMenuAdmissao,
  podeVerMenuBaseDados,
  temPermissao,
} from "@/lib/perfis";

type SidebarProps = {
  perfil: string;
  onNavigate?: () => void;
};

export function Sidebar({ perfil, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { tema, temaDia, alternarTema } = useTema();

  const [baseDadosOpen, setBaseDadosOpen] = useState(
    pathname.startsWith("/inicio/base-dados")
  );
  const [admissaoOpen, setAdmissaoOpen] = useState(
    pathname.startsWith("/inicio/admissao")
  );
  const [dashboardOpen, setDashboardOpen] = useState(
    pathname.startsWith("/inicio/dashboard")
  );
  const [centralMemorandosOpen, setCentralMemorandosOpen] = useState(
    pathname.startsWith("/inicio/central-memorandos")
  );

  const podeVerSolicitacoes = temPermissao(perfil, PERMISSOES.SOLICITACOES);
  const podeVerAuditoria = temPermissao(perfil, PERMISSOES.AUDITORIA);
  const podeVerUsuarios = temPermissao(perfil, PERMISSOES.USUARIOS);
  const podeVerBaseDados = podeVerMenuBaseDados(perfil);
  const podeVerAdmissao = podeVerMenuAdmissao(perfil);
  const podeVerDesligamento = temPermissao(perfil, PERMISSOES.DESLIGAMENTOS);
  const podeVerTransferencia = temPermissao(perfil, PERMISSOES.TRANSFERENCIAS);
  const podeVerPermuta = temPermissao(perfil, PERMISSOES.PERMUTAS);
  const podeVerDashboard =
    temPermissao(perfil, PERMISSOES.DASHBOARD) ||
    temPermissao(perfil, PERMISSOES.ADMISSOES_DASHBOARD) ||
    temPermissao(perfil, PERMISSOES.DESLIGAMENTOS) ||
    temPermissao(perfil, PERMISSOES.ATESTADOS);
  const podeVerAnaliseFopag = temPermissao(
    perfil,
    PERMISSOES.CONFERENCIA_FOLHA
  );



  useEffect(() => {
    if (pathname.startsWith("/inicio/base-dados")) {
      setBaseDadosOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/inicio/central-memorandos")) {
      setCentralMemorandosOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/inicio/admissao")) {
      setAdmissaoOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/inicio/dashboard")) {
      setDashboardOpen(true);
    }
  }, [pathname]);

  function rotaAtiva(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function iniciarNavegacao(href: string) {
    if (!rotaAtiva(href)) {
      onNavigate?.();
    }
  }



  function itemMenuClass(ativo: boolean) {
    const estado = temaDia
      ? ativo
        ? "bg-slate-950 text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)] ring-1 ring-slate-950/5 [&_svg]:!text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 [&_svg]:!text-slate-400 hover:[&_svg]:!text-slate-700"
      : ativo
        ? "bg-white text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.28)] ring-1 ring-white/70 [&_svg]:!text-slate-950"
        : "text-slate-300 hover:bg-white/10 hover:text-white [&_svg]:!text-slate-400 hover:[&_svg]:!text-white";

    return `group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition duration-200 ${estado}`;
  }

  function grupoMenuClass(ativo: boolean) {
    const estado = temaDia
      ? ativo
        ? "bg-slate-950 text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)] ring-1 ring-slate-950/5 [&_svg]:!text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 [&_svg]:!text-slate-400 hover:[&_svg]:!text-slate-700"
      : ativo
        ? "bg-white text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.28)] ring-1 ring-white/70 [&_svg]:!text-slate-950"
        : "text-slate-300 hover:bg-white/10 hover:text-white [&_svg]:!text-slate-400 hover:[&_svg]:!text-white";

    return `group flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition duration-200 ${estado}`;
  }

  function subItemMenuClass(ativo: boolean) {
    const estado = temaDia
      ? ativo
        ? "bg-slate-950/90 font-semibold text-white shadow-sm"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      : ativo
        ? "bg-white/15 font-semibold text-white ring-1 ring-white/10"
        : "text-slate-400 hover:bg-white/10 hover:text-white";

    return `block rounded-xl px-3 py-2 text-sm transition ${estado}`;
  }

  const baseDadosAtivo = pathname.startsWith("/inicio/base-dados");
  const centralMemorandosAtivo = pathname.startsWith(
    "/inicio/central-memorandos"
  );
  const admissaoAtivo = pathname.startsWith("/inicio/admissao");
  const dashboardAtivo = pathname.startsWith("/inicio/dashboard");
  const iconClass = temaDia ? "h-5 w-5 text-slate-400" : "h-5 w-5 text-blue-100";
  const chevronClass = temaDia
    ? "inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition group-hover:border-slate-300 group-hover:text-slate-700"
    : "inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-blue-100 transition group-hover:border-white/20 group-hover:text-white";
  const subMenuClass = temaDia
    ? "ml-8 mt-1 space-y-1 border-l border-slate-200 pl-3"
    : "ml-8 mt-1 space-y-1 border-l border-blue-600 pl-3";

  return (
    <aside
      className={
        temaDia
          ? "sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start overflow-hidden rounded-tr-[30px] rounded-br-[30px] border-r border-slate-200 bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#eef2f7_100%)] text-slate-950 shadow-[18px_0_45px_rgba(15,23,42,0.10)]"
          : "sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start overflow-hidden rounded-tr-[30px] rounded-br-[30px] border-r border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.24),transparent_34%),linear-gradient(180deg,#20242d_0%,#151821_52%,#11141b_100%)] text-white shadow-[18px_0_45px_rgba(15,23,42,0.22)]"
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 pb-3 pt-5">
          <Link
            href="/inicio"
            title="Ir para o inÃ­cio"
            onClick={() => iniciarNavegacao("/inicio")}
            className={
              temaDia
                ? "flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:bg-slate-50"
                : "flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-3 shadow-inner shadow-white/5 transition hover:bg-white/[0.09]"
            }
          >
            <span
              className={
                temaDia
                  ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.22)]"
                  : "flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.24)]"
              }
            >
              <img
                src="/logo-simbolo.png"
                alt="VOXX"
                className="h-9 w-9 object-contain"
              />
            </span>

            <span className="min-w-0">
              <span
                className={
                  temaDia
                    ? "block text-base font-bold leading-tight tracking-wide text-slate-950"
                    : "block text-base font-bold leading-tight tracking-wide text-white"
                }
              >
                VOXX
              </span>
            </span>
          </Link>
        </div>

        <BuscaRapidaColaborador tema={tema} />

        <nav className="voxx-scrollbar mt-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
          {podeVerSolicitacoes && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/solicitacoes"))}
              href="/inicio/solicitacoes"
              onClick={() => iniciarNavegacao("/inicio/solicitacoes")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M19 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              SolicitaÃ§Ãµes
            </Link>
          )}

          {podeVerAuditoria && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/auditoria"))}
              href="/inicio/auditoria"
              onClick={() => iniciarNavegacao("/inicio/auditoria")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M9 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              Auditoria
            </Link>
          )}

          {podeVerUsuarios && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/usuarios"))}
              href="/inicio/usuarios"
              onClick={() => iniciarNavegacao("/inicio/usuarios")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              UsuÃ¡rios
            </Link>
          )}

          {podeVerBaseDados && (
            <>
              <button
                type="button"
                onClick={() => setBaseDadosOpen(!baseDadosOpen)}
                className={grupoMenuClass(baseDadosAtivo)}
              >
                <span className="flex items-center gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Base de Dados
                </span>
                <span className={`${chevronClass} ${baseDadosOpen ? "rotate-90" : ""}`}>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {baseDadosOpen && (
                <div className={subMenuClass}>
                  {temPermissao(perfil, PERMISSOES.BASE_DADOS_COLABORADORES) && (
                    <Link
                      prefetch={false}
                      className={subItemMenuClass(
                        rotaAtiva("/inicio/base-dados/colaboradores")
                      )}
                      href="/inicio/base-dados/colaboradores"
                      onClick={() => iniciarNavegacao("/inicio/base-dados/colaboradores")}
                    >
                      Colaboradores
                    </Link>
                  )}

                  {temPermissao(perfil, PERMISSOES.BASE_DADOS_GESTAO_RH) && (
                    <Link
                      prefetch={false}
                      className={subItemMenuClass(
                        rotaAtiva("/inicio/base-dados/gestao-rh")
                      )}
                      href="/inicio/base-dados/gestao-rh"
                      onClick={() => iniciarNavegacao("/inicio/base-dados/gestao-rh")}
                    >
                      GestÃ£o e RH
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {podeVerAdmissao && (
            <>
              <button
                type="button"
                onClick={() => setAdmissaoOpen(!admissaoOpen)}
                className={grupoMenuClass(admissaoAtivo)}
              >
                <span className="flex items-center gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <path d="M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M22 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  AdmissÃ£o
                </span>
                <span className={`${chevronClass} ${admissaoOpen ? "rotate-90" : ""}`}>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {admissaoOpen && (
                <div className={subMenuClass}>
                  {temPermissao(perfil, PERMISSOES.ADMISSOES_VISUALIZAR) && (
                    <Link
                      prefetch={false}
                      className={subItemMenuClass(rotaAtiva("/inicio/admissao/controle"))}
                      href="/inicio/admissao/controle"
                      onClick={() => iniciarNavegacao("/inicio/admissao/controle")}
                    >
                      Controle de AdmissÃµes
                    </Link>
                  )}

                  {temPermissao(perfil, PERMISSOES.NOVOS_ADMITIDOS_VISUALIZAR) && (
                    <Link
                      prefetch={false}
                      className={subItemMenuClass(
                        rotaAtiva("/inicio/admissao/novos-admitidos")
                      )}
                      href="/inicio/admissao/novos-admitidos"
                      onClick={() => iniciarNavegacao("/inicio/admissao/novos-admitidos")}
                    >
                      Novos Admitidos
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {podeVerDesligamento && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/desligamento/controle"))}
              href="/inicio/desligamento/controle"
              onClick={() => iniciarNavegacao("/inicio/desligamento/controle")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
                <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 11h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Desligamento
            </Link>
          )}

          {podeVerTransferencia && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/transferencia/controle"))}
              href="/inicio/transferencia/controle"
              onClick={() => iniciarNavegacao("/inicio/transferencia/controle")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M7 7h11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 7l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 17H6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 17l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              TransferÃªncia
            </Link>
          )}

          {podeVerPermuta && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/permuta/controle"))}
              href="/inicio/permuta/controle"
              onClick={() => iniciarNavegacao("/inicio/permuta/controle")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M7 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" stroke="currentColor" strokeWidth="2" />
                <path d="M3.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 7h4l-2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m19 9 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 15h-4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m19 13-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Permuta
            </Link>
          )}

          {podeVerDashboard && (
            <>
              <button
                type="button"
                onClick={() => setDashboardOpen(!dashboardOpen)}
                className={grupoMenuClass(dashboardAtivo)}
              >
                <span className="flex items-center gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <path d="M4 13h4v7H4v-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M10 4h4v16h-4V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M16 9h4v11h-4V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  Dashboard
                </span>
                <span className={`${chevronClass} ${dashboardOpen ? "rotate-90" : ""}`}>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {dashboardOpen && (
                <div className={subMenuClass}>
                  {temPermissao(perfil, PERMISSOES.DASHBOARD) && (
                    <Link
                      className={subItemMenuClass(rotaAtiva("/inicio/dashboard/visao-geral"))}
                      href="/inicio/dashboard/visao-geral"
                      onClick={() => iniciarNavegacao("/inicio/dashboard/visao-geral")}
                    >
                      VisÃ£o Geral
                    </Link>
                  )}

                  {temPermissao(perfil, PERMISSOES.ADMISSOES_DASHBOARD) && (
                    <Link
                      className={subItemMenuClass(rotaAtiva("/inicio/dashboard/admissoes"))}
                      href="/inicio/dashboard/admissoes"
                      onClick={() => iniciarNavegacao("/inicio/dashboard/admissoes")}
                    >
                      AdmissÃµes
                    </Link>
                  )}

                  {temPermissao(perfil, PERMISSOES.DESLIGAMENTOS) && (
                    <Link
                      className={subItemMenuClass(rotaAtiva("/inicio/dashboard/desligamentos"))}
                      href="/inicio/dashboard/desligamentos"
                      onClick={() => iniciarNavegacao("/inicio/dashboard/desligamentos")}
                    >
                      Desligamentos
                    </Link>
                  )}

                  {temPermissao(perfil, PERMISSOES.ATESTADOS) && (
                    <Link
                      className={subItemMenuClass(rotaAtiva("/inicio/dashboard/atestados"))}
                      href="/inicio/dashboard/atestados"
                      onClick={() => iniciarNavegacao("/inicio/dashboard/atestados")}
                    >
                      Atestados
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {podeVerAnaliseFopag && (
            <Link
              className={itemMenuClass(rotaAtiva("/inicio/conferencia-folha"))}
              href="/inicio/conferencia-folha"
              onClick={() => iniciarNavegacao("/inicio/conferencia-folha")}
            >
              <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                <path d="M6 3h9l3 3v15H6V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M15 3v4h4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M8.5 12h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8.5 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              AnÃ¡lise FOPAG
            </Link>
          )}

          {podeVerSolicitacoes && (
            <>
              <button
                type="button"
                onClick={() => setCentralMemorandosOpen(!centralMemorandosOpen)}
                className={grupoMenuClass(false)}
              >
                <span className="flex items-center gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M8.5 8h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8.5 12h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8.5 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Central de Memorandos
                </span>
                <span
                  className={`${chevronClass} ${
                    centralMemorandosOpen ? "rotate-90" : ""
                  }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {centralMemorandosOpen && (
                <div className={subMenuClass}>
                  <Link
                    prefetch={false}
                    className={subItemMenuClass(pathname === "/inicio/central-memorandos")}
                    href="/inicio/central-memorandos"
                    onClick={() => iniciarNavegacao("/inicio/central-memorandos")}
                  >
                    Nova solicitacao
                  </Link>

                  <Link
                    prefetch={false}
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/central-memorandos/troca-plantao")
                    )}
                    href="/inicio/central-memorandos/troca-plantao"
                    onClick={() =>
                      iniciarNavegacao("/inicio/central-memorandos/troca-plantao")
                    }
                  >
                    Troca de plantao
                  </Link>
                  <Link
                    prefetch={false}
                    className={subItemMenuClass(
                      rotaAtiva("/inicio/central-memorandos/banco-horas")
                    )}
                    href="/inicio/central-memorandos/banco-horas"
                    onClick={() =>
                      iniciarNavegacao("/inicio/central-memorandos/banco-horas")
                    }
                  >
                    Banco de horas
                  </Link>
                </div>
              )}
            </>
          )}

        </nav>
      </div>

      <div
        className={
          temaDia
            ? "border-t border-slate-200 px-4 pb-4 pt-3"
            : "border-t border-white/10 px-4 pb-4 pt-3"
        }
      >
        <TemaToggle tema={tema} onToggle={alternarTema} />
        <p
          className={
            temaDia
              ? "mt-2 text-center text-[11px] font-semibold text-slate-500"
              : "mt-2 text-center text-[11px] font-semibold text-slate-400"
          }
        >
          {temaDia ? "Modo dia ativo" : "Modo noite ativo"}
        </p>
      </div>
    </aside>
  );
}









