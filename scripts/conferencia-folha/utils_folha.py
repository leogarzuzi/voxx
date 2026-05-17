import re
from datetime import datetime


def limpar_matricula(matricula):
    if matricula is None:
        return ""

    matricula = str(matricula)

    return re.sub(r"\D", "", matricula)


def identificar_contrato(pref):
    pref = str(pref).strip()

    if pref == "95":
        return "95"

    return "OUTROS"


def normalizar_rubrica(rubrica):
    if rubrica is None:
        return ""

    return str(rubrica).strip()


def normalizar_competencia(valor):
    if valor is None:
        return None

    # Quando o pandas já lê como data
    if hasattr(valor, "month") and hasattr(valor, "year"):
        return f"{valor.month:02d}/{valor.year}"

    valor = str(valor).strip()

    formatos = [
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y-%m-%d",
    ]

    for formato in formatos:
        try:
            data = datetime.strptime(valor, formato)
            return f"{data.month:02d}/{data.year}"
        except:
            pass

    return None