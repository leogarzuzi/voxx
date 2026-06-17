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
};

export default function UsuariosClient({
  usuariosLista,
  emailLogado,
  erroCarregamento,
  totalUsuarios,
  usuariosAtivos,
  usuariosInativos,
  administradores,
}: UsuariosClientProps) {
  const { temaDia } = useTema();

  const cards = [
    {
      label: "Total",
      value: totalUsuarios,
      tone: temaDia
        ? "border-slate-200 bg-slate-950 text-white"
        : "border-white/20 bg-white text-slate-950",
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
        <div>
          <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"}>
            Controle de acesso
          </p>
          <h1 className={temaDia ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950" : "mt-3 text-4xl font-semibold tracking-tight text-white"}>
            Gestão de Usuários
          </h1>
          <p className={temaDia ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600" : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"}>
            Gerencie perfis, status de acesso e contas autorizadas a usar o
            sistema.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={
                temaDia
                  ? "rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.07)]"
                  : "rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-white/5"
              }
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className={temaDia ? "text-3xl font-semibold text-slate-950" : "text-3xl font-semibold text-white"}>
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

      <UsuariosTabela usuariosIniciais={usuariosLista} emailLogado={emailLogado} />
    </main>
  );
}

