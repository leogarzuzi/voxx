import { timingSafeEqual } from "node:crypto";

export function cronAutorizado(request: Request) {
  const segredo = process.env.CRON_SECRET;
  const cabecalho = request.headers.get("authorization");

  if (!segredo || segredo.length < 32 || !cabecalho?.startsWith("Bearer ")) {
    return false;
  }

  const recebido = cabecalho.slice(7);
  const esperadoBuffer = Buffer.from(segredo);
  const recebidoBuffer = Buffer.from(recebido);

  return (
    esperadoBuffer.length === recebidoBuffer.length &&
    timingSafeEqual(esperadoBuffer, recebidoBuffer)
  );
}
