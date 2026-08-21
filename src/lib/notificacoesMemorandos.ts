import "server-only";
import { enviarEmail } from "@/lib/email";
import {
  gerarComprovanteMemorandoPdf,
  nomeArquivoComprovante,
  type DadosComprovanteMemorando,
} from "@/lib/comprovanteMemorandoPdf";
import { emailTemFormatoValido, normalizarEmail } from "@/lib/emailSeguro";
import { obterLogoGazollaBranca } from "@/lib/logoInstitucional";

type NotificacaoMemorando = {
  destinatarios: string[];
  dados: DadosComprovanteMemorando;
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

export async function notificarMemorandoCriado({
  destinatarios,
  dados,
}: NotificacaoMemorando) {
  const emails = [
    ...new Set(
      destinatarios
        .map(normalizarEmail)
        .filter((email) => emailTemFormatoValido(email)),
    ),
  ];
  if (!emails.length) throw new Error("Nenhum destinatário válido informado.");

  const modalidade =
    dados.modalidade === "troca_plantao" ? "Troca de plantão" : "Banco de horas";
  const participantesHtml = dados.participantes
    .map(
      (pessoa) => `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e1e7ec;color:#607284;">${escapar(pessoa.papel)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e1e7ec;font-weight:700;color:#13335a;text-align:right;">${escapar(pessoa.nome)} · ${escapar(pessoa.matricula)}</td>
      </tr>`,
    )
    .join("");
  const plantoesHtml = dados.plantoes
    .map(
      (plantao) => `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e1e7ec;color:#607284;">${escapar(plantao.papel)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e1e7ec;font-weight:700;color:#13335a;text-align:right;">${escapar(formatarData(plantao.data))} · ${escapar(plantao.tipo)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;background:#eceded;font-family:Arial,Helvetica,sans-serif;color:#263648;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceded;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d7dde2;overflow:hidden;">
        <tr><td align="center" style="background:#13335a;padding:30px 24px;"><img src="cid:logo-gazolla" alt="Hospital Municipal Ronaldo Gazolla" width="280" style="display:block;max-width:100%;height:auto;"></td></tr>
        <tr><td align="center" style="background:#2a688f;padding:22px 24px;color:#ffffff;">
          <div style="font-size:20px;font-weight:800;">SOLICITAÇÃO RECEBIDA</div>
          <div style="margin-top:8px;font-size:14px;font-weight:700;">${escapar(dados.protocolo)}</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 6px;font-size:22px;color:#13335a;">${escapar(modalidade)}</h1>
          <p style="margin:0;font-size:13px;color:#607284;">Confirmação de protocolo · Recursos Humanos | HMRG</p>
          <div style="margin:22px 0;border-left:4px solid #42b9eb;background:#f7f9fb;padding:14px 16px;font-size:13px;line-height:1.6;color:#3e5265;">
            Sua solicitação foi registrada. O comprovante em PDF segue anexado para consulta ou impressão.
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe5ee;border-collapse:collapse;">${participantesHtml}</table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border:1px solid #dbe5ee;border-collapse:collapse;">${plantoesHtml}</table>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#607284;">Esta é uma mensagem automática. Em caso de divergência, procure o RH do Hospital Municipal Ronaldo Gazolla.</p>
        </td></tr>
        <tr><td style="background:#eceded;padding:14px 28px;font-size:11px;font-weight:700;color:#13335a;">Recursos Humanos | HMRG</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const texto = `SOLICITAÇÃO RECEBIDA\n\n${modalidade}\nProtocolo: ${dados.protocolo}\n\n${dados.participantes.map((pessoa) => `${pessoa.papel}: ${pessoa.nome} (${pessoa.matricula})`).join("\n")}\n\n${dados.plantoes.map((plantao) => `${plantao.papel}: ${formatarData(plantao.data)} · ${plantao.tipo}`).join("\n")}\n\nEm caso de divergência, procure o RH.`;
  const [logo, comprovante] = await Promise.all([
    obterLogoGazollaBranca(),
    gerarComprovanteMemorandoPdf(dados),
  ]);

  return Promise.all(
    emails.map((para) =>
      enviarEmail({
        para,
        assunto: `Confirmação · ${dados.protocolo} · ${modalidade}`,
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
            filename: nomeArquivoComprovante(dados.protocolo),
            content: comprovante,
            contentType: "application/pdf",
          },
        ],
      }),
    ),
  );
}
