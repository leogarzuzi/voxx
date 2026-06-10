"use client";

import { useEffect, useState } from "react";

type AuditoriaLog = {
  id: number;
  usuario_email: string | null;
  usuario_id: string | null;
  acao: string;
  modulo: string;
  detalhes: Record<string, any> | null;
  criado_em: string;
};

function formatarAcao(acao: string) {
  const mapa: Record<string, string> = {
    APROVACAO_ACESSO: "Aprovação de acesso",
    CONFERENCIA_FOLHA_EXECUTADA: "Conferência de folha executada",
  };

  return mapa[acao] || acao;
}

function formatarModulo(modulo: string) {
  const mapa: Record<string, string> = {
    solicitacoes_acesso: "Solicitações de acesso",
    conferencia_folha: "Conferência de folha",
  };

  return mapa[modulo] || modulo;
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
  };

  return Object.entries(detalhes).map(([chave, valor]) => ({
    label: labels[chave] || chave,
    valor: String(valor),
  }));
}

export default function AuditoriaTabela() {
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

  return (
    <>
      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Data final
            </label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Usuário
            </label>
            <input
              type="text"
              placeholder="email@exemplo.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Ação
            </label>
            <select
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Todas</option>
              <option value="APROVACAO_ACESSO">Aprovação de acesso</option>
              <option value="CONFERENCIA_FOLHA_EXECUTADA">
                Conferência de folha executada
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Módulo
            </label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Todos</option>
              <option value="solicitacoes_acesso">
                Solicitações de acesso
              </option>
              <option value="conferencia_folha">Conferência de folha</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Exibindo até 50 registros encontrados no banco.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Limpar filtros
            </button>

            <button
              type="button"
              onClick={aplicarFiltros}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Buscar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Registros de auditoria
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Últimos 50 eventos, ou últimos 50 resultados dos filtros aplicados.
          </p>
        </div>

        {erro && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Carregando auditoria...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Data/Hora</th>
                  <th className="py-3">Usuário</th>
                  <th className="py-3">Ação</th>
                  <th className="py-3">Módulo</th>
                  <th className="py-3">Detalhes</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => {
                  const detalhesFormatados = formatarDetalhes(log.detalhes);

                  return (
                    <tr key={log.id} className="border-b align-top">
                      <td className="py-4 whitespace-nowrap text-gray-700">
                        {new Date(log.criado_em).toLocaleString("pt-BR")}
                      </td>

                      <td className="py-4 text-gray-700">
                        {log.usuario_email || "Sistema"}
                      </td>

                      <td className="py-4 font-medium text-blue-700">
                        {formatarAcao(log.acao)}
                      </td>

                      <td className="py-4 text-gray-700">
                        {formatarModulo(log.modulo)}
                      </td>

                      <td className="py-4">
                        <div className="max-w-xl rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                          {detalhesFormatados.length > 0 ? (
                            <div className="space-y-1">
                              {detalhesFormatados.map((item) => (
                                <div key={item.label}>
                                  <span className="font-semibold">
                                    {item.label}:
                                  </span>{" "}
                                  {item.valor}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              Sem detalhes.
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-gray-500"
                    >
                      Nenhum registro encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}