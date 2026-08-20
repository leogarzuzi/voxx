import "server-only";
import path from "node:path";
import { enviarEmail } from "@/lib/email";

type Participante = { papel: string; nome: string; matricula: string };
type Plantao = { papel?: string; data: string; tipo: string };

type NotificacaoMedica = {
  evento: "criada" | "cancelada" | "reenvio";
  modalidade: "substituicao" | "troca";
  protocolo: string;
  status: "recebido" | "cancelado";
  destinatarios: string[];
  solicitante: Participante;
  participante: Participante;
  plantoes: Plantao[];
};

function escapar(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatarData(valor: string) {
  const [ano, mes, dia] = String(valor).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

export async function notificarSolicitacaoMedica(dados: NotificacaoMedica) {
  const destinatarios = [
    ...new Set(
      dados.destinatarios
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (!destinatarios.length) throw new Error("Nenhum destinatário informado.");

  const cancelada = dados.status === "cancelado";
  const cor = cancelada ? "#b91c1c" : "#008fbd";
  const fundoStatus = cancelada ? "#fef2f2" : "#ecfeff";
  const tituloStatus = cancelada
    ? "SOLICITAÇÃO CANCELADA"
    : "SOLICITAÇÃO RECEBIDA";
  const modalidade =
    dados.modalidade === "troca" ? "Troca médica" : "Substituição médica";
  const prefixo =
    dados.evento === "reenvio"
      ? "Reenvio"
      : dados.evento === "cancelada"
        ? "Cancelamento"
        : "Confirmação";

  const participantesHtml = [dados.solicitante, dados.participante]
    .map(
      (pessoa) => `
        <td style="width:50%;vertical-align:top;padding:16px;border:1px solid #dbe5ee;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;">${escapar(pessoa.papel)}</div>
          <div style="margin-top:7px;font-size:15px;font-weight:700;color:#102a43;">${escapar(pessoa.nome)}</div>
          <div style="margin-top:4px;font-size:13px;color:#52677a;">Matrícula ${escapar(pessoa.matricula)}</div>
        </td>`,
    )
    .join("");
  const plantoesHtml = dados.plantoes
    .map(
      (plantao) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e7edf3;font-size:13px;color:#52677a;">${escapar(plantao.papel || "Plantão")}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e7edf3;font-size:13px;font-weight:700;color:#102a43;text-align:right;">${escapar(formatarData(plantao.data))} · ${escapar(plantao.tipo)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;background:#eef6fa;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6fa;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dce8ef;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px rgba(15,45,75,.10);">
        <tr><td align="center" style="padding:28px 24px 18px;"><img src="cid:logo-gazolla" alt="Hospital Municipal Ronaldo Gazolla" width="250" style="display:block;max-width:100%;height:auto;"></td></tr>
        <tr><td style="padding:0 28px 28px;">
          <div style="border-radius:12px;background:${fundoStatus};border:1px solid ${cor}33;padding:12px;text-align:center;font-size:12px;font-weight:800;letter-spacing:.08em;color:${cor};">${tituloStatus}</div>
          <h1 style="margin:22px 0 6px;text-align:center;font-size:22px;color:#102a43;">${escapar(modalidade)}</h1>
          <p style="margin:0;text-align:center;font-size:13px;color:#64748b;">${escapar(prefixo)} de protocolo · Recursos Humanos | HMRG</p>
          <div style="margin:22px 0;border-radius:12px;background:#f5f9fc;padding:17px;text-align:center;">
            <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;">Protocolo</div>
            <div style="margin-top:7px;font-size:19px;font-weight:800;color:${cor};">${escapar(dados.protocolo)}</div>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;"><tr>${participantesHtml}</tr></table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border:1px solid #dbe5ee;border-collapse:collapse;border-radius:12px;overflow:hidden;">${plantoesHtml}</table>
          <p style="margin:22px 0 0;font-size:12px;line-height:1.6;text-align:center;color:#64748b;">Esta é uma mensagem automática. Em caso de divergência, procure o RH do Hospital Municipal Ronaldo Gazolla.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const texto = `${tituloStatus}\n\n${modalidade}\nProtocolo: ${dados.protocolo}\n\n${dados.solicitante.papel}: ${dados.solicitante.nome} (${dados.solicitante.matricula})\n${dados.participante.papel}: ${dados.participante.nome} (${dados.participante.matricula})\n\n${dados.plantoes.map((p) => `${p.papel || "Plantão"}: ${formatarData(p.data)} · ${p.tipo}`).join("\n")}\n\nEm caso de divergência, procure o RH.`;
  const logo = path.join(process.cwd(), "public", "logo-ronaldo-gazolla.png");

  return Promise.all(
    destinatarios.map((para) =>
      enviarEmail({
        para,
        assunto: `${prefixo} · ${dados.protocolo} · ${cancelada ? "CANCELADO" : modalidade}`,
        texto,
        html,
        anexos: [
          {
            filename: "logo-ronaldo-gazolla.png",
            path: logo,
            cid: "logo-gazolla",
          },
        ],
      }),
    ),
  );
}
