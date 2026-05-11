export function classificarDivisao(cargo: string | null | undefined) {
  const texto = String(cargo ?? "").toUpperCase();

  if (texto.includes("MEDICO") || texto.includes("MÉDICO")) {
    return "DIV. MÉDICA";
  }

  if (
    texto.includes("ENFERMEIRO") ||
    texto.includes("TECNICO DE ENFERMAGEM") ||
    texto.includes("TÉCNICO DE ENFERMAGEM") ||
    texto.includes("INSTRUMENTADOR")
  ) {
    return "DIV. DE ENFERMAGEM";
  }

  if (
    texto.includes("PSICOLOGO") ||
    texto.includes("PSICÓLOGO") ||
    texto.includes("FARMACEUTICO") ||
    texto.includes("FARMACÊUTICO") ||
    texto.includes("FISIOTERAPEUTA") ||
    texto.includes("NUTRICIONISTA") ||
    texto.includes("DENTISTA") ||
    texto.includes("ASSISTENTE SOCIAL") ||
    texto.includes("FONOAUDIOLOGO") ||
    texto.includes("FONOAUDIÓLOGO")
  ) {
    return "DIV. MULTIDISCIPLINAR";
  }

  if (texto.includes("LIMPEZA")) {
    return "HIGIENE";
  }

  return "OUTROS";
}