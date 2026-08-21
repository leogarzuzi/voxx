import "server-only";
import PDFDocument from "pdfkit";
import { obterLogoGazollaBranca } from "@/lib/logoInstitucional";

type ParticipantePdf = { papel: string; nome: string; matricula: string };
type PlantaoPdf = { papel?: string; data: string; tipo: string };

type DadosComprovante = {
  modalidade: "substituicao" | "troca";
  protocolo: string;
  status: "recebido" | "cancelado";
  solicitante: ParticipantePdf;
  participante: ParticipantePdf;
  plantoes: PlantaoPdf[];
};

const AZUL = "#13335A";
const AZUL_MEDIO = "#2A688F";
const CIANO = "#42B9EB";
const CINZA = "#ECEDED";
const TEXTO = "#263648";
const VERMELHO = "#B42318";

function formatarData(valor: string) {
  const [ano, mes, dia] = String(valor).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

function textoSeguro(valor: unknown) {
  return String(valor ?? "").trim() || "Não informado";
}

function caixaParticipante(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  largura: number,
  pessoa: ParticipantePdf,
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
    .text(textoSeguro(pessoa.nome), x + 14, y + 34, { width: largura - 28 });
  doc
    .fillColor("#607284")
    .font("Helvetica")
    .fontSize(9)
    .text(`Matrícula ${textoSeguro(pessoa.matricula)}`, x + 14, y + 82, {
      width: largura - 28,
    });
}

export async function gerarComprovanteMedicoPdf(dados: DadosComprovante) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Comprovante ${dados.protocolo}`,
      Author: "Recursos Humanos | HMRG",
      Subject: "Comprovante de solicitação médica",
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
  const cancelada = dados.status === "cancelado";
  const corStatus = cancelada ? VERMELHO : AZUL_MEDIO;
  const tituloStatus = cancelada ? "SOLICITAÇÃO CANCELADA" : "SOLICITAÇÃO RECEBIDA";
  const modalidade =
    dados.modalidade === "troca" ? "Troca médica" : "Substituição médica";
  const logo = await obterLogoGazollaBranca();

  doc.rect(0, 0, largura, 132).fill(AZUL);
  doc.image(logo, margem, 37, { fit: [252, 58], valign: "center" });
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("RECURSOS HUMANOS", 337, 47, { width: 210, align: "right", characterSpacing: 1 });
  doc
    .fillColor("#DCE8F3")
    .font("Helvetica")
    .fontSize(9)
    .text("Hospital Municipal Ronaldo Gazolla", 315, 67, { width: 232, align: "right" });

  doc.rect(0, 132, largura, 82).fill(corStatus);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(tituloStatus, margem, 155, { width: conteudo, align: "center", characterSpacing: 0.5 });
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(dados.protocolo, margem, 182, { width: conteudo, align: "center" });

  let y = 246;
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(19).text(modalidade, margem, y);
  doc
    .fillColor("#647587")
    .font("Helvetica")
    .fontSize(9)
    .text("Comprovante de registro emitido pelo Recursos Humanos | HMRG", margem, y + 28);
  doc.rect(margem, y + 52, 4, 34).fill(CIANO);
  doc
    .fillColor(TEXTO)
    .font("Helvetica")
    .fontSize(10)
    .text("Este documento apresenta os dados informados no registro eletrônico da solicitação.", margem + 14, y + 60, { width: conteudo - 14 });

  y += 129;
  const intervalo = 12;
  const larguraCaixa = (conteudo - intervalo) / 2;
  caixaParticipante(doc, margem, y, larguraCaixa, dados.solicitante);
  caixaParticipante(doc, margem + larguraCaixa + intervalo, y, larguraCaixa, dados.participante);

  y += 112;
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(11).text("DADOS DO PLANTÃO", margem, y);
  y += 21;
  dados.plantoes.forEach((plantao, indice) => {
    const linhaY = y + indice * 42;
    doc.roundedRect(margem, linhaY, conteudo, 34, 6).fill(indice % 2 ? "#FFFFFF" : "#F4F7F9");
    doc
      .fillColor("#647587")
      .font("Helvetica")
      .fontSize(9)
      .text(textoSeguro(plantao.papel || "Plantão"), margem + 12, linhaY + 11, { width: 230 });
    doc
      .fillColor(AZUL)
      .font("Helvetica-Bold")
      .text(`${formatarData(plantao.data)}  |  ${textoSeguro(plantao.tipo)}`, margem + 250, linhaY + 11, { width: conteudo - 262, align: "right" });
  });

  y += dados.plantoes.length * 42 + 34;
  doc.roundedRect(margem, y, conteudo, 62, 8).fillAndStroke(cancelada ? "#FFF1F0" : "#EFF8FC", cancelada ? "#F3B8B4" : "#B9DDEA");
  doc
    .fillColor(corStatus)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(cancelada ? "REGISTRO CANCELADO" : "REGISTRO CONFIRMADO", margem + 14, y + 14);
  doc
    .fillColor(TEXTO)
    .font("Helvetica")
    .fontSize(9)
    .text(
      cancelada
        ? "Este protocolo foi cancelado e permanece disponível apenas para consulta e comprovação."
        : "Guarde este comprovante. Em caso de divergência, procure o RH do Hospital Municipal Ronaldo Gazolla.",
      margem + 14,
      y + 33,
      { width: conteudo - 28 },
    );

  doc.rect(0, 792, largura, 50).fill(CINZA);
  doc
    .fillColor("#667788")
    .font("Helvetica")
    .fontSize(8)
    .text("Documento gerado automaticamente.", margem, 806, { width: conteudo });
  doc
    .fillColor(AZUL)
    .font("Helvetica-Bold")
    .text("Recursos Humanos | HMRG", margem, 820, { width: conteudo });

  doc.end();
  return concluido;
}
