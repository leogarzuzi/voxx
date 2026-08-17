  import { NextRequest } from "next/server";
import {
  carregarWorkbook,
  criarAbaEstilizada,
  criarWorkbook,
  escreverWorkbook,
  nomesAbas,
  sheetToJson,
  type WorkbookSeguro,
} from "@/lib/excelSeguro";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";
  import { registrarAuditoria } from "@/lib/auditoria";

  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";
  export const maxDuration = 60;

  const RUBRICAS: Record<string, { "95": string; OUTROS: string }> = {
    "ADC NOT": { "95": "703", OUTROS: "3037" },
    ATRASOS: { "95": "1054", OUTROS: "3507" },
    "GRAT FDS": { "95": "710", OUTROS: "3120" },
    "GRAT DIF PROV": { "95": "1053", OUTROS: "3195" },
    EXTRAS: { "95": "715", OUTROS: "3138" },
    FALTAS: { "95": "1065", OUTROS: "3506" },
    "GRAT PLT": { "95": "716", OUTROS: "3147" },
    "GRAT ROT": { "95": "719", OUTROS: "3154" },
    "GRAT CTI ESP": { "95": "1050", OUTROS: "3185" },
  };

  const ABAS_DUPLA = [
    "ADC NOT",
    "ATRASOS",
    "GRAT FDS",
    "GRAT DIF PROV",
    "EXTRAS",
    "FALTAS",
  ];

  const ABAS_SIMPLES = ["GRAT PLT", "GRAT ROT", "GRAT CTI ESP"];

  function limparMatricula(valor: any) {
    return String(valor ?? "").replace(/\D/g, "");
  }

  function formatarMatricula(valor: any) {
    const limpa = limparMatricula(valor).padStart(8, "0");

    if (limpa.length !== 8) return limpa;

    return `${limpa[0]}.${limpa.slice(1, 4)}.${limpa.slice(4, 7)}-${limpa[7]}`;
  }

  function identificarContrato(pref: any) {
    return String(pref ?? "").trim() === "95" ? "95" : "OUTROS";
  }

  function normalizarRubrica(valor: any) {
    return String(valor ?? "").trim();
  }

  function excelDateToJSDate(serial: number) {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }

  function normalizarCompetencia(valor: any) {
    if (!valor) return "";

    if (valor instanceof Date) {
      return `${String(valor.getMonth() + 1).padStart(2, "0")}/${valor.getFullYear()}`;
    }

    if (typeof valor === "number") {
      const data = excelDateToJSDate(valor);
      return `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
    }

    const texto = String(valor).trim();

    const data = new Date(texto);
    if (!Number.isNaN(data.getTime())) {
      return `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
    }

    return "";
  }

  function normalizarColunas(rows: Record<string, any>[]) {
    return rows.map((row) => {
      const novo: Record<string, any> = {};

      for (const chave of Object.keys(row)) {
        novo[String(chave).trim().toUpperCase()] = row[chave];
      }

      return novo;
    });
  }

  function carregarSetMatriculas(workbook: WorkbookSeguro, aba: string) {
    const rows = normalizarColunas(sheetToJson(workbook, aba));

    return new Set(
      rows
        .filter((row) => row.MATRICULA)
        .map((row) => limparMatricula(row.MATRICULA))
    );
  }

  function acharAbaPrevia(workbook: WorkbookSeguro) {
    const abas = nomesAbas(workbook);
    if (abas.includes("PREVIA")) return "PREVIA";
    if (abas.includes("HMRG")) return "HMRG";

    return (
      abas.find((nome) => nome.toUpperCase() !== "DINAMICA") || abas[0]
    );
  }

  export async function POST(request: NextRequest) {
    try {

      const supabase = await createSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        return Response.json(
          { success: false, error: "Não autenticado." },
          { status: 401 }
        );
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("perfil, status")
        .eq("email", user.email.toLowerCase())
        .single();

      if (!usuario || usuario.status !== "ativo" || !(await temPermissaoNoBanco(supabase, usuario.perfil, PERMISSOES.CONFERENCIA_FOLHA))) {
        return Response.json(
          { success: false, error: "Sem permissão." },
          { status: 403 }
        );
      }

      const formData = await request.formData();

      const fopagFile = formData.get("fopag") as File | null;
      const previaFile = formData.get("previa") as File | null;
      const competencia = String(formData.get("competencia") || "05/2026");

      if (!fopagFile || !previaFile) {
        return Response.json(
          { success: false, error: "Envie FOPAG e PREVIA." },
          { status: 400 }
        );
      }

      const limiteArquivo = 15 * 1024 * 1024;
      const extensaoValida = (arquivo: File) => /\.xlsx$/i.test(arquivo.name);

      if (
        fopagFile.size <= 0 ||
        previaFile.size <= 0 ||
        fopagFile.size > limiteArquivo ||
        previaFile.size > limiteArquivo
      ) {
        return Response.json(
          { success: false, error: "Cada planilha deve ter no máximo 15 MB." },
          { status: 413 }
        );
      }

      if (!extensaoValida(fopagFile) || !extensaoValida(previaFile)) {
        return Response.json(
          { success: false, error: "Envie somente planilhas XLSX." },
          { status: 415 }
        );
      }

      if (!/^\d{2}\/\d{4}$/.test(competencia)) {
        return Response.json(
          { success: false, error: "Competência inválida." },
          { status: 400 }
        );
      }

      const fopagBuffer = Buffer.from(await fopagFile.arrayBuffer());
      const previaBuffer = Buffer.from(await previaFile.arrayBuffer());

      const [fopagWorkbook, previaWorkbook] = await Promise.all([
        carregarWorkbook(fopagBuffer),
        carregarWorkbook(previaBuffer),
      ]);

      const abaPrevia = acharAbaPrevia(previaWorkbook);

      const feriasSet = carregarSetMatriculas(fopagWorkbook, "FERIAS");
      const desligadosSet = carregarSetMatriculas(fopagWorkbook, "DESLIGADOS");

      const previaOriginal = normalizarColunas(
        sheetToJson(previaWorkbook, abaPrevia)
      );

      const mapaNomes = new Map(
        previaOriginal.map((row) => [
          limparMatricula(row.MATRICULA),
          row.NOME || "ND",
        ])
      );

      const previa = previaOriginal
        .map(
          (row) =>
            ({
              ...row,
              MATRICULA_LIMPA: limparMatricula(row.MATRICULA),
              RUBRICA_LIMPA: normalizarRubrica(row.RUBRICA),
              COMPETENCIA_LIMPA: normalizarCompetencia(row.COMPETENCIA),
            } as Record<string, any>)
        )
        .filter((row) => row.COMPETENCIA_LIMPA === competencia);

      const abasParaLer = [...ABAS_DUPLA, ...ABAS_SIMPLES];

      const fopagTratada = abasParaLer.flatMap((aba) => {
        const rows = normalizarColunas(sheetToJson(fopagWorkbook, aba));

        return rows
          .filter((row) => row.MATRICULA)
          .map((row) => {
            const contrato = identificarContrato(row.PREF);

            return {
              ...row,
              ABA_FOPAG: aba,
              MATRICULA_LIMPA: limparMatricula(row.MATRICULA),
              CONTRATO: contrato,
              RUBRICA_ESPERADA: RUBRICAS[aba][contrato],
            } as Record<string, any>;
          });
      });

      const previaChaves = new Set(
        previa.map((row) => `${row.MATRICULA_LIMPA}|${row.RUBRICA_LIMPA}`)
      );

      const matriculasNaPrevia = new Set(
        previa.map((row) => row.MATRICULA_LIMPA)
      );

      const fopagChavesPorAbaMatricula = new Set(
        fopagTratada.map(
          (row) => `${row.ABA_FOPAG}|${row.MATRICULA_LIMPA}`
        )
      );

      const erros: Record<string, any>[] = [];

      for (const linha of fopagTratada) {
        const matricula = linha.MATRICULA_LIMPA;
        const rubrica = linha.RUBRICA_ESPERADA;

        if (ABAS_SIMPLES.includes(linha.ABA_FOPAG) && feriasSet.has(matricula)) {
          continue;
        }

        let detalhe = "";

        if (!matriculasNaPrevia.has(matricula)) {
          if (desligadosSet.has(matricula)) {
            detalhe = "Matrícula enviada, mas colaborador consta como desligado.";
          } else {
            detalhe = "Matrícula enviada na FOPAG, mas não existe na prévia da sede.";
          }
        } else if (!previaChaves.has(`${matricula}|${rubrica}`)) {
          if (feriasSet.has(matricula) && ABAS_DUPLA.includes(linha.ABA_FOPAG)) {
            detalhe = "Rubrica enviada, mas colaborador está de férias na competência.";
          } else {
            detalhe = "Rubrica enviada na FOPAG, mas não foi encontrada na prévia.";
          }
        } else {
          continue;
        }

        erros.push({
          COMPETENCIA: competencia,
          ABA_FOPAG: linha.ABA_FOPAG,
          MATRICULA_FORMATADA: formatarMatricula(matricula),
          NOME: mapaNomes.get(matricula) || "ND",
          RUBRICA_ESPERADA: rubrica,
          DETALHE: detalhe,
        });
      }

      const rubricaParaAba: Record<string, string> = {};

      for (const aba of ABAS_DUPLA) {
        rubricaParaAba[RUBRICAS[aba]["95"]] = aba;
        rubricaParaAba[RUBRICAS[aba].OUTROS] = aba;
      }

      for (const linha of previa) {
        const rubrica = linha.RUBRICA_LIMPA;
        const abaEsperada = rubricaParaAba[rubrica];

        if (!abaEsperada) continue;

        const existeNaFopag = fopagChavesPorAbaMatricula.has(
          `${abaEsperada}|${linha.MATRICULA_LIMPA}`
        );

        if (existeNaFopag) continue;

        erros.push({
          COMPETENCIA: competencia,
          ABA_FOPAG: abaEsperada,
          MATRICULA_FORMATADA: formatarMatricula(linha.MATRICULA_LIMPA),
          NOME: mapaNomes.get(linha.MATRICULA_LIMPA) || "ND",
          RUBRICA_ESPERADA: rubrica,
          DETALHE: "Rubrica paga na prévia, mas não encontrada na FOPAG.",
        });
      }

      const resumoDetalhe = Object.entries(
        erros.reduce<Record<string, number>>((acc, erro) => {
          acc[erro.DETALHE] = (acc[erro.DETALHE] || 0) + 1;
          return acc;
        }, {})
      ).map(([DETALHE, TOTAL]) => ({ DETALHE, TOTAL }));

      const resumoAba = Object.entries(
        erros.reduce<Record<string, number>>((acc, erro) => {
          const aba = erro.ABA_FOPAG || "NÃO INFORMADO";
          acc[aba] = (acc[aba] || 0) + 1;
          return acc;
        }, {})
      ).map(([ABA_FOPAG, TOTAL]) => ({ ABA_FOPAG, TOTAL }));

      const resumoGeral = [
        { INDICADOR: "Competência analisada", TOTAL: competencia },
        { INDICADOR: "Aba da prévia lida", TOTAL: abaPrevia },
        { INDICADOR: "Linhas na prévia", TOTAL: previa.length },
        { INDICADOR: "Lançamentos FOPAG", TOTAL: fopagTratada.length },
        { INDICADOR: "Colaboradores em férias", TOTAL: feriasSet.size },
        { INDICADOR: "Colaboradores desligados", TOTAL: desligadosSet.size },
        { INDICADOR: "Total de divergências", TOTAL: erros.length },
      ];

      const wb = criarWorkbook();

      criarAbaEstilizada(wb, resumoGeral, "RESUMO_GERAL");
      criarAbaEstilizada(wb, resumoDetalhe, "RESUMO_DETALHE");
      criarAbaEstilizada(wb, resumoAba, "RESUMO_POR_ABA");
      criarAbaEstilizada(wb, erros, "ERROS_DETALHADOS");

      const output = await escreverWorkbook(wb);

      await registrarAuditoria({
        usuarioEmail: user.email,
        usuarioId: user.id,
        acao: "CONFERENCIA_FOLHA_EXECUTADA",
        modulo: "conferencia_folha",
        detalhes: {
          competencia,
          abaPrevia,
          linhasPrevia: previa.length,
          lancamentosFopag: fopagTratada.length,
          colaboradoresFerias: feriasSet.size,
          colaboradoresDesligados: desligadosSet.size,
          totalDivergencias: erros.length,
          arquivoFopag: fopagFile.name,
          arquivoPrevia: previaFile.name,
        },
      });

      return new Response(output, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="resultado_conferencia_${competencia.replace(
            "/",
            "-"
          )}.xlsx"`,
        },
      });
    } catch (error) {
      return Response.json(
        { success: false, error: String(error) },
        { status: 500 }
      );
    }
  }
