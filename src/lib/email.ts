import "server-only";
import nodemailer from "nodemailer";

type EnviarEmailOpcoes = {
  para: string | string[];
  assunto: string;
  texto: string;
  html?: string;
  responderPara?: string;
  anexos?: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
};

function configuracaoSmtp() {
  const host = process.env.SMTP_HOST?.trim();
  const porta = Number(process.env.SMTP_PORT || "465");
  const usuario = process.env.SMTP_USER?.trim();
  const senha = process.env.SMTP_PASSWORD?.replace(/\s/g, "");
  const remetente = process.env.SMTP_FROM?.trim();

  if (!host || !usuario || !senha || !remetente || !Number.isInteger(porta)) {
    throw new Error("Configuração SMTP incompleta.");
  }

  return {
    host,
    porta,
    usuario,
    senha,
    remetente,
    seguro: process.env.SMTP_SECURE !== "false",
  };
}

function criarTransportador() {
  const smtp = configuracaoSmtp();
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.porta,
    secure: smtp.seguro,
    auth: {
      user: smtp.usuario,
      pass: smtp.senha,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export async function verificarSmtp() {
  await criarTransportador().verify();
}

export async function enviarEmail({
  para,
  assunto,
  texto,
  html,
  responderPara,
  anexos,
}: EnviarEmailOpcoes) {
  const smtp = configuracaoSmtp();
  const resultado = await criarTransportador().sendMail({
    from: smtp.remetente,
    to: para,
    subject: assunto,
    text: texto,
    html,
    replyTo: responderPara,
    attachments: anexos,
  });

  return { id: resultado.messageId, aceitos: resultado.accepted.length };
}
