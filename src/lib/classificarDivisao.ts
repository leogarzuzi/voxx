function normalizarCargo(cargo: string | null | undefined) {
  return String(cargo ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function classificarDivisao(cargo: string | null | undefined) {
  const texto = normalizarCargo(cargo);

  if (texto.includes("MEDICO")) {
    return "DIV. MÉDICA";
  }

  if (
    texto.includes("ENFERM") ||
    texto.includes("TEC ENF") ||
    texto.includes("TECNICO ENF") ||
    texto.includes("TECNICO DE ENF") ||
    texto.includes("INSTRUMENTADOR")
  ) {
    return "DIV. DE ENFERMAGEM";
  }

  if (
    texto.includes("PSICOLOGO") ||
    texto.includes("FARMACEUTICO") ||
    texto.includes("FISIOTERAPEUTA") ||
    texto.includes("NUTRICIONISTA") ||
    texto.includes("DENTISTA") ||
    texto.includes("ASSISTENTE SOCIAL") ||
    texto.includes("FONOAUDIOLOGO")
  ) {
    return "DIV. MULTIDISCIPLINAR";
  }

  if (texto.includes("LIMPEZA")) {
    return "HIGIENE";
  }

  return "OUTROS";
}
