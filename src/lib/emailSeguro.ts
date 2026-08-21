export const EMAIL_TAMANHO_MAXIMO = 254;

export function normalizarEmail(valor: unknown) {
  return String(valor ?? "").trim().toLowerCase();
}

export function emailTemFormatoValido(email: string) {
  if (!email || email.length > EMAIL_TAMANHO_MAXIMO) return false;

  let indiceArroba = -1;

  for (let indice = 0; indice < email.length; indice += 1) {
    const caractere = email[indice];

    if (caractere.trim() === "") return false;

    if (caractere === "@") {
      if (indiceArroba !== -1) return false;
      indiceArroba = indice;
    }
  }

  if (indiceArroba <= 0 || indiceArroba === email.length - 1) return false;

  const dominio = email.slice(indiceArroba + 1);
  const ultimoPonto = dominio.lastIndexOf(".");

  return ultimoPonto > 0 && dominio.length - ultimoPonto - 1 >= 2;
}
