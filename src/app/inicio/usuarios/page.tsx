import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UsuariosTabela from "./UsuariosTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Usuario = {
  id: string;
  nome: string | null;
  email: string;
  perfil: string;
  status: string;
  criado_em: string | null;
};

export default async function UsuariosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const emailLogado = user.email.toLowerCase();

  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  if (
    !usuarioLogado ||
    usuarioLogado.perfil !== "Admin" ||
    usuarioLogado.status !== "ativo"
  ) {
    redirect("/inicio");
  }

  const { data: usuarios, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, status, criado_em")
    .order("criado_em", { ascending: false });

  const usuariosLista = (usuarios ?? []) as Usuario[];
  const totalUsuarios = usuariosLista.length;
  const usuariosAtivos = usuariosLista.filter(
    (usuario) => usuario.status === "ativo"
  ).length;
  const usuariosInativos = usuariosLista.filter(
    (usuario) => usuario.status !== "ativo"
  ).length;
  const administradores = usuariosLista.filter(
    (usuario) => usuario.perfil === "Admin"
  ).length;

  return (
    <main className="min-h-screen bg-[#11141b] p-8 text-slate-100">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
            Controle VOXX
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Gestão de Usuários
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Gerencie perfis, status de acesso e contas autorizadas a usar o
            sistema.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            {
              label: "Total",
              value: totalUsuarios,
              tone: "border-white/20 bg-white text-slate-950",
            },
            {
              label: "Ativos",
              value: usuariosAtivos,
              tone: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
            },
            {
              label: "Inativos",
              value: usuariosInativos,
              tone: "border-red-300/30 bg-red-400/15 text-red-100",
            },
            {
              label: "Admins",
              value: administradores,
              tone: "border-blue-300/30 bg-blue-300/15 text-blue-100",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-white/5"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-3xl font-semibold text-white">
                  {card.value}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${card.tone}`}
                >
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
          Erro ao carregar usuários.
        </p>
      )}

      <UsuariosTabela
        usuariosIniciais={usuariosLista}
        emailLogado={emailLogado}
      />
    </main>
  );
}
