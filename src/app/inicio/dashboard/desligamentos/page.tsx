import DashboardDesligamentosClient from "./DashboardDesligamentosClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registro = Record<string, unknown>;

async function buscarTodosRegistros(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tabela: string
) {
  const tamanhoPagina = 1000;
  let inicio = 0;
  let registros: Registro[] = [];

  while (true) {
    const { data, error } = await supabase
      .from(tabela)
      .select("id,cargo,data_desligamento,tipo_desligamento")
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error) {
      return {
        data: registros,
        error,
      };
    }

    const lote = (data ?? []) as Registro[];
    registros = registros.concat(lote);

    if (lote.length < tamanhoPagina) {
      return {
        data: registros,
        error: null,
      };
    }

    inicio += tamanhoPagina;
  }
}

export default async function DashboardDesligamentosPage() {
  const supabase = await createSupabaseServerClient();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const { data: desligamentos, error } = await buscarTodosRegistros(
    supabase,
    "desligamentos"
  );

  return (
    <DashboardDesligamentosClient
      desligamentos={desligamentos}
      anoAtual={anoAtual}
      mesAtual={mesAtual}
      error={error?.message ?? null}
    />
  );
}
