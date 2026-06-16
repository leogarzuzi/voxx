"use client";

import { useEffect, useMemo, useState } from "react";

type ColaboradorGestaoRh = {
  id: number;
  pref: string | null;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  carga_horaria: string | null;
  exercicio: string | null;
  cpf: string | null;
  created_at: string | null;
};

type FiltroAtivo = {
  campo: string;
  label: string;
  valores: string[];
};

const CAMPOS_FILTRO = [
  { campo: "pref", label: "Pref." },
  { campo: "matricula", label: "Matrícula" },
  { campo: "nome", label: "Nome" },
  { campo: "cargo", label: "Cargo/Função" },
  { campo: "carga_horaria", label: "Carga horária" },
  { campo: "exercicio", label: "Exercício" },
  { campo: "cpf", label: "CPF" },
];

function texto(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return String(valor);
}

function resumirValores(valores: string[]) {
  if (valores.length <= 3) {
    return valores.join(", ");
  }

  return `${valores.slice(0, 3).join(", ")} +${valores.length - 3}`;
}

function formatarValorExcel(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined) {
    return "";
  }

  const valorTexto = String(valor).replaceAll('"', '""');

  return `"${valorTexto}"`;
}

function gerarNomeArquivoExcel() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  return `base-gestao-rh-voxx-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
}

export default function BaseGestaoRhTabela() {
  const [colaboradores, setColaboradores] = useState<ColaboradorGestaoRh[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modoTodos, setModoTodos] = useState(false);
  const [exportando, setExportando] = useState(false);

  const [filtrosAtivos, setFiltrosAtivos] = useState<FiltroAtivo[]>([]);

  const [modalFiltroAberto, setModalFiltroAberto] = useState(false);
  const [campoSelecionado, setCampoSelecionado] = useState("");
  const [opcoesFiltro, setOpcoesFiltro] = useState<string[]>([]);
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<string[]>([]);
  const [buscaOpcoes, setBuscaOpcoes] = useState("");
  const [loadingOpcoes, setLoadingOpcoes] = useState(false);
  const [erroOpcoes, setErroOpcoes] = useState("");
  const [mensagemFiltro, setMensagemFiltro] = useState("");

  const opcoesFiltradas = useMemo(() => {
    const termo = buscaOpcoes.trim().toLowerCase();

    if (!termo) return opcoesFiltro;

    return opcoesFiltro.filter((opcao) =>
      opcao.toLowerCase().includes(termo)
    );
  }, [opcoesFiltro, buscaOpcoes]);

  async function buscarColaboradores(
    valorBusca?: string,
    carregarTodos = false,
    filtrosParaUsar = filtrosAtivos
  ) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();
    const termoBusca = valorBusca ?? busca;

    if (termoBusca.trim()) {
      params.set("busca", termoBusca.trim());
    }

    if (carregarTodos) {
      params.set("todos", "1");
    }

    if (filtrosParaUsar.length > 0) {
      params.set(
        "filtros",
        JSON.stringify(
          filtrosParaUsar.map((filtro) => ({
            campo: filtro.campo,
            valores: filtro.valores,
          }))
        )
      );
    }

    const url = params.toString()
      ? `/api/base-dados/gestao-rh?${params.toString()}`
      : "/api/base-dados/gestao-rh";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar base Gestão e RH.");
      setColaboradores([]);
      setLoading(false);
      setModoTodos(false);
      return;
    }

    setColaboradores(resultado.colaboradores ?? []);
    setModoTodos(carregarTodos);
    setLoading(false);
  }

  useEffect(() => {
    buscarColaboradores("");
  }, []);

  useEffect(() => {
    if (!modalFiltroAberto) return;

    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalFiltroAberto(false);
      }
    }

    document.addEventListener("keydown", fecharComEsc);

    return () => {
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [modalFiltroAberto]);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    buscarColaboradores(busca, false, filtrosAtivos);
  }

  function limparBusca() {
    setBusca("");
    setFiltrosAtivos([]);
    setModoTodos(false);
    buscarColaboradores("", false, []);
  }

  function carregarTodosColaboradores() {
    buscarColaboradores(busca, true, filtrosAtivos);
  }

  async function baixarExcel() {
    setExportando(true);
    setErro("");

    const params = new URLSearchParams();

    if (busca.trim()) {
      params.set("busca", busca.trim());
    }

    params.set("todos", "1");

    if (filtrosAtivos.length > 0) {
      params.set(
        "filtros",
        JSON.stringify(
          filtrosAtivos.map((filtro) => ({
            campo: filtro.campo,
            valores: filtro.valores,
          }))
        )
      );
    }

    const response = await fetch(
      `/api/base-dados/gestao-rh?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao exportar base Gestão e RH.");
      setExportando(false);
      return;
    }

    const dados: ColaboradorGestaoRh[] = resultado.colaboradores ?? [];

    const cabecalho = [
      "Pref.",
      "Matrícula",
      "Nome",
      "Cargo/Função",
      "CH",
      "Exercício",
      "CPF",
    ];

    const linhas = dados.map((colaborador) => [
      colaborador.pref,
      colaborador.matricula,
      colaborador.nome,
      colaborador.cargo,
      colaborador.carga_horaria,
      colaborador.exercicio,
      colaborador.cpf,
    ]);

    const conteudoCsv = [
      cabecalho.map(formatarValorExcel).join(";"),
      ...linhas.map((linha) => linha.map(formatarValorExcel).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + conteudoCsv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = gerarNomeArquivoExcel();
    link.click();

    URL.revokeObjectURL(url);

    setExportando(false);
  }

  function abrirModalFiltro() {
    setModalFiltroAberto(true);
    setCampoSelecionado("");
    setOpcoesFiltro([]);
    setOpcoesSelecionadas([]);
    setBuscaOpcoes("");
    setErroOpcoes("");
    setMensagemFiltro("");
  }

  async function carregarOpcoesDoCampo(campo: string) {
    setCampoSelecionado(campo);
    setOpcoesFiltro([]);
    setOpcoesSelecionadas([]);
    setBuscaOpcoes("");
    setErroOpcoes("");
    setMensagemFiltro("");

    if (!campo) return;

    setLoadingOpcoes(true);

    const params = new URLSearchParams();
    params.set("campo", campo);

    if (filtrosAtivos.length > 0) {
      params.set(
        "filtros",
        JSON.stringify(
          filtrosAtivos.map((filtro) => ({
            campo: filtro.campo,
            valores: filtro.valores,
          }))
        )
      );
    }

    const response = await fetch(
      `/api/base-dados/gestao-rh/opcoes-filtro?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    setLoadingOpcoes(false);

    if (!response.ok || !resultado.success) {
      setErroOpcoes(resultado.error || "Erro ao carregar opções do filtro.");
      return;
    }

    const valores = resultado.valores ?? [];
    setOpcoesFiltro(valores);

    const filtroExistente = filtrosAtivos.find(
      (filtro) => filtro.campo === campo
    );

    if (filtroExistente) {
      setOpcoesSelecionadas(filtroExistente.valores);
    }
  }

  function alternarOpcao(valor: string) {
    setOpcoesSelecionadas((selecionadasAtuais) => {
      if (selecionadasAtuais.includes(valor)) {
        return selecionadasAtuais.filter((item) => item !== valor);
      }

      return [...selecionadasAtuais, valor];
    });
  }

  function selecionarOpcoesVisiveis() {
    setOpcoesSelecionadas((selecionadasAtuais) => {
      const novas = new Set([...selecionadasAtuais, ...opcoesFiltradas]);
      return Array.from(novas);
    });
  }

  function limparSelecaoFiltro() {
    setOpcoesSelecionadas([]);
  }

  function aplicarFiltro() {
    setMensagemFiltro("");

    if (!campoSelecionado) {
      setMensagemFiltro("Escolha um campo para filtrar.");
      return;
    }

    if (opcoesSelecionadas.length === 0) {
      setMensagemFiltro("Selecione pelo menos uma opção.");
      return;
    }

    const campoInfo = CAMPOS_FILTRO.find(
      (item) => item.campo === campoSelecionado
    );

    const novoFiltro: FiltroAtivo = {
      campo: campoSelecionado,
      label: campoInfo?.label || campoSelecionado,
      valores: opcoesSelecionadas,
    };

    const novosFiltros = [
      ...filtrosAtivos.filter((filtro) => filtro.campo !== campoSelecionado),
      novoFiltro,
    ];

    setFiltrosAtivos(novosFiltros);
    setModalFiltroAberto(false);
    setModoTodos(false);

    buscarColaboradores(busca, false, novosFiltros);
  }

  function removerFiltro(campo: string) {
    const novosFiltros = filtrosAtivos.filter(
      (filtro) => filtro.campo !== campo
    );

    setFiltrosAtivos(novosFiltros);
    setModoTodos(false);

    buscarColaboradores(busca, false, novosFiltros);
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#171a23] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={abrirModalFiltro}
            disabled={loading}
            className="group inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M4 5h16l-6.5 7.5V18l-3 1.5v-7L4 5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white shadow-sm">
                +
              </span>
            </span>

            <span>Filtro</span>
          </button>

          <form onSubmit={handleBuscar} className="flex w-full gap-3 lg:w-auto">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, matrícula, CPF ou cargo"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-300/10 lg:w-96"
            />

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={limparBusca}
              disabled={loading}
              className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpar
            </button>
          </form>
        </div>

        {filtrosAtivos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filtrosAtivos.map((filtro) => (
              <div
                key={filtro.campo}
                className="flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-300/10 px-3 py-1 text-xs font-semibold text-blue-100"
              >
                <span>
                  {filtro.label}: {resumirValores(filtro.valores)}
                </span>

                <button
                  type="button"
                  onClick={() => removerFiltro(filtro.campo)}
                  className="rounded-full px-1 text-blue-200 hover:bg-white/10 hover:text-white"
                  title="Remover filtro"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {erro && (
        <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">
          Carregando base Gestão e RH...
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">
                {colaboradores.length} resultado
                {colaboradores.length === 1 ? "" : "s"}
              </span>

              {modoTodos ? (
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Base completa carregada
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                  Exibindo até 100 registros
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={baixarExcel}
                disabled={loading || exportando}
                title="Exportar planilha"
                aria-label="Exportar planilha"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`h-5 w-5 ${exportando ? "animate-pulse" : ""}`}
                  aria-hidden="true"
                >
                  <path
                    d="M6 3h8l4 4v14H6V3Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 3v4h4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 10.5h7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.5 13.5h7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.5 16.5h7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M11 10.5v6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13.5 10.5v6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={carregarTodosColaboradores}
                disabled={loading}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Carregar todos
              </button>
            </div>
          </div>

          <div className="voxx-scrollbar overflow-x-auto rounded-[22px] border border-white/10 bg-[#202532] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
            <table className="w-full min-w-[980px] table-fixed text-center text-xs">
              <colgroup>
                {[
                  <col key="indice" style={{ width: "54px" }} />,
                  <col key="pref" style={{ width: "80px" }} />,
                  <col key="matricula" style={{ width: "90px" }} />,
                  <col key="nome" />,
                  <col key="cargo" />,
                  <col key="carga_horaria" style={{ width: "90px" }} />,
                  <col key="exercicio" style={{ width: "100px" }} />,
                  <col key="cpf" style={{ width: "130px" }} />,
                ]}
              </colgroup>

              <thead className="sticky top-0 z-10 bg-[#2a3040]">
                <tr className="border-b border-white/10 text-slate-300">
                  <th className="px-2 py-4 text-center align-middle">#</th>
                  <th className="px-2 py-4 text-center align-middle">Pref.</th>
                  <th className="px-2 py-4 text-center align-middle">
                    Matrícula
                  </th>
                  <th className="px-2 py-4 text-center align-middle">Nome</th>
                  <th className="px-2 py-4 text-center align-middle">
                    Cargo/Função
                  </th>
                  <th className="px-2 py-4 text-center align-middle">CH</th>
                  <th className="px-2 py-4 text-center align-middle">
                    Exercício
                  </th>
                  <th className="px-2 py-4 text-center align-middle">CPF</th>
                </tr>
              </thead>

              <tbody>
                {colaboradores.map((colaborador, indice) => (
                  <tr
                    key={colaborador.id}
                    className="border-b border-white/10 align-middle text-slate-200 transition hover:bg-white/[0.055]"
                  >
                    <td className="px-2 py-4 text-center align-middle">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] px-2 text-[11px] font-bold text-slate-200">
                        {indice + 1}
                      </span>
                    </td>

                    <td className="px-2 py-4 text-center align-middle text-slate-300">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.pref)}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-middle font-medium text-slate-100">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.matricula)}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-middle font-semibold text-white">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.nome)}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-middle text-slate-300">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.cargo)}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-middle text-slate-300">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.carga_horaria)}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-middle text-slate-300">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.exercicio)}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-middle text-slate-300">
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.cpf)}
                      </div>
                    </td>
                  </tr>
                ))}

                {colaboradores.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center align-middle text-slate-400"
                    >
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalFiltroAberto && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]"
          onMouseDown={() => setModalFiltroAberto(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Adicionar filtro
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Escolha um campo e marque uma ou mais opções.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalFiltroAberto(false)}
                className="rounded-full px-3 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-slate-300">
                Campo
              </label>

              <select
                value={campoSelecionado}
                onChange={(e) => carregarOpcoesDoCampo(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [color-scheme:dark] [&>option]:bg-[#171a23] [&>option]:text-slate-100"
              >
                <option value="">Selecione um campo</option>

                {CAMPOS_FILTRO.map((campo) => (
                  <option key={campo.campo} value={campo.campo}>
                    {campo.label}
                  </option>
                ))}
              </select>
            </div>

            {campoSelecionado && (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={buscaOpcoes}
                    onChange={(e) => setBuscaOpcoes(e.target.value)}
                    placeholder="Buscar opção..."
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-blue-300/10"
                  />

                  <button
                    type="button"
                    onClick={selecionarOpcoesVisiveis}
                    disabled={loadingOpcoes || opcoesFiltradas.length === 0}
                    className="h-11 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Selecionar visíveis
                  </button>

                  <button
                    type="button"
                    onClick={limparSelecaoFiltro}
                    disabled={loadingOpcoes || opcoesSelecionadas.length === 0}
                    className="h-11 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Limpar seleção
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {opcoesSelecionadas.length} selecionada
                    {opcoesSelecionadas.length === 1 ? "" : "s"}
                  </p>

                  <p className="text-xs text-slate-500">
                    {opcoesFiltradas.length} opção
                    {opcoesFiltradas.length === 1 ? "" : "ões"} visível
                    {opcoesFiltradas.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border">
                  {loadingOpcoes ? (
                    <div className="p-6 text-center text-sm text-slate-400">
                      Carregando opções...
                    </div>
                  ) : opcoesFiltradas.length > 0 ? (
                    <div className="divide-y divide-white/10">
                      {opcoesFiltradas.map((opcao) => (
                        <label
                          key={opcao}
                          className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.05]"
                        >
                          <input
                            type="checkbox"
                            checked={opcoesSelecionadas.includes(opcao)}
                            onChange={() => alternarOpcao(opcao)}
                            className="h-4 w-4"
                          />

                          <span>{opcao}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-400">
                      Nenhuma opção encontrada.
                    </div>
                  )}
                </div>
              </div>
            )}

            {erroOpcoes && (
              <div className="mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {erroOpcoes}
              </div>
            )}

            {mensagemFiltro && (
              <div className="mt-4 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-100">
                {mensagemFiltro}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalFiltroAberto(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={aplicarFiltro}
                className="rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Aplicar filtro
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
