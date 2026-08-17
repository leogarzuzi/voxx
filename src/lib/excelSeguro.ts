import ExcelJS from "exceljs";

export type LinhaPlanilha = Record<string, unknown>;

function valorCelula(valor: ExcelJS.CellValue): unknown {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object" && "result" in valor) return valor.result ?? "";
  if (typeof valor === "object" && "text" in valor) return valor.text;
  if (typeof valor === "object" && "richText" in valor) {
    return valor.richText.map((parte) => parte.text).join("");
  }
  return valor;
}

export async function carregarWorkbook(buffer: ArrayBuffer | Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ExcelJS.Buffer);
  return workbook;
}

export function sheetToJson(workbook: ExcelJS.Workbook, sheetName: string) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, coluna) => {
    headers[coluna] = String(valorCelula(cell.value));
  });

  const rows: LinhaPlanilha[] = [];
  sheet.eachRow((row, numero) => {
    if (numero === 1) return;
    const item: LinhaPlanilha = {};
    headers.forEach((header, coluna) => {
      if (header) item[header] = valorCelula(row.getCell(coluna).value);
    });
    rows.push(item);
  });
  return rows;
}

export function nomesAbas(workbook: ExcelJS.Workbook) {
  return workbook.worksheets.map((sheet) => sheet.name);
}

export function criarWorkbook() {
  return new ExcelJS.Workbook();
}

export function criarAbaEstilizada(
  workbook: ExcelJS.Workbook,
  dados: LinhaPlanilha[],
  nomeAba: string
) {
  const sheet = workbook.addWorksheet(nomeAba.substring(0, 31));
  const colunas = Object.keys(dados[0] || {});

  if (colunas.length) {
    sheet.addRow(colunas);
    dados.forEach((item) => sheet.addRow(colunas.map((chave) => item[chave] ?? "")));
  }

  sheet.columns.forEach((column) => { column.width = 24; });
  sheet.eachRow((row, numero) => {
    row.height = 35;
    row.eachCell({ includeEmpty: true }, (cell) => {
      const cabecalho = numero === 1;
      cell.font = {
        name: "Calibri",
        size: cabecalho ? 14 : 11,
        bold: cabecalho,
        color: { argb: "FF000000" },
      };
      if (cabecalho) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9EAF7" },
        };
      }
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9D9D9" } },
        bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        left: { style: "thin", color: { argb: "FFD9D9D9" } },
        right: { style: "thin", color: { argb: "FFD9D9D9" } },
      };
    });
  });
}

export async function escreverWorkbook(workbook: ExcelJS.Workbook) {
  return workbook.xlsx.writeBuffer();
}

export type WorkbookSeguro = ExcelJS.Workbook;
