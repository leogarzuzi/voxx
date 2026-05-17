import pandas as pd
from pathlib import Path

import regras_folhas
import utils_folha


PASTA_ATUAL = Path(__file__).parent
PASTA_INPUT = PASTA_ATUAL / "input"
PASTA_OUTPUT = PASTA_ATUAL / "output"

ARQUIVO_FOPAG = PASTA_INPUT / "FOPAG.xlsx"
ARQUIVO_PREVIA = PASTA_INPUT / "PREVIA.xls"

COMPETENCIA_ANALISE = "05/2026"


def carregar_ferias(fopag):
    try:
        df = pd.read_excel(fopag, sheet_name="FERIAS")
        df.columns = [str(col).strip().upper() for col in df.columns]

        if "MATRICULA" not in df.columns:
            return set()

        df = df[df["MATRICULA"].notna()].copy()
        df["MATRICULA_LIMPA"] = df["MATRICULA"].apply(utils_folha.limpar_matricula)

        return set(df["MATRICULA_LIMPA"])
    except:
        return set()


def ler_aba_fopag(fopag, nome_aba):
    df = pd.read_excel(fopag, sheet_name=nome_aba)
    df.columns = [str(col).strip().upper() for col in df.columns]

    if "MATRICULA" not in df.columns:
        return pd.DataFrame()

    df = df[df["MATRICULA"].notna()].copy()

    df["ABA_FOPAG"] = nome_aba
    df["MATRICULA_LIMPA"] = df["MATRICULA"].apply(utils_folha.limpar_matricula)
    df["CONTRATO"] = df["PREF"].apply(utils_folha.identificar_contrato)
    df["RUBRICA_ESPERADA"] = df["CONTRATO"].apply(
        lambda contrato: regras_folhas.RUBRICAS[nome_aba][contrato]
    )

    return df


def verificar_enviado_nao_pago(fopag_tratada, previa_filtrada, ferias_set):
    erros = []

    previa_chaves = set(
        zip(previa_filtrada["MATRICULA_LIMPA"], previa_filtrada["RUBRICA_LIMPA"])
    )

    matriculas_na_previa = set(previa_filtrada["MATRICULA_LIMPA"])

    for _, linha in fopag_tratada.iterrows():
        matricula = linha["MATRICULA_LIMPA"]
        rubrica = linha["RUBRICA_ESPERADA"]

        if (
            linha["ABA_FOPAG"] in regras_folhas.ABAS_CONFERENCIA_SIMPLES
            and matricula in ferias_set
        ):
            continue

        if matricula not in matriculas_na_previa:
            tipo_erro = "MATRICULA_NAO_CONSTA_NA_PREVIA"
            detalhe = "Matrícula enviada na FOPAG, mas não existe na prévia da sede."

        elif (matricula, rubrica) not in previa_chaves:
            if (
                matricula in ferias_set
                and linha["ABA_FOPAG"] in regras_folhas.ABAS_CONFERENCIA_DUPLA
            ):
                tipo_erro = "ENVIADO_NAO_PAGO(FERIAS)"
                detalhe = "Rubrica enviada, mas colaborador está de férias na competência."
            else:
                tipo_erro = "ENVIADO_NAO_PAGO"
                detalhe = "Rubrica enviada na FOPAG, mas não foi encontrada na prévia."

        else:
            continue

        erros.append({
            "TIPO_ERRO": tipo_erro,
            "COMPETENCIA": COMPETENCIA_ANALISE,
            "ABA_FOPAG": linha["ABA_FOPAG"],
            "PREF": linha.get("PREF", ""),
            "MATRICULA": linha.get("MATRICULA", ""),
            "MATRICULA_LIMPA": matricula,
            "NOME": linha.get("NOME", ""),
            "RUBRICA_ESPERADA": rubrica,
            "DETALHE": detalhe,
        })

    return erros

def verificar_pago_nao_enviado(fopag_tratada, previa_filtrada):
    erros = []

    rubrica_para_aba = {}

    for aba in regras_folhas.ABAS_CONFERENCIA_DUPLA:
        rubrica_para_aba[regras_folhas.RUBRICAS[aba]["95"]] = aba
        rubrica_para_aba[regras_folhas.RUBRICAS[aba]["OUTROS"]] = aba

    for _, linha_previa in previa_filtrada.iterrows():
        rubrica = linha_previa["RUBRICA_LIMPA"]

        if rubrica not in rubrica_para_aba:
            continue

        aba_esperada = rubrica_para_aba[rubrica]
        matricula = linha_previa["MATRICULA_LIMPA"]

        existe_na_fopag = fopag_tratada[
            (fopag_tratada["ABA_FOPAG"] == aba_esperada)
            & (fopag_tratada["MATRICULA_LIMPA"] == matricula)
        ]

        if not existe_na_fopag.empty:
            continue

        erros.append({
            "TIPO_ERRO": "PAGO_NAO_ENVIADO",
            "COMPETENCIA": COMPETENCIA_ANALISE,
            "ABA_FOPAG": aba_esperada,
            "PREF": linha_previa.get("PREFIXO", ""),
            "MATRICULA": linha_previa.get("MATRICULA", ""),
            "MATRICULA_LIMPA": matricula,
            "NOME": linha_previa.get("NOME", ""),
            "RUBRICA_ESPERADA": rubrica,
            "DETALHE": "Rubrica paga na prévia, mas não encontrada na FOPAG.",
        })

    return erros

def main():
    print("Iniciando conferência de folha...")
    print(f"Competência analisada: {COMPETENCIA_ANALISE}")

    fopag = pd.ExcelFile(ARQUIVO_FOPAG)
    previa = pd.read_excel(ARQUIVO_PREVIA)

    ferias_set = carregar_ferias(fopag)
    print(f"Colaboradores em férias: {len(ferias_set)}")

    previa["MATRICULA_LIMPA"] = previa["MATRICULA"].apply(utils_folha.limpar_matricula)
    previa["RUBRICA_LIMPA"] = previa["RUBRICA"].apply(utils_folha.normalizar_rubrica)
    previa["COMPETENCIA_LIMPA"] = previa["COMPETENCIA"].apply(utils_folha.normalizar_competencia)

    previa_filtrada = previa[previa["COMPETENCIA_LIMPA"] == COMPETENCIA_ANALISE]

    abas_para_ler = (
        regras_folhas.ABAS_CONFERENCIA_DUPLA
        + regras_folhas.ABAS_CONFERENCIA_SIMPLES
    )

    fopag_tratada = []

    for aba in abas_para_ler:
        df_aba = ler_aba_fopag(fopag, aba)
        print(f"{aba}: {len(df_aba)} linhas")
        fopag_tratada.append(df_aba)

    fopag_tratada = pd.concat(fopag_tratada, ignore_index=True)

    erros_enviado = verificar_enviado_nao_pago(
        fopag_tratada,
        previa_filtrada,
        ferias_set
    )

    erros_pago = verificar_pago_nao_enviado(
        fopag_tratada,
        previa_filtrada
    )

    erros = erros_enviado + erros_pago

    print(f"\nLinhas na prévia da competência {COMPETENCIA_ANALISE}: {len(previa_filtrada)}")
    print(f"Total de lançamentos FOPAG: {len(fopag_tratada)}")
    print(f"Erros encontrados: {len(erros)}")

    if erros:
        erros_df = pd.DataFrame(erros)

        PASTA_OUTPUT.mkdir(exist_ok=True)

        caminho_saida = PASTA_OUTPUT / f"resultado_conferencia_{COMPETENCIA_ANALISE.replace('/', '-')}.xlsx"

        erros_df.to_excel(caminho_saida, index=False)

        print("\nRelatório gerado em:")
        print(caminho_saida)
    else:
        print("\nNenhum erro encontrado.")


if __name__ == "__main__":
    main()
    