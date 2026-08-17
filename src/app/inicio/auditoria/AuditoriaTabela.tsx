"use client";

import { useEffect, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type AuditoriaLog = {
  id: number;
  usuario_email: string | null;
  usuario_id: string | null;
  acao: string;
  modulo: string;
  detalhes: Record<string, any> | null;
  criado_em: string;
};

const CHAVES_ALTERACAO = new Set([
  "alteracoes",
  "camposAlterados",
  "statusAnterior",
  "statusNovo",
  "antes",
  "depois",
]);

function formatarAcao(acao: string) {
  const mapa: Record<string, string> = {
    APROVACAO_ACESSO: "Acesso aprovado",
    CONFERENCIA_FOLHA_EXECUTADA: "Conferência de folha executada",

    DESLIGAMENTO_CRIADO: "Desligamento criado",
    DESLIGAMENTO_EDITADO: "Desligamento editado",
    DESLIGAMENTO_DATA_ASO_ALTERADA: "Data do ASO alterada",
    DESLIGAMENTO_DATA_HOMOLOGACAO_ALTERADA: "Data da homologação alterada",
    DESLIGAMENTO_ENVIADO_SEDE: "Desligamento enviado para SEDE",
    DESLIGAMENTO_COMPUTADO_BASE: "Desligamento computado na base",

    TRANSFERENCIA_CRIADA: "Transferência criada",
    TRANSFERENCIA_EDITADA: "Transferência editada",
    TRANSFERENCIA_STATUS_ALTERADO: "Status da transferência alterado",

    PERMUTA_CRIADA: "Permuta criada",
    PERMUTA_EDITADA: "Permuta editada",
    PERMUTA_STATUS_ALTERADO: "Status da permuta alterado",

    TROCA_PLANTAO_CRIADA: "Troca de plantão criada",
    TROCA_PLANTAO_EDITADA: "Troca de plantão editada",
    TROCA_PLANTAO_CANCELADA: "Troca de plantão cancelada",
    BANCO_HORAS_CRIADO: "Banco de horas criado",
    BANCO_HORAS_EDITADO: "Banco de horas editado",
    BANCO_HORAS_CANCELADO: "Banco de horas cancelado",

    ADMISSAO_CRIADA: "Nova admissão cadastrada",
    ADMISSAO_EDITADA: "Admissão editada",
  };

  return mapa[acao] || acao;
}

function formatarModulo(modulo: string) {
  const mapa: Record<string, string> = {
    solicitacoes_acesso: "Solicitações de acesso",
    conferencia_folha: "Conferência de folha",
    admissao: "Admissão",
    desligamento: "Desligamento",
    transferencia: "Transferência",
    permuta: "Permuta",
    central_memorandos: "Central de memorandos",
  };

  return mapa[modulo] || modulo;
}

function corModulo(modulo: string, temaDia: boolean) {
  const mapaNoite: Record<string, string> = {
    solicitacoes_acesso: "border-sky-300/25 bg-sky-300/10 text-sky-100",
    conferencia_folha: "border-violet-300/25 bg-violet-300/10 text-violet-100",
    admissao: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    desligamento: "border-red-300/25 bg-red-300/10 text-red-100",
    transferencia: "border-blue-300/25 bg-blue-300/10 text-blue-100",
    permuta: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    central_memorandos: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  };

  const mapaDia: Record<string, string> = {
    solicitacoes_acesso: "border-sky-200 bg-sky-50 text-sky-700",
    conferencia_folha: "border-violet-200 bg-violet-50 text-violet-700",
    admissao: "border-emerald-200 bg-emerald-50 text-emerald-700",
    desligamento: "border-red-200 bg-red-50 text-red-700",
    transferencia: "border-blue-200 bg-blue-50 text-blue-700",
    permuta: "border-amber-200 bg-amber-50 text-amber-700",
    central_memorandos: "border-cyan-200 bg-cyan-50 text-cyan-700",
  };

  return temaDia
    ? mapaDia[modulo] || "border-slate-200 bg-slate-50 text-slate-700"
    : mapaNoite[modulo] || "border-white/15 bg-white/[0.06] text-slate-200";
}

function formatarDetalhes(detalhes: Record<string, any> | null) {
  if (!detalhes) return [];

  const labels: Record<string, string> = {
    solicitacaoId: "ID da solicitação",
    nomeAprovado: "Nome aprovado",
    emailAprovado: "E-mail aprovado",
    perfilConcedido: "Perfil concedido",

    competencia: "Competência",
    abaPrevia: "Aba da prévia",
    linhasPrevia: "Linhas na prévia",
    lancamentosFopag: "Lançamentos FOPAG",
    colaboradoresFerias: "Colaboradores em férias",
    colaboradoresDesligados: "Colaboradores desligados",
    totalDivergencias: "Total de divergências",
    arquivoFopag: "Arquivo FOPAG",
    arquivoPrevia: "Arquivo prévia",

    admissaoId: "ID da admissão",
    nome: "Nome",
    matricula: "Matrícula",
    cargo: "Cargo",
    baseDestino: "Base de destino",
    camposAlterados: "Campos alterados",

    desligamentoId: "ID do desligamento",
    transferenciaId: "ID da transferência",
    permutaId: "ID da permuta",
    trocaPlantaoId: "ID da troca de plantão",
    bancoHorasId: "ID do banco de horas",
    protocolo: "Protocolo",
    dataPlantaoSolicitante: "Plantão solicitante",
    dataPlantaoSolicitado: "Plantão solicitado",
    tipoPlantaoSolicitante: "Tipo do plantão solicitante",
    tipoPlantaoSolicitado: "Tipo do plantão solicitado",
    dataPlantaoOriginal: "Plantão original",
    tipoPlantaoOriginal: "Tipo do plantão original",
    dataNovoPlantao: "Novo plantão",
    tipoNovoPlantao: "Tipo do novo plantão",
    matriculaSaida: "Matrícula de quem sai",
    nomeSaida: "Nome de quem sai",
    matriculaEntrada: "Matrícula de quem entra",
    nomeEntrada: "Nome de quem entra",
    unidadeOrigem: "Unidade de origem",
    inicioHmrg: "Início no HMRG",
    tipoDesligamento: "Tipo de desligamento",
    tipoMovimento: "Tipo de movimento",
    cedente: "Cedente",
    cessionario: "Cessionário",
    inicioNovaUnidade: "Início na nova unidade",
    status: "Status",
    statusAnterior: "Status anterior",
    statusNovo: "Novo status",
    dataDesligamento: "Data do desligamento",
    baseOrigem: "Base de origem",
    alteracoes: "Alterações",
    antes: "Antes",
    depois: "Depois",
  };

  const nomesCampos: Record<string, string> = {
    pref: "Prefixo",
    matricula: "Matrícula",
    nome: "Nome",
    cargo: "Cargo",
    ch_edital: "CH do edital",
    alteracao_ch: "Alteração de CH",
    ch_final: "CH final",
    sirg: "SIRG",
    horario: "Horário",
    exercicio: "Exercício",
    data_nascimento: "Data de nascimento",
    cpf: "CPF",
    pis: "PIS",
    edital: "Edital",
    email: "E-mail",
    registro_ponto: "Registro de ponto",
    base_destino: "Base de destino",
    enviar_email_colaborador: "Enviar e-mail ao colaborador",
    observacao: "Observação",
  };

  const valoresBonitos: Record<string, string> = {
    colaboradores: "Colaboradores",
    gestao_rh: "Gestão RH",
  };

  return Object.entries(detalhes).map(([chave, valor]) => {
    let valorFormatado = "";

    if (Array.isArray(valor)) {
      valorFormatado = valor.map((item) => nomesCampos[item] || item).join(", ");
    } else if (typeof valor === "boolean") {
      valorFormatado = valor ? "Sim" : "Não";
    } else if (typeof valor === "object" && valor !== null) {
      valorFormatado = JSON.stringify(valor);
    } else {
      valorFormatado = String(valor ?? "");
    }

    if (chave === "baseDestino" || chave === "baseOrigem") {
      valorFormatado = valoresBonitos[valorFormatado] || valorFormatado;
    }

    return {
      chave,
      label: labels[chave] || chave,
      valor: valorFormatado,
    };
  });
}

function formatarValorVisual(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "Vazio";

  const texto = String(valor);

  if (texto === "VAZIO") return "Vazio";
  if (texto === "SIM") return "Sim";
  if (texto === "NAO" || texto === "NÃO") return "Não";

  return texto;
}

function obterAlteracoesDetalhadas(detalhes: Record<string, any> | null) {
  if (!detalhes) return [];

  if (Array.isArray(detalhes.alteracoes)) {
    return detalhes.alteracoes
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        campo: String(item.label || item.campo || "Campo alterado"),
        antes: formatarValorVisual(item.antes),
        depois: formatarValorVisual(item.depois),
      }));
  }

  if (
    detalhes.statusAnterior !== undefined ||
    detalhes.statusNovo !== undefined
  ) {
    return [
      {
        campo: "Status",
        antes: formatarValorVisual(detalhes.statusAnterior),
        depois: formatarValorVisual(detalhes.statusNovo),
      },
    ];
  }

  return [];
}

function obterCamposAlteradosSemComparacao(
  detalhes: Record<string, any> | null
) {
  if (!detalhes || !Array.isArray(detalhes.camposAlterados)) return [];
  if (Array.isArray(detalhes.alteracoes) && detalhes.alteracoes.length > 0) {
    return [];
  }

  return detalhes.camposAlterados.map((campo) => formatarValorVisual(campo));
}

export default function AuditoriaTabela() {
  const { temaDia } = useTema();
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [usuario, setUsuario] = useState("");
  const [acao, setAcao] = useState("");
  const [modulo, setModulo] = useState("");

  async function buscarLogs(filtros?: {
    dataInicial?: string;
    dataFinal?: string;
    usuario?: string;
    acao?: string;
    modulo?: string;
  }) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();

    if (filtros?.dataInicial) params.set("dataInicial", filtros.dataInicial);
    if (filtros?.dataFinal) params.set("dataFinal", filtros.dataFinal);
    if (filtros?.usuario) params.set("usuario", filtros.usuario);
    if (filtros?.acao) params.set("acao", filtros.acao);
    if (filtros?.modulo) params.set("modulo", filtros.modulo);

    const url = params.toString()
      ? `/api/auditoria?${params.toString()}`
      : "/api/auditoria";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao buscar auditoria.");
      setLogs([]);
      setLoading(false);
      return;
    }

    setLogs(resultado.logs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    buscarLogs();
  }, []);

  function aplicarFiltros() {
    buscarLogs({
      dataInicial,
      dataFinal,
      usuario,
      acao,
      modulo,
    });
  }

  function limparFiltros() {
    setDataInicial("");
    setDataFinal("");
    setUsuario("");
    setAcao("");
    setModulo("");
    buscarLogs();
  }

  const camposFormulario = "voxx-field mt-1 h-11 w-full rounded-2xl px-3 text-sm";

  return (
    <>
      <section className="voxx-auditoria voxx-surface mt-6 rounded-[26px] p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--voxx-primary)]">
              Filtros
            </p>
            <h2 className="voxx-text-primary mt-1 text-xl font-bold">
              Refinar registros
            </h2>
          </div>

          <p className="voxx-text-muted text-sm">
            Exibindo até 50 registros encontrados no banco.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className={camposFormulario}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Data final
            </label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className={camposFormulario}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Usuário
            </label>
            <input
              type="text"
              placeholder="Buscar usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={camposFormulario}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Ação
            </label>
            <select
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              className={camposFormulario}
            >
              <option value="">Todas</option>
              <option value="APROVACAO_ACESSO">Acesso aprovado</option>
              <option value="CONFERENCIA_FOLHA_EXECUTADA">
                Conferência de folha executada
              </option>
              <option value="ADMISSAO_CRIADA">Nova admissão cadastrada</option>
              <option value="ADMISSAO_EDITADA">Admissão editada</option>
              <option value="DESLIGAMENTO_CRIADO">Desligamento criado</option>
              <option value="DESLIGAMENTO_EDITADO">Desligamento editado</option>
              <option value="DESLIGAMENTO_DATA_ASO_ALTERADA">
                Data do ASO alterada
              </option>
              <option value="DESLIGAMENTO_DATA_HOMOLOGACAO_ALTERADA">
                Data da homologação alterada
              </option>
              <option value="TRANSFERENCIA_CRIADA">Transferência criada</option>
              <option value="TRANSFERENCIA_EDITADA">Transferência editada</option>
              <option value="TRANSFERENCIA_STATUS_ALTERADO">
                Status da transferência alterado
              </option>
              <option value="PERMUTA_CRIADA">Permuta criada</option>
              <option value="PERMUTA_EDITADA">Permuta editada</option>
              <option value="PERMUTA_STATUS_ALTERADO">
                Status da permuta alterado
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Módulo
            </label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className={camposFormulario}
            >
              <option value="">Todos</option>
              <option value="solicitacoes_acesso">Solicitações de acesso</option>
              <option value="conferencia_folha">Conferência de folha</option>
              <option value="admissao">Admissão</option>
              <option value="desligamento">Desligamento</option>
              <option value="transferencia">Transferência</option>
              <option value="permuta">Permuta</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={limparFiltros}
            className="voxx-button-secondary rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Limpar filtros
          </button>

          <button
            type="button"
            onClick={aplicarFiltros}
            className="voxx-button-primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
          >
            Buscar
          </button>
        </div>
      </section>

      <section className="voxx-auditoria voxx-surface mt-6 overflow-hidden rounded-[26px]">
        <div className="flex flex-col gap-2 border-b border-[var(--voxx-border)] px-6 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--voxx-primary)]">
              Histórico
            </p>
            <h2 className="voxx-text-primary mt-1 text-xl font-bold">
              Registros de auditoria
            </h2>
            <p className="voxx-text-muted mt-1 text-sm">
              Últimos 50 eventos, ou últimos 50 resultados dos filtros aplicados.
            </p>
          </div>

          <div className="voxx-text-primary rounded-full border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-4 py-2 text-sm font-semibold">
            {logs.length} registro{logs.length === 1 ? "" : "s"}
          </div>
        </div>

        {erro && (
          <p className="m-4 rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
            {erro}
          </p>
        )}

        {loading ? (
          <p className={temaDia ? "px-6 py-10 text-center text-sm text-slate-500" : "px-6 py-10 text-center text-sm text-slate-400"}>
            Carregando auditoria...
          </p>
        ) : (
          <div className="space-y-3 p-4">
            {logs.length === 0 ? (
              <div className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500" : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-slate-400"}>
                Nenhum registro encontrado com os filtros selecionados.
              </div>
            ) : (
              logs.map((log) => {
                const chavesOcultas = new Set(CHAVES_ALTERACAO);

                if (
                  log.detalhes?.statusAnterior !== undefined ||
                  log.detalhes?.statusNovo !== undefined
                ) {
                  chavesOcultas.add("status");
                }

                const detalhesFormatados = formatarDetalhes(log.detalhes).filter(
                  (item) => !chavesOcultas.has(item.chave)
                );
                const alteracoesDetalhadas = obterAlteracoesDetalhadas(
                  log.detalhes
                );
                const camposAlteradosSemComparacao =
                  obterCamposAlteradosSemComparacao(log.detalhes);
                const temDetalhes =
                  detalhesFormatados.length > 0 ||
                  alteracoesDetalhadas.length > 0 ||
                  camposAlteradosSemComparacao.length > 0;

                return (
                  <article
                    key={log.id}
                    className={temaDia ? "rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50" : "rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-white/20 hover:bg-white/[0.07]"}
                  >
                    <div className="grid gap-4 lg:grid-cols-[170px_minmax(210px,1fr)_minmax(180px,0.9fr)_150px]">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Data/Hora
                        </p>
                        <p className={temaDia ? "mt-2 text-sm font-medium text-slate-700" : "mt-2 text-sm font-medium text-slate-200"}>
                          {new Date(log.criado_em).toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Usuário
                        </p>
                        <p className={temaDia ? "mt-2 break-all text-sm text-slate-600" : "mt-2 break-all text-sm text-slate-300"}>
                          {log.usuario_email || "Sistema"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Ação
                        </p>
                        <p className={temaDia ? "mt-2 text-sm font-semibold text-slate-950" : "mt-2 text-sm font-semibold text-white"}>
                          {formatarAcao(log.acao)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Módulo
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${corModulo(
                            log.modulo,
                            temaDia
                          )}`}
                        >
                          {formatarModulo(log.modulo)}
                        </span>
                      </div>
                    </div>

                    <div className={temaDia ? "mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4" : "mt-4 space-y-4 rounded-2xl border border-white/10 bg-black/[0.16] p-4"}>
                      {!temDetalhes ? (
                        <span className={temaDia ? "text-sm text-slate-500" : "text-sm text-slate-500"}>
                          Sem detalhes.
                        </span>
                      ) : (
                        <>
                          {alteracoesDetalhadas.length > 0 && (
                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    O que mudou
                                  </p>
                                  <p className={temaDia ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-slate-300"}>
                                    Comparação direta entre o valor anterior e o
                                    valor salvo.
                                  </p>
                                </div>
                              </div>

                              <div className={temaDia ? "overflow-hidden rounded-2xl border border-slate-200" : "overflow-hidden rounded-2xl border border-white/10"}>
                                <div className={temaDia ? "grid grid-cols-[minmax(130px,0.8fr)_minmax(160px,1fr)_minmax(160px,1fr)] bg-slate-100 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500" : "grid grid-cols-[minmax(130px,0.8fr)_minmax(160px,1fr)_minmax(160px,1fr)] bg-white/[0.06] text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400"}>
                                  <div className="px-3 py-2">Campo</div>
                                  <div className="border-l border-white/10 px-3 py-2">
                                    Antes
                                  </div>
                                  <div className="border-l border-white/10 px-3 py-2">
                                    Depois
                                  </div>
                                </div>

                                {alteracoesDetalhadas.map((item, index) => (
                                  <div
                                    key={`${item.campo}-${index}`}
                                    className={temaDia ? "grid grid-cols-[minmax(130px,0.8fr)_minmax(160px,1fr)_minmax(160px,1fr)] border-t border-slate-200 text-xs" : "grid grid-cols-[minmax(130px,0.8fr)_minmax(160px,1fr)_minmax(160px,1fr)] border-t border-white/10 text-xs"}
                                  >
                                    <div className={temaDia ? "px-3 py-3 font-semibold text-slate-950" : "px-3 py-3 font-semibold text-white"}>
                                      {item.campo}
                                    </div>
                                    <div className={temaDia ? "break-words border-l border-slate-200 px-3 py-3 text-slate-500" : "break-words border-l border-white/10 px-3 py-3 text-slate-400"}>
                                      {item.antes}
                                    </div>
                                    <div className={temaDia ? "break-words border-l border-slate-200 px-3 py-3 font-semibold text-emerald-700" : "break-words border-l border-white/10 px-3 py-3 font-semibold text-emerald-100"}>
                                      {item.depois}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {camposAlteradosSemComparacao.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Campos alterados
                              </p>
                              <p className={temaDia ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-slate-300"}>
                                Esse registro informa quais campos mudaram, mas
                                ainda não trouxe o antes/depois salvo na
                                auditoria.
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {camposAlteradosSemComparacao.map((campo) => (
                                  <span
                                    key={campo}
                                    className={temaDia ? "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700" : "rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200"}
                                  >
                                    {campo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {detalhesFormatados.length > 0 && (
                            <div>
                              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Resumo do registro
                              </p>

                              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                {detalhesFormatados.map((item) => (
                                  <div
                                    key={item.label}
                                    className={temaDia ? "min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2" : "min-w-0 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2"}
                                  >
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      {item.label}
                                    </p>
                                    <p className={temaDia ? "mt-1 break-words text-xs leading-5 text-slate-700" : "mt-1 break-words text-xs leading-5 text-slate-100"}>
                                      {item.valor || "-"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>
    </>
  );
}







