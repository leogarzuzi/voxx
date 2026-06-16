import DashboardAtestadosClient, {
  type ResumoAtestado,
} from "./DashboardAtestadosClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { classificarDivisao } from "@/lib/classificarDivisao";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegistroAtestado = {
  funcao?: string | null;
  cid?: string | null;
  mes?: string | null;
  qtd_dias_abonados?: string | number | null;
  qtd_plantoes_abonados?: string | number | null;
};

const ordemMeses = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

function texto(valor?: string | null) {
  return String(valor || "").trim();
}

function numero(valor?: string | number | null) {
  const numeroConvertido = Number(String(valor || "0").replace(",", "."));
  return Number.isNaN(numeroConvertido) ? 0 : numeroConvertido;
}

function normalizarMes(mes?: string | null) {
  const valor = String(mes || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapaMeses: Record<string, string> = {
    JAN: "JAN",
    JANEIRO: "JAN",
    FEV: "FEV",
    FEVEREIRO: "FEV",
    MAR: "MAR",
    MARCO: "MAR",
    ABR: "ABR",
    ABRIL: "ABR",
    MAI: "MAI",
    MAIO: "MAI",
    JUN: "JUN",
    JUNHO: "JUN",
    JUL: "JUL",
    JULHO: "JUL",
    AGO: "AGO",
    AGOSTO: "AGO",
    SET: "SET",
    SETEMBRO: "SET",
    OUT: "OUT",
    OUTUBRO: "OUT",
    NOV: "NOV",
    NOVEMBRO: "NOV",
    DEZ: "DEZ",
    DEZEMBRO: "DEZ",
  };

  return mapaMeses[valor] || valor || "NAO INFORMADO";
}

function criarChave(resumo: Omit<ResumoAtestado, "total" | "dias" | "plantoes">) {
  return [resumo.mes, resumo.divisao, resumo.cid, resumo.funcao].join("||");
}

async function buscarResumoAtestados(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  const tamanhoPagina = 1000;
  let inicio = 0;
  let totalAtestados = 0;
  let totalDiasAbonados = 0;
  let totalPlantoesAbonados = 0;
  const agregados = new Map<string, ResumoAtestado>();

  while (true) {
    const { data, error } = await supabase
      .from("atestados")
      .select("funcao,cid,mes,qtd_dias_abonados,qtd_plantoes_abonados")
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error) {
      return {
        resumo: Array.from(agregados.values()),
        totais: {
          totalAtestados,
          totalDiasAbonados,
          totalPlantoesAbonados,
        },
        error,
      };
    }

    const lote = (data ?? []) as RegistroAtestado[];

    lote.forEach((atestado) => {
      const funcao = texto(atestado.funcao) || "Nao informado";
      const cid = texto(atestado.cid) || "Nao informado";
      const mes = normalizarMes(atestado.mes);
      const divisao = classificarDivisao(funcao);
      const dias = numero(atestado.qtd_dias_abonados);
      const plantoes = numero(atestado.qtd_plantoes_abonados);
      const chave = criarChave({ mes, divisao, cid, funcao });
      const atual = agregados.get(chave);

      totalAtestados += 1;
      totalDiasAbonados += dias;
      totalPlantoesAbonados += plantoes;

      if (atual) {
        atual.total += 1;
        atual.dias += dias;
        atual.plantoes += plantoes;
        return;
      }

      agregados.set(chave, {
        mes,
        divisao,
        cid,
        funcao,
        total: 1,
        dias,
        plantoes,
      });
    });

    if (lote.length < tamanhoPagina) {
      return {
        resumo: Array.from(agregados.values()).sort(
          (a, b) =>
            ordemMeses.indexOf(a.mes) - ordemMeses.indexOf(b.mes) ||
            b.total - a.total
        ),
        totais: {
          totalAtestados,
          totalDiasAbonados,
          totalPlantoesAbonados,
        },
        error: null,
      };
    }

    inicio += tamanhoPagina;
  }
}

export default async function DashboardAtestadosPage() {
  const supabase = await createSupabaseServerClient();
  const { resumo, totais, error } = await buscarResumoAtestados(supabase);

  return (
    <DashboardAtestadosClient
      resumo={resumo}
      totais={totais}
      error={error?.message ?? null}
    />
  );
}
