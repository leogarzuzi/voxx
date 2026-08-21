import "server-only";
import PDFDocument from "pdfkit";
import { obterLogoGazollaBranca } from "@/lib/logoInstitucional";

export type ParticipanteMemorando = {
  papel: string;
  nome: string;
  matricula: string;
};

export type PlantaoMemorando = {
  papel: string;
  data: string;
  tipo: string;
};

export type DadosComprovanteMemorando = {
  modalidade: "troca_plantao" | "banco_horas";
  protocolo: string;
  status: string;
  participantes: ParticipanteMemorando[];
  plantoes: PlantaoMemorando[];
};

const AZUL = "#13335A";
const AZUL_MEDIO = "#2A688F";
const CIANO = "#42B9EB";
const CINZA = "#ECEDED";
const TEXTO = "#263648";

function textoSeguro(valor: unknown) {
  return String(valor ?? "").trim() || "Não informado";
}

function formatarData(valor: string) {
  const [ano, mes, dia] = String(valor).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

function informacaoStatus(status: string) {
  const normalizado = status.toLowerCase();
  if (normalizado === "cancelado") {
    return { titulo: "REGISTRO CANCELADO", cor: "#B42318", fundo: "#FFF1F0" };
  }
  if (normalizado === "alterado") {
    return { titulo: "REGISTRO ALTERADO", cor: "#A15C00", fundo: "#FFF7E6" };
  }
  return { titulo: "SOLICITAÇÃO RECEBIDA", cor: AZUL_MEDIO, fundo: "#EFF8FC" };
}

function caixaParticipante(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  largura: number,
  pessoa: ParticipanteMemorando,
) {
  doc.roundedRect(x, y, largura, 105, 8).fillAndStroke("#F7F9FB", "#D9E1E8");
  doc
    .fillColor(AZUL_MEDIO)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(textoSeguro(pessoa.papel).toUpperCase(), x + 14, y + 14, {
      width: largura - 28,
      characterSpacing: 0.6,
    });
  doc
    .fillColor(AZUL)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(textoSeguro(pessoa.nome), x + 14, y + 34, {
      width: largura - 28,
    });
  doc
    .fillColor("#607284")
    .font("Helvetica")
    .fontSize(9)
    .text(`Matrícula ${textoSeguro(pessoa.matricula)}`, x + 14, y + 82, {
      width: largura - 28,
    });
}

export function nomeArquivoComprovante(protocolo: string) {
  const seguro = protocolo.replace(/[^A-Za-z0-9-]/g, "-");
  return `comprovante-${seguro}.pdf`;
}

export async function gerarComprovanteMemorandoPdf(
  dados: DadosComprovanteMemorando,
) {
  const tituloModalidade =
    dados.modalidade === "troca_plantao" ? "Troca de plantão" : "Banco de horas";
  const status = informacaoStatus(dados.status);
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Comprovante ${dados.protocolo}`,
      Author: "Recursos Humanos | HMRG",
      Subject: `Comprovante de ${tituloModalidade.toLowerCase()}`,
    },
  });
  const partes: Buffer[] = [];
  doc.on("data", (parte) => partes.push(Buffer.from(parte)));
  const concluido = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
  });

  const largura = doc.page.width;
  const margem = 46;
  const conteudo = largura - margem * 2;
  const logo = await obterLogoGazollaBranca();

  doc.rect(0, 0, largura, 132).fill(AZUL);
  doc.image(logo, margem, 37, { fit: [252, 58], valign: "center" });
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("RECURSOS HUMANOS", 337, 47, {
      width: 210,
      align: "right",
      characterSpacing: 1,
    });
  doc
    .fillColor("#DCE8F3")
    .font("Helvetica")
    .fontSize(9)
    .text("Hospital Municipal Ronaldo Gazolla", 315, 67, {
      width: 232,
      align: "right",
    });

  doc.rect(0, 132, largura, 82).fill(status.cor);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(status.titulo, margem, 155, {
      width: conteudo,
      align: "center",
      characterSpacing: 0.5,
    });
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(textoSeguro(dados.protocolo), margem, 182, {
      width: conteudo,
      align: "center",
    });

  let y = 246;
  doc
    .fillColor(AZUL)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(tituloModalidade, margem, y);
  doc
    .fillColor("#647587")
    .font("Helvetica")
    .fontSize(9)
    .text("Comprovante emitido pelo Recursos Humanos | HMRG", margem, y + 28);
  doc.rect(margem, y + 52, 4, 34).fill(CIANO);
  doc
    .fillColor(TEXTO)
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Este documento apresenta os dados registrados eletronicamente para este protocolo.",
      margem + 14,
      y + 60,
      { width: conteudo - 14 },
    );

  y += 129;
  const intervalo = 12;
  const larguraCaixa =
    dados.participantes.length === 1
      ? conteudo
      : (conteudo - intervalo) / dados.participantes.length;
  dados.participantes.forEach((participante, indice) => {
    caixaParticipante(
      doc,
      margem + indice * (larguraCaixa + intervalo),
      y,
      larguraCaixa,
      participante,
    );
  });

  y += 126;
  doc
    .fillColor(AZUL)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("DADOS DOS PLANTÕES", margem, y);
  y += 21;
  dados.plantoes.forEach((plantao, indice) => {
    const linhaY = y + indice * 42;
    doc
      .roundedRect(margem, linhaY, conteudo, 34, 6)
      .fill(indice % 2 ? "#FFFFFF" : "#F4F7F9");
    doc
      .fillColor("#647587")
      .font("Helvetica")
      .fontSize(9)
      .text(textoSeguro(plantao.papel), margem + 12, linhaY + 11, {
        width: 230,
      });
    doc
      .fillColor(AZUL)
      .font("Helvetica-Bold")
      .text(
        `${formatarData(plantao.data)}  |  ${textoSeguro(plantao.tipo)}`,
        margem + 250,
        linhaY + 11,
        { width: conteudo - 262, align: "right" },
      );
  });

  y += dados.plantoes.length * 42 + 34;
  doc
    .roundedRect(margem, y, conteudo, 62, 8)
    .fillAndStroke(status.fundo, status.cor);
  doc
    .fillColor(status.cor)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(status.titulo, margem + 14, y + 14);
  doc
    .fillColor(TEXTO)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Guarde este comprovante. Em caso de divergência, procure o RH do Hospital Municipal Ronaldo Gazolla.",
      margem + 14,
      y + 33,
      { width: conteudo - 28 },
    );

  doc.rect(0, 792, largura, 50).fill(CINZA);
  doc
    .fillColor("#667788")
    .font("Helvetica")
    .fontSize(8)
    .text("Documento gerado automaticamente.", margem, 806, {
      width: conteudo,
    });
  doc
    .fillColor(AZUL)
    .font("Helvetica-Bold")
    .text("Recursos Humanos | HMRG", margem, 820, { width: conteudo });

  doc.end();
  return concluido;
}
