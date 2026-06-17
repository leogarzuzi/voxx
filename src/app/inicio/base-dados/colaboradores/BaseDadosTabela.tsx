"use client";

import { useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type Colaborador = {
  id: number;
  pref: string | null;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  carga_horaria: string | null;
  exercicio: string | null;
  cpf: string | null;
  pis: string | null;
  data_nascimento: string | null;
  email: string | null;
  observacao: string | null;
  created_at: string | null;
};

type FiltroAtivo = {
  campo: string;
  label: string;
  valores: string[];
};

const CAMPOS_FILTRO = [
  { campo: "pref", label: "Pref." },
  { campo: "matricula", label: "Matr�cula" },
  { campo: "nome", label: "Nome" },
  { campo: "cargo", label: "Cargo/Fun��o" },
  { campo: "carga_horaria", label: "Carga hor�ria" },
  { campo: "exercicio", label: "Exerc�cio" },
  { campo: "cpf", label: "CPF" },
  { campo: "pis", label: "PIS" },
  { campo: "data_nascimento", label: "Data nasc." },
  { campo: "email", label: "E-mail" },
  { campo: "observacao", label: "Observa��o" },
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

  return `base-dados-voxx-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
}

export default function BaseDadosTabela() {
  const { temaDia } = useTema();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modoTodos, setModoTodos] = useState(false); // controla se carregou a base inteira
  const [exportando, setExportando] = useState(false); // controla o bot�o de exportar

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

    // quando verdadeiro, a API busca todos os colaboradores em lotes
    if (carregarTodos) {
      params.set("todos", "1");
    }

    // filtros ativos no formato que a API entende
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
      ? `/api/base-dados?${params.toString()}`
      : "/api/base-dados";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar base de dados.");
      setColaboradores([]);
      setLoading(false);
      setModoTodos(false);
      return;
    }

    setColaboradores(resultado.colaboradores ?? []);
    setModoTodos(carregarTodos);
    setLoading(false);
  }

  // carrega os primeiros 100 registros ao abrir a p�gina
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

    const campoBuscaClass = temaDia
    ? "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 lg:w-96"
    : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-300/10 lg:w-96";

  const inputModalClass = temaDia
    ? "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
    : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-blue-300/10";

  const selectModalClass = temaDia
    ? "mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 [color-scheme:light] [&>option]:bg-white [&>option]:text-slate-900"
    : "mt-1 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [color-scheme:dark] [&>option]:bg-[#171a23] [&>option]:text-slate-100";
  return () => {
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [modalFiltroAberto]);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();

    // busca normal: retorna at� 100 resultados respeitando os filtros ativos
    buscarColaboradores(busca, false, filtrosAtivos);
  }

  function limparBusca() {
    setBusca("");
    setFiltrosAtivos([]);
    setModoTodos(false);
    buscarColaboradores("", false, []);
  }

  function carregarTodosColaboradores() {
    // carrega todos, respeitando busca e filtros ativos
    buscarColaboradores(busca, true, filtrosAtivos);
  }

  async function baixarExcel() {
    setExportando(true);
    setErro("");

    const params = new URLSearchParams();

    if (busca.trim()) {
      params.set("busca", busca.trim());
    }

    // for�a exportar a base completa respeitando busca e filtros
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

    const response = await fetch(`/api/base-dados?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao exportar base de dados.");
      setExportando(false);
      return;
    }

    const dados: Colaborador[] = resultado.colaboradores ?? [];

    const cabecalho = [
      "Pref.",
      "Matr�cula",
      "Nome",
      "Cargo/Fun��o",
      "CH",
      "Exerc�cio",
      "CPF",
      "PIS",
      "Data nasc.",
      "E-mail",
      "Observa��o",
    ];

    const linhas = dados.map((colaborador) => [
      colaborador.pref,
      colaborador.matricula,
      colaborador.nome,
      colaborador.cargo,
      colaborador.carga_horaria,
      colaborador.exercicio,
      colaborador.cpf,
      colaborador.pis,
      colaborador.data_nascimento,
      colaborador.email,
      colaborador.observacao,
    ]);

    const conteudoCsv = [
      cabecalho.map(formatarValorExcel).join(";"),
      ...linhas.map((linha) => linha.map(formatarValorExcel).join(";")),
    ].join("\n");

    // BOM ajuda o Excel a reconhecer acentos corretamente
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

    // envia os filtros ativos para a API montar op��es dependentes
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
      `/api/base-dados/opcoes-filtro?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    setLoadingOpcoes(false);

    if (!response.ok || !resultado.success) {
      setErroOpcoes(resultado.error || "Erro ao carregar op��es do filtro.");
      return;
    }

    const valores = resultado.valores ?? [];
    setOpcoesFiltro(valores);

    // se j� existir filtro nesse campo, abre com os valores j� marcados
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
      setMensagemFiltro("Selecione pelo menos uma op��o.");
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

    // se j� existir filtro do mesmo campo, substitui
    const novosFiltros = [
      ...filtrosAtivos.filter((filtro) => filtro.campo !== campoSelecionado),
      novoFiltro,
    ];

    setFiltrosAtivos(novosFiltros);
    setModalFiltroAberto(false);
    setModoTodos(false);

    // aplica no banco, retornando at� 100 resultados
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

  const campoBuscaClass = temaDia
    ? "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 lg:w-96"
    : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-300/10 lg:w-96";

  const inputModalClass = temaDia
    ? "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
    : "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-blue-300/10";

  const selectModalClass = temaDia
    ? "mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 [color-scheme:light] [&>option]:bg-white [&>option]:text-slate-900"
    : "mt-1 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [color-scheme:dark] [&>option]:bg-[#171a23] [&>option]:text-slate-100";
  return (
    <section className={temaDia ? "mt-6 overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#171a23] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={abrirModalFiltro}
            disabled={loading}
            className={temaDia ? "group inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" : "group inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"}
          >
            <span className={temaDia ? "relative flex h-7 w-7 items-center justify-center rounded-xl bg-white text-slate-950" : "relative flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950 text-white"}>
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
              placeholder="Buscar por nome, matrícula, CPF, cargo ou e-mail"
              className={campoBuscaClass}
            />

            <button
              type="submit"
              disabled={loading}
              className={temaDia ? "h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" : "h-11 rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"}
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={limparBusca}
              disabled={loading}
              className={temaDia ? "h-11 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"}
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
                className={temaDia ? "flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" : "flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-300/10 px-3 py-1 text-xs font-semibold text-blue-100"}
              >
                <span>
                  {filtro.label}: {resumirValores(filtro.valores)}
                </span>

                <button
                  type="button"
                  onClick={() => removerFiltro(filtro.campo)}
                  className={temaDia ? "rounded-full px-1 text-blue-600 hover:bg-blue-100 hover:text-blue-800" : "rounded-full px-1 text-blue-200 hover:bg-white/10 hover:text-white"}
                  title="Remover filtro"
                >
                  �
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {erro && (
        <div className={temaDia ? "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "mb-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"}>
          {erro}
        </div>
      )}

      {loading ? (
        <div className={temaDia ? "py-10 text-center text-sm text-slate-500" : "py-10 text-center text-sm text-slate-400"}>
          Carregando base de dados...
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700" : "rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200"}>
                {colaboradores.length} resultado
                {colaboradores.length === 1 ? "" : "s"}
              </span>

              {modoTodos ? (
                <span className={temaDia ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" : "rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100"}>
                  Base completa carregada
                </span>
              ) : (
                <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600" : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300"}>
                  Exibindo at� 100 registros
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={baixarExcel}
                disabled={loading || exportando}
                title="Baixar Excel"
                aria-label="Baixar Excel"
                className="voxx-export-button"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 3v5h5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 16l2.2-3-2.1-3h1.8l1.2 1.9L12.9 10h1.7l-2.1 3 2.2 3h-1.8l-1.3-2-1.3 2H8.5Z"
                    fill="currentColor"
                  />
                </svg>
              </button> 

              <button
                type="button"
                onClick={carregarTodosColaboradores}
                disabled={loading}
                className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"}
              >
                Carregar todos
              </button>
            </div>
          </div>

          <div className={temaDia ? "voxx-scrollbar overflow-x-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]" : "voxx-scrollbar overflow-x-auto rounded-[22px] border border-white/10 bg-[#202532] shadow-[0_18px_45px_rgba(0,0,0,0.2)]"}>
            <table className="w-full min-w-[1380px] table-fixed text-center text-xs">
              <colgroup>
                {[
                  <col key="indice" style={{ width: "54px" }} />,
                  <col key="pref" style={{ width: "80px" }} />,
                  <col key="matricula" style={{ width: "70px" }} />,
                  <col key="nome" />,
                  <col key="cargo" />,
                  <col key="ch" style={{ width: "70px" }} />,
                  <col key="exercicio" style={{ width: "80px" }} />,
                  <col key="cpf" style={{ width: "80px" }} />,
                  <col key="pis" style={{ width: "80px" }} />,
                  <col key="data_nascimento" style={{ width: "80px" }} />,
                  <col key="email" style={{ width: "14%" }} />,
                  <col key="observacao" style={{ width: "22%" }} />,
                ]}
              </colgroup>

              <thead className={temaDia ? "sticky top-0 z-10 bg-slate-100" : "sticky top-0 z-10 bg-[#2a3040]"}>
                <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                  <th className="px-2 py-4 text-center align-middle">#</th>
                  <th className="px-2 py-4 text-center align-middle">Pref.</th>
                  <th className="px-2 py-4 text-center align-middle">
                    Matr�cula
                  </th>
                  <th className="px-2 py-4 text-center align-middle">Nome</th>
                  <th className="px-2 py-4 text-center align-middle">
                    Cargo/Fun��o
                  </th>
                  <th className="px-2 py-4 text-center align-middle">CH</th>
                  <th className="px-2 py-4 text-center align-middle">
                    Exerc�cio
                  </th>
                  <th className="px-2 py-4 text-center align-middle">CPF</th>
                  <th className="px-2 py-4 text-center align-middle">PIS</th>
                  <th className="px-2 py-4 text-center align-middle">Nasc.</th>
                  <th className="px-2 py-4 text-center align-middle">E-mail</th>
                  <th className="px-2 py-4 text-center align-middle">Obs.</th>
                </tr>
              </thead>

              <tbody>
                {colaboradores.map((colaborador, indice) => (
                  <tr
                    key={colaborador.id}
                    className={temaDia ? "border-b border-slate-200 align-middle text-slate-700 transition hover:bg-slate-50" : "border-b border-white/10 align-middle text-slate-200 transition hover:bg-white/[0.055]"}
                  >
                    <td className="px-2 py-4 text-center align-middle">
                      <span className={temaDia ? "inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2 text-[11px] font-bold text-slate-700" : "inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] px-2 text-[11px] font-bold text-slate-200"}>
                        {indice + 1}
                      </span>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.pref)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle font-medium text-slate-800" : "px-2 py-4 text-center align-middle font-medium text-slate-100"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.matricula)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle font-semibold text-slate-950" : "px-2 py-4 text-center align-middle font-semibold text-white"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.nome)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.cargo)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.carga_horaria)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.exercicio)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.cpf)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.pis)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.data_nascimento)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.email)}
                      </div>
                    </td>

                    <td className={temaDia ? "px-2 py-4 text-center align-middle text-slate-600" : "px-2 py-4 text-center align-middle text-slate-300"}>
                      <div className="whitespace-normal break-words leading-snug">
                        {texto(colaborador.observacao)}
                      </div>
                    </td>
                  </tr>
                ))}

                {colaboradores.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className={temaDia ? "px-4 py-8 text-center align-middle text-slate-500" : "px-4 py-8 text-center align-middle text-slate-400"}
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
            className={temaDia ? "w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl" : "w-full max-w-2xl rounded-3xl border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-2xl"}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className={temaDia ? "text-xl font-bold text-slate-950" : "text-xl font-bold text-white"}>
                  Adicionar filtro
                </h3>

                <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
                  Escolha um campo e marque uma ou mais op��es.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalFiltroAberto(false)}
                className={temaDia ? "rounded-full px-3 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" : "rounded-full px-3 py-1 text-slate-400 hover:bg-white/10 hover:text-white"}
              >
                �
              </button>
            </div>

            <div className="mt-5">
              <label className={temaDia ? "block text-sm font-semibold text-slate-700" : "block text-sm font-semibold text-slate-300"}>
                Campo
              </label>

              <select
                value={campoSelecionado}
                onChange={(e) => carregarOpcoesDoCampo(e.target.value)}
                className={selectModalClass}
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
                    placeholder="Buscar op��o..."
                    className={inputModalClass}
                  />

                  <button
                    type="button"
                    onClick={selecionarOpcoesVisiveis}
                    disabled={loadingOpcoes || opcoesFiltradas.length === 0}
                    className={temaDia ? "h-11 whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" : "h-11 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"}
                  >
                    Selecionar vis�veis
                  </button>

                  <button
                    type="button"
                    onClick={limparSelecaoFiltro}
                    disabled={loadingOpcoes || opcoesSelecionadas.length === 0}
                    className={temaDia ? "h-11 whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" : "h-11 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"}
                  >
                    Limpar sele��o
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {opcoesSelecionadas.length} selecionada
                    {opcoesSelecionadas.length === 1 ? "" : "s"}
                  </p>

                  <p className="text-xs text-gray-400">
                    {opcoesFiltradas.length} op��o
                    {opcoesFiltradas.length === 1 ? "" : "�es"} visível
                    {opcoesFiltradas.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className={temaDia ? "mt-3 max-h-80 overflow-y-auto rounded-xl border border-slate-200" : "mt-3 max-h-80 overflow-y-auto rounded-xl border border-white/10"}>
                  {loadingOpcoes ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      Carregando op��es...
                    </div>
                  ) : opcoesFiltradas.length > 0 ? (
                    <div className={temaDia ? "divide-y divide-slate-200" : "divide-y divide-white/10"}>
                      {opcoesFiltradas.map((opcao) => (
                        <label
                          key={opcao}
                          className={temaDia ? "flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50" : "flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.06]"}
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
                    <div className="p-6 text-center text-sm text-gray-500">
                      Nenhuma op��o encontrada.
                    </div>
                  )}
                </div>
              </div>
            )}

            {erroOpcoes && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erroOpcoes}
              </div>
            )}

            {mensagemFiltro && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                {mensagemFiltro}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalFiltroAberto(false)}
                className={temaDia ? "rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" : "rounded-xl border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={aplicarFiltro}
                className={temaDia ? "rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" : "rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"}
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



