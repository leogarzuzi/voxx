import "server-only";
import { enviarEmail } from "@/lib/email";
import { gerarComprovanteMedicoPdf } from "@/lib/comprovanteMedicoPdf";
import { obterLogoGazollaBranca } from "@/lib/logoInstitucional";

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
  const cor = cancelada ? "#b42318" : "#2a688f";
  const fundoStatus = cancelada ? "#fff1f0" : "#2a688f";
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
        <td style="width:50%;vertical-align:top;padding:16px;border:1px solid #d9e1e8;background:#f7f9fb;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#2a688f;text-transform:uppercase;">${escapar(pessoa.papel)}</div>
          <div style="margin-top:7px;font-size:15px;font-weight:700;color:#13335a;">${escapar(pessoa.nome)}</div>
          <div style="margin-top:4px;font-size:13px;color:#607284;">Matrícula ${escapar(pessoa.matricula)}</div>
        </td>`,
    )
    .join("");
  const plantoesHtml = dados.plantoes
    .map(
      (plantao) => `
        <tr>
          <td style="padding:11px 14px;border-bottom:1px solid #e1e7ec;font-size:13px;color:#607284;">${escapar(plantao.papel || "Plantão")}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e1e7ec;font-size:13px;font-weight:700;color:#13335a;text-align:right;">${escapar(formatarData(plantao.data))} · ${escapar(plantao.tipo)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;background:#eceded;font-family:Arial,Helvetica,sans-serif;color:#263648;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceded;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d7dde2;overflow:hidden;">
        <tr><td align="center" style="background:#13335a;padding:30px 24px;"><img src="cid:logo-gazolla" alt="Hospital Municipal Ronaldo Gazolla" width="280" style="display:block;max-width:100%;height:auto;"></td></tr>
        <tr><td align="center" style="background:${fundoStatus};padding:22px 24px;color:#ffffff;">
          <div style="font-size:20px;font-weight:800;letter-spacing:.02em;">${tituloStatus}</div>
          <div style="margin-top:8px;font-size:14px;font-weight:700;">${escapar(dados.protocolo)}</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 6px;font-size:22px;color:#13335a;">${escapar(modalidade)}</h1>
          <p style="margin:0;font-size:13px;color:#607284;">${escapar(prefixo)} de protocolo · Recursos Humanos | HMRG</p>
          <div style="margin:22px 0;border-left:4px solid #42b9eb;background:#f7f9fb;padding:14px 16px;font-size:13px;line-height:1.6;color:#3e5265;">
            Este comunicado confirma os dados registrados na solicitação. O comprovante em PDF segue anexado para consulta ou impressão.
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;"><tr>${participantesHtml}</tr></table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border:1px solid #dbe5ee;border-collapse:collapse;border-radius:12px;overflow:hidden;">${plantoesHtml}</table>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#607284;">Esta é uma mensagem automática. Em caso de divergência, procure o RH do Hospital Municipal Ronaldo Gazolla.</p>
        </td></tr>
        <tr><td style="background:#eceded;padding:14px 28px;font-size:11px;font-weight:700;color:#13335a;">Recursos Humanos | HMRG</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const texto = `${tituloStatus}\n\n${modalidade}\nProtocolo: ${dados.protocolo}\n\n${dados.solicitante.papel}: ${dados.solicitante.nome} (${dados.solicitante.matricula})\n${dados.participante.papel}: ${dados.participante.nome} (${dados.participante.matricula})\n\n${dados.plantoes.map((p) => `${p.papel || "Plantão"}: ${formatarData(p.data)} · ${p.tipo}`).join("\n")}\n\nEm caso de divergência, procure o RH.`;
  const logo = await obterLogoGazollaBranca();
  const comprovante = await gerarComprovanteMedicoPdf(dados);

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
            content: logo,
            cid: "logo-gazolla",
            contentType: "image/png",
          },
          {
            filename: `comprovante-${dados.protocolo.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`,
            content: comprovante,
            contentType: "application/pdf",
          },
        ],
      }),
    ),
  );
}
