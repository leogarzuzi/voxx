import "server-only";
import path from "node:path";
import sharp from "sharp";

let logoBranca: Promise<Buffer> | null = null;

export function obterLogoGazollaBranca() {
  if (logoBranca) return logoBranca;

  logoBranca = (async () => {
    const arquivo = path.join(
      process.cwd(),
      "public",
      "logo-ronaldo-gazolla.png",
    );
    const { data, info } = await sharp(arquivo)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let indice = 0; indice < data.length; indice += info.channels) {
      data[indice] = 255;
      data[indice + 1] = 255;
      data[indice + 2] = 255;
    }

    return sharp(data, { raw: info }).png().toBuffer();
  })();

  return logoBranca;
}
