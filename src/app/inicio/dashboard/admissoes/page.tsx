import { createSupabaseServerClient } from "@/lib/supabaseServer";
import DashboardAdmissoesClient from "./DashboardAdmissoesClient";
import { redirect } from "next/navigation";
import { PERMISSOES } from "@/lib/perfis";
import { usuarioAtualTemPermissao } from "@/lib/perfisServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registro = Record<string, unknown>;

async function buscarTodosRegistros(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tabela: string
) {
  const tamanhoPagina = 1000;
  let pagina = 0;
  const registros: Registro[] = [];

  while (true) {
    const inicio = pagina * tamanhoPagina;
    const fim = inicio + tamanhoPagina - 1;

    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .range(inicio, fim);

    if (error) {
      return { data: registros, error };
    }

    const lote = (data ?? []) as Registro[];
    registros.push(...lote);

    if (lote.length < tamanhoPagina) {
      return { data: registros, error: null };
    }

    pagina += 1;
  }
}

export default async function DashboardAdmissoesPage() {
  const supabase = await createSupabaseServerClient();
  if (!(await usuarioAtualTemPermissao(supabase, PERMISSOES.ADMISSOES_DASHBOARD))) redirect("/inicio");
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const { data: admissoes, error } = await buscarTodosRegistros(
    supabase,
    "admissoes"
  );

  return (
    <DashboardAdmissoesClient
      admissoes={admissoes}
      anoAtual={anoAtual}
      mesAtual={mesAtual}
      error={error?.message ?? null}
    />
  );
}
