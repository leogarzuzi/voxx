"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx-js-style";
import { useTema } from "@/contexts/TemaContext";

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

function sheetToJson(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
    raw: true,
  });
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

function carregarSetMatriculas(workbook: XLSX.WorkBook, aba: string) {
  const rows = normalizarColunas(sheetToJson(workbook, aba));

  return new Set(
    rows
      .filter((row) => row.MATRICULA)
      .map((row) => limparMatricula(row.MATRICULA))
  );
}

function acharAbaPrevia(workbook: XLSX.WorkBook) {
  if (workbook.SheetNames.includes("PREVIA")) return "PREVIA";
  if (workbook.SheetNames.includes("HMRG")) return "HMRG";

  return (
    workbook.SheetNames.find((nome) => nome.toUpperCase() !== "DINAMICA") ||
    workbook.SheetNames[0]
  );
}

function estilizarPlanilha(sheet: XLSX.WorkSheet) {
  if (!sheet["!ref"]) return;

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  sheet["!rows"] = [];

  for (let R = range.s.r; R <= range.e.r; R++) {
    sheet["!rows"][R] = { hpx: 35 };

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];

      if (!cell) continue;

      const isHeader = R === 0;

      cell.s = {
        font: {
          name: "Calibri",
          sz: isHeader ? 14 : 11,
          bold: isHeader,
          color: { rgb: "000000" },
        },
        fill: isHeader ? { fgColor: { rgb: "D9EAF7" } } : undefined,
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: "D9D9D9" } },
          bottom: { style: "thin", color: { rgb: "D9D9D9" } },
          left: { style: "thin", color: { rgb: "D9D9D9" } },
          right: { style: "thin", color: { rgb: "D9D9D9" } },
        },
      };
    }
  }
}

function criarAbaEstilizada(
  wb: XLSX.WorkBook,
  dados: Record<string, any>[],
  nomeAba: string
) {
  const ws = XLSX.utils.json_to_sheet(dados.length ? dados : [{}]);

  estilizarPlanilha(ws);

  ws["!cols"] = Object.keys(dados[0] || {}).map(() => ({
    wch: 24,
  }));

  XLSX.utils.book_append_sheet(wb, ws, nomeAba.substring(0, 31));
}

async function analisarNoNavegador({
  fopag,
  previa,
  competencia,
}: {
  fopag: File;
  previa: File;
  competencia: string;
}) {
  const [fopagBuffer, previaBuffer] = await Promise.all([
    fopag.arrayBuffer(),
    previa.arrayBuffer(),
  ]);

  const fopagWorkbook = XLSX.read(fopagBuffer, {
    type: "array",
    cellDates: true,
  });

  const previaWorkbook = XLSX.read(previaBuffer, {
    type: "array",
    cellDates: true,
  });

  const abaPrevia = acharAbaPrevia(previaWorkbook);
  const feriasSet = carregarSetMatriculas(fopagWorkbook, "FERIAS");
  const desligadosSet = carregarSetMatriculas(fopagWorkbook, "DESLIGADOS");
  const previaOriginal = normalizarColunas(sheetToJson(previaWorkbook, abaPrevia));

  const mapaNomes = new Map(
    previaOriginal.map((row) => [
      limparMatricula(row.MATRICULA),
      row.NOME || "ND",
    ])
  );

  const previaTratada = previaOriginal
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
    previaTratada.map((row) => `${row.MATRICULA_LIMPA}|${row.RUBRICA_LIMPA}`)
  );

  const matriculasNaPrevia = new Set(
    previaTratada.map((row) => row.MATRICULA_LIMPA)
  );

  const fopagChavesPorAbaMatricula = new Set(
    fopagTratada.map((row) => `${row.ABA_FOPAG}|${row.MATRICULA_LIMPA}`)
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
      detalhe = desligadosSet.has(matricula)
        ? "Matrícula enviada, mas colaborador consta como desligado."
        : "Matrícula enviada na FOPAG, mas não existe na prévia da sede.";
    } else if (!previaChaves.has(`${matricula}|${rubrica}`)) {
      detalhe =
        feriasSet.has(matricula) && ABAS_DUPLA.includes(linha.ABA_FOPAG)
          ? "Rubrica enviada, mas colaborador está de férias na competência."
          : "Rubrica enviada na FOPAG, mas não foi encontrada na prévia.";
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

  for (const linha of previaTratada) {
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
    { INDICADOR: "Linhas na prévia", TOTAL: previaTratada.length },
    { INDICADOR: "Lançamentos FOPAG", TOTAL: fopagTratada.length },
    { INDICADOR: "Colaboradores em férias", TOTAL: feriasSet.size },
    { INDICADOR: "Colaboradores desligados", TOTAL: desligadosSet.size },
    { INDICADOR: "Total de divergências", TOTAL: erros.length },
  ];

  const wb = XLSX.utils.book_new();

  criarAbaEstilizada(wb, resumoGeral, "RESUMO_GERAL");
  criarAbaEstilizada(wb, resumoDetalhe, "RESUMO_DETALHE");
  criarAbaEstilizada(wb, resumoAba, "RESUMO_POR_ABA");
  criarAbaEstilizada(wb, erros, "ERROS_DETALHADOS");

  const output = XLSX.write(wb, {
    type: "array",
    bookType: "xlsx",
  });

  return {
    blob: new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    auditoria: {
      competencia,
      abaPrevia,
      linhasPrevia: previaTratada.length,
      lancamentosFopag: fopagTratada.length,
      colaboradoresFerias: feriasSet.size,
      colaboradoresDesligados: desligadosSet.size,
      totalDivergencias: erros.length,
      arquivoFopag: fopag.name,
      arquivoPrevia: previa.name,
      processamento: "navegador",
    },
  };
}

function baixarBlob(blob: Blob, competencia: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `resultado_conferencia_${competencia.replace("/", "-")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

type UploadCardProps = {
  label: string;
  sublabel?: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File | null) => void;
  isDrag: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
};

function UploadCard({
  label,
  sublabel,
  file,
  inputRef,
  onFile,
  isDrag,
  onDragEnter,
  onDragLeave,
}: UploadCardProps) {
  const { temaDia } = useTema();

  return (
    <div
      className={`overflow-hidden rounded-[24px] border transition-all duration-300 ${
        file
          ? "border-emerald-300/25 bg-emerald-300/10 shadow-[0_0_0_2px_rgba(52,211,153,0.08)]"
          : isDrag
          ? "border-blue-300/35 bg-blue-300/10 shadow-[0_0_0_3px_rgba(96,165,250,0.12)]"
          : "border-white/10 bg-white/[0.055] shadow-[0_12px_34px_rgba(0,0,0,0.16)]"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        onDragLeave();
        onFile(event.dataTransfer.files?.[0] || null);
      }}
    >
      <div
        className={`h-1 w-full ${
          file ? "bg-emerald-400" : isDrag ? (temaDia ? "bg-slate-400" : "bg-blue-400") : temaDia ? "bg-slate-200" : "bg-white/10"
        }`}
      />

      <div className="flex flex-col items-center px-6 py-7 text-center">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${
            file
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : isDrag
              ? "border-blue-300/30 bg-blue-300/10 text-blue-100"
              : "border-white/10 bg-white/[0.07] text-slate-300"
          }`}
        >
          {file ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          )}
        </div>

        <p className={temaDia ? "text-lg font-black tracking-tight text-slate-950" : "text-lg font-black tracking-tight text-slate-100"}>
          {label}
        </p>

        {sublabel && (
          <p className={temaDia ? "mt-0.5 text-xs font-semibold uppercase tracking-widest text-slate-500" : "mt-0.5 text-xs font-semibold uppercase tracking-widest text-slate-500"}>
            {sublabel}
          </p>
        )}

        {file ? (
          <div className={temaDia ? "mt-4 flex w-full max-w-xs items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2" : "mt-4 flex w-full max-w-xs items-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2"}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={temaDia ? "text-emerald-700" : "text-emerald-100"}
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <p className={temaDia ? "flex-1 truncate text-xs font-semibold text-emerald-700" : "flex-1 truncate text-xs font-semibold text-emerald-100"}>
              {file.name}
            </p>
          </div>
        ) : (
          <p className={temaDia ? "mt-3 text-sm text-slate-500" : "mt-3 text-sm text-slate-400"}>
            {isDrag ? "Solte o arquivo aqui" : "Arraste o arquivo ou selecione abaixo"}
          </p>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={temaDia ? "mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100" : "mt-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"}
        >
          {file ? "Trocar arquivo" : "Selecionar arquivo"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

export default function ConferenciaFolhaPage() {
  const { temaDia } = useTema();
  const [fopag, setFopag] = useState<File | null>(null);
  const [previa, setPrevia] = useState<File | null>(null);
  const [competencia, setCompetencia] = useState("");
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [fopagDrag, setFopagDrag] = useState(false);
  const [previaDrag, setPreviewDrag] = useState(false);

  const fopagRef = useRef<HTMLInputElement>(null);
  const previaRef = useRef<HTMLInputElement>(null);

  const competencias = useMemo(() => {
    const hoje = new Date();

    return Array.from({ length: 5 }, (_, index) => {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + index - 2, 1);
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const ano = data.getFullYear();

      return `${mes}/${ano}`;
    });
  }, []);

  useEffect(() => {
    setCompetencia(competencias[2]);
  }, [competencias]);

  useEffect(() => {
    if (!loading) return;

    setProgresso(10);

    const interval = setInterval(() => {
      setProgresso((atual) => {
        if (atual >= 90) return atual;
        return atual + 8;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [loading]);

  async function analisarLocalmente() {
    if (!fopag || !previa) return;

    setMensagem("Arquivo grande detectado. Processando no navegador...");

    const resultado = await analisarNoNavegador({
      fopag,
      previa,
      competencia,
    });

    baixarBlob(resultado.blob, competencia);

    fetch("/api/conferencia-folha/auditoria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resultado.auditoria),
    }).catch(() => null);

    setProgresso(100);

    setTimeout(() => {
      setLoading(false);
      setProgresso(0);
      setMensagem(null);
    }, 600);
  }

  async function analisar() {
    if (!fopag || !previa) {
      setMensagem("Envie a FOPAG e a PRÉVIA antes de analisar.");
      return;
    }

    setLoading(true);
    setMensagem(null);

    const formData = new FormData();

    formData.append("fopag", fopag);
    formData.append("previa", previa);
    formData.append("competencia", competencia);

    let response: Response;

    try {
      response = await fetch("/api/conferencia-folha", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      setLoading(false);
      setProgresso(0);
      setMensagem(`Erro de conexão: ${String(error)}`);
      return;
    }

    if (!response.ok) {
      let mensagemErroApi = "Erro ao gerar relatório.";

      try {
        const erroTexto = await response.text();
        const erro = erroTexto ? JSON.parse(erroTexto) : null;

        mensagemErroApi =
          erro?.error ||
          erro?.message ||
          (erroTexto ? erroTexto.slice(0, 180) : mensagemErroApi);
      } catch {
        mensagemErroApi = `${mensagemErroApi} Status ${response.status}.`;
      }

      if (response.status === 413) {
        try {
          await analisarLocalmente();
        } catch (error) {
          setLoading(false);
          setProgresso(0);
          setMensagem(`Erro ao gerar relatório no navegador: ${String(error)}`);
        }

        return;
      }

      setLoading(false);
      setProgresso(0);
      setMensagem(`Erro ao gerar relatório: ${mensagemErroApi}`);

      return;
    }

    try {
      setProgresso(100);

      const blob = await response.blob();
      baixarBlob(blob, competencia);

      setTimeout(() => {
        setLoading(false);
        setProgresso(0);
        setMensagem(null);
      }, 600);
    } catch (error) {
      setLoading(false);
      setProgresso(0);
      setMensagem(`Erro ao baixar relatório: ${String(error)}`);
    }
  }

  const mensagemErro = mensagem?.startsWith("Erro") || mensagem?.startsWith("Envie");

  return (
    <main className={temaDia ? "min-h-screen min-w-0 bg-[#f4f6fb] p-8 text-slate-950" : "min-h-screen min-w-0 bg-[#11141b] p-8 text-slate-100"}>
      <section className={temaDia ? "overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef3fb_58%,#e8edf6_100%)] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)]" : "overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"}>
        <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.32em] text-slate-400"}>
          Módulo VOXX
        </p>
        <h1 className={temaDia ? "mt-3 text-4xl font-semibold tracking-tight text-slate-950" : "mt-3 text-4xl font-semibold tracking-tight text-white"}>
          Análise FOPAG
        </h1>
        <p className={temaDia ? "mt-2 max-w-2xl text-sm leading-6 text-slate-600" : "mt-2 max-w-2xl text-sm leading-6 text-slate-300"}>
          Compare a FOPAG com a prévia da folha e baixe o relatório de
          conferência em Excel.
        </p>
      </section>

      {mostrarInfo && (
        <section className={temaDia ? "mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]" : "mt-6 rounded-[24px] border border-blue-300/20 bg-blue-300/[0.07] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"}>
          <p className={temaDia ? "mb-3 text-xs font-bold uppercase tracking-widest text-slate-700" : "mb-3 text-xs font-bold uppercase tracking-widest text-blue-100"}>
            Requisitos da prévia
          </p>
          <ul className={temaDia ? "grid gap-2 text-sm text-slate-600 md:grid-cols-2" : "grid gap-2 text-sm text-blue-50 md:grid-cols-2"}>
            {[
              "A aba DINAMICA é ignorada automaticamente.",
              "O sistema detecta automaticamente a aba principal da prévia.",
              "A prévia deve conter: MATRÍCULA, RUBRICA e COMPETENCIA.",
              "As abas FERIAS e DESLIGADOS são opcionais.",
              "Competência no formato MM/AAAA.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className={temaDia ? "mt-1 text-slate-400" : "mt-1 text-blue-200"}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,520px)_1fr]">
        <div className={temaDia ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Competência
              </p>
              <p className={temaDia ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-slate-300"}>
                Selecione o mês da conferência.
              </p>
            </div>

            <select
              value={competencia}
              onChange={(event) => setCompetencia(event.target.value)}
              className={temaDia ? "h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 [&>option]:bg-white [&>option]:text-slate-900" : "h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-slate-100 outline-none transition [color-scheme:dark] focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [&>option]:bg-[#171a23] [&>option]:text-slate-100"}
            >
              {competencias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <a
              href="/modelos/modelo_fopag.xlsx"
              download
              className={temaDia ? "flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100" : "flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1]"}
            >
              Modelo FOPAG
            </a>

            <button
              type="button"
              onClick={() => setMostrarInfo((valorAtual) => !valorAtual)}
              className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" : "rounded-2xl border border-blue-300/25 bg-blue-300/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-300/20"}
            >
              Requisitos
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <UploadCard
              label="FOPAG"
              sublabel="Folha de pagamento"
              file={fopag}
              inputRef={fopagRef}
              onFile={setFopag}
              isDrag={fopagDrag}
              onDragEnter={() => setFopagDrag(true)}
              onDragLeave={() => setFopagDrag(false)}
            />

            <UploadCard
              label="PRÉVIA"
              sublabel="Arquivo de conferência"
              file={previa}
              inputRef={previaRef}
              onFile={setPrevia}
              isDrag={previaDrag}
              onDragEnter={() => setPreviewDrag(true)}
              onDragLeave={() => setPreviewDrag(false)}
            />
          </div>

          {loading && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className={temaDia ? "text-xs font-semibold text-slate-500" : "text-xs font-semibold text-slate-400"}>
                  Analisando arquivos...
                </span>
                <span className={temaDia ? "text-xs font-bold text-slate-700" : "text-xs font-bold text-slate-200"}>
                  {progresso}%
                </span>
              </div>
              <div className={temaDia ? "h-2 w-full overflow-hidden rounded-full bg-slate-200" : "h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"}>
                <div
                  className={temaDia ? "h-full rounded-full bg-gradient-to-r from-slate-950 to-slate-600 transition-all duration-300" : "h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300 transition-all duration-300"}
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={analisar}
            disabled={loading}
            className={temaDia ? "mt-6 w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-[0_12px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" : "mt-6 w-full rounded-2xl bg-white py-4 text-sm font-bold text-slate-950 shadow-[0_12px_34px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"}
          >
            {loading ? "Analisando..." : "Analisar e baixar relatório"}
          </button>

          {mensagem && (
            <div
              className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
                mensagemErro
                  ? "border-red-300/25 bg-red-400/10 text-red-100"
                  : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  mensagemErro ? "bg-red-400/15" : "bg-emerald-300/15"
                }`}
              >
                {mensagemErro ? (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-semibold">{mensagem}</p>
            </div>
          )}
        </div>

        <aside className={temaDia ? "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "rounded-[28px] border border-white/10 bg-[#171a23] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]"}>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            Fluxo da análise
          </p>
          <h2 className={temaDia ? "mt-3 text-2xl font-semibold tracking-tight text-slate-950" : "mt-3 text-2xl font-semibold tracking-tight text-white"}>
            Conferência em três passos
          </h2>

          <div className="mt-6 grid gap-4">
            {[
              ["1", "Baixe o modelo", "Use o arquivo modelo da FOPAG quando precisar padronizar a origem."],
              ["2", "Envie os arquivos", "Carregue a FOPAG e a prévia no formato Excel."],
              ["3", "Baixe o resultado", "O VOXX compara os arquivos e entrega o relatório pronto."],
            ].map(([numero, titulo, descricao]) => (
              <div
                key={numero}
                className={temaDia ? "rounded-[22px] border border-slate-200 bg-slate-50 p-4" : "rounded-[22px] border border-white/10 bg-white/[0.05] p-4"}
              >
                <div className="flex items-start gap-3">
                  <span className={temaDia ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-700" : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-300/25 bg-blue-300/10 text-sm font-bold text-blue-100"}>
                    {numero}
                  </span>
                  <div>
                    <p className={temaDia ? "font-semibold text-slate-950" : "font-semibold text-slate-100"}>{titulo}</p>
                    <p className={temaDia ? "mt-1 text-sm leading-6 text-slate-600" : "mt-1 text-sm leading-6 text-slate-400"}>
                      {descricao}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
