"use client";

import { useTema } from "@/contexts/TemaContext";
import UsuariosTabela from "./UsuariosTabela";

type Usuario = {
  id: string;
  nome: string | null;
  email: string;
  perfil: string;
  status: string;
  criado_em: string | null;
};

type UsuariosClientProps = {
  usuariosLista: Usuario[];
  emailLogado: string;
  erroCarregamento: boolean;
  totalUsuarios: number;
  usuariosAtivos: number;
  usuariosInativos: number;
  administradores: number;
  perfisDisponiveis: string[];
};

export default function UsuariosClient({
  usuariosLista,
  emailLogado,
  erroCarregamento,
  totalUsuarios,
  usuariosAtivos,
  usuariosInativos,
  administradores,
  perfisDisponiveis,
}: UsuariosClientProps) {
  const { temaDia } = useTema();

  const cards = [
    {
      label: "Total",
      value: totalUsuarios,
      tone: "border-[var(--voxx-primary)] bg-[var(--voxx-primary)] text-[var(--voxx-primary-contrast)]",
    },
    {
      label: "Ativos",
      value: usuariosAtivos,
      tone: temaDia
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
    },
    {
      label: "Inativos",
      value: usuariosInativos,
      tone: temaDia
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-red-300/30 bg-red-400/15 text-red-100",
    },
    {
      label: "Admins",
      value: administradores,
      tone: temaDia
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-blue-300/30 bg-blue-300/15 text-blue-100",
    },
  ];

  return (
    <main className="voxx-usuarios voxx-page min-h-screen p-8">
      <section className="voxx-surface-raised overflow-hidden rounded-[30px] p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--voxx-primary)]">
            Controle de acesso
          </p>
          <h1 className="voxx-text-primary mt-3 text-4xl font-semibold tracking-tight">
            Gestão de Usuários
          </h1>
          <p className="voxx-text-muted mt-2 max-w-2xl text-sm leading-6">
            Gerencie perfis, status de acesso e contas autorizadas a usar o
            sistema.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] p-4 shadow-[var(--voxx-shadow-soft)]"
            >
              <p className="voxx-text-muted text-xs font-medium uppercase tracking-[0.2em]">
                {card.label}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="voxx-text-primary text-3xl font-semibold">
                  {card.value}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${card.tone}`}>
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {erroCarregamento && (
        <p className={temaDia ? "mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" : "mt-6 rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100"}>
          Erro ao carregar usuários.
        </p>
      )}

      <UsuariosTabela
        usuariosIniciais={usuariosLista}
        emailLogado={emailLogado}
        perfisDisponiveis={perfisDisponiveis}
      />
    </main>
  );
}

