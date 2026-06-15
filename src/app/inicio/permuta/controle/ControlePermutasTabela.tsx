"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StatusPermuta = "em_andamento" | "concluida" | "negada";

type PermutaControle = {
  id: number;
  pref_saida: string | null;
  matricula_saida: string | null;
  nome_saida: string | null;
  cargo_saida: string | null;
  pref_entrada: string | null;
  matricula_entrada: string | null;
  nome_entrada: string | null;
  cargo_entrada: string | null;
  carga_horaria_entrada: string | null;
  exercicio_entrada: string | null;
  cpf_entrada: string | null;
  pis_entrada: string | null;
  data_nascimento_entrada: string | null;
  email_entrada: string | null;
  unidade_origem: string | null;
  inicio_hmrg: string | null;
  observacao: string | null;
  status: StatusPermuta | string | null;
  criado_em: string | null;
  criado_por_email: string | null;
};

type FormularioPermuta = {
  id?: number;
  pref_saida: string;
  matricula_saida: string;
  nome_saida: string;
  cargo_saida: string;
  pref_entrada: string;
  matricula_entrada: string;
  nome_entrada: string;
  cargo_entrada: string;
  carga_horaria_entrada: string;
  exercicio_entrada: string;
  cpf_entrada: string;
  pis_entrada: string;
  data_nascimento_entrada: string;
  email_entrada: string;
  unidade_origem: string;
  inicio_hmrg: string;
  observacao: string;
  status: StatusPermuta;
};

type ConfirmacaoStatus = {
  permuta: PermutaControle;
  novoStatus: StatusPermuta;
} | null;

const FORM_INICIAL: FormularioPermuta = {
  pref_saida: "",
  matricula_saida: "",
  nome_saida: "",
  cargo_saida: "",
  pref_entrada: "",
  matricula_entrada: "",
  nome_entrada: "",
  cargo_entrada: "",
  carga_horaria_entrada: "",
  exercicio_entrada: "",
  cpf_entrada: "",
  pis_entrada: "",
  data_nascimento_entrada: "",
  email_entrada: "",
  unidade_origem: "",
  inicio_hmrg: "",
  observacao: "",
  status: "em_andamento",
};

const STATUS_OPCOES = [
  { value: "", label: "Todos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Aprovada" },
  { value: "negada", label: "Negada" },
];

const CAMPOS_MAIUSCULOS: (keyof FormularioPermuta)[] = [
  "nome_saida",
  "cargo_saida",
  "nome_entrada",
  "cargo_entrada",
  "unidade_origem",
  "observacao",
];

function texto(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "-";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";

  return String(valor);
}

function normalizarTextoMaiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

function dataParaInput(valor: string | null | undefined) {
  if (!valor) return "";

  const textoData = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(textoData)) return textoData.slice(0, 10);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(textoData)) {
    const [dia, mes, ano] = textoData.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return "";
}

function formatarData(valor: string | null | undefined) {
  if (!valor) return "-";

  const textoData = String(valor).trim();
  const apenasData = textoData.split("T")[0];

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(textoData)) return textoData;

  if (/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) {
    const [ano, mes, dia] = apenasData.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return textoData;
}

function statusLabel(status: string | null | undefined) {
  if (status === "concluida") return "Aprovada";
  if (status === "negada") return "Negada";
  return "Em andamento";
}

function statusClass(status: string | null | undefined) {
  if (status === "concluida") return "bg-green-50 text-green-700";
  if (status === "negada") return "bg-red-50 text-red-700";
  return "bg-yellow-50 text-yellow-700";
}

function validarMatricula(matricula: string, label = "Matrícula") {
  const valor = matricula.trim();

  if (!valor) return `${label} é obrigatória.`;
  if (!/^\d+$/.test(valor)) return `${label} deve conter somente números.`;
  if (valor.length !== 8) return `${label} deve ter 8 dígitos.`;
  if (!valor.startsWith("40")) return `${label} deve começar com 40.`;

  return "";
}

function cargaHorariaParaInput(valor: string | null | undefined) {
  if (!valor) return "";

  return String(valor).replace(/\D/g, "").slice(0, 2);
}

function formatarCargaHoraria(valor: string) {
  const numeros = cargaHorariaParaInput(valor);

  return numeros ? `${numeros} HORAS` : "";
}

function formatarCargaHorariaTabela(valor: string | null | undefined) {
  if (!valor) return "-";

  const textoCarga = String(valor).trim();

  if (/^\d{1,2}$/.test(textoCarga)) return `${textoCarga} HORAS`;

  return textoCarga;
}

function validarCargaHoraria(valor: string) {
  const numeros = cargaHorariaParaInput(valor);

  if (!numeros) return "A carga horária é obrigatória.";

  const quantidade = Number(numeros);

  if (!Number.isInteger(quantidade) || quantidade < 10 || quantidade > 40) {
    return "Carga horária deve ser um número entre 10 e 40.";
  }

  return "";
}

function formatarValorCsv(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? '"Sim"' : '"Não"';

  const valorTexto = String(valor).replaceAll('"', '""');

  return `"${valorTexto}"`;
}

function gerarNomeArquivoCsv() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  return `permutas-voxx-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
}

type InputTextoProps = {
  label: string;
  value: string;
  onChange?: (valor: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url";
  pattern?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
};

function InputTexto({
  label,
  value,
  onChange = () => {},
  required = false,
  type = "text",
  placeholder,
  inputMode,
  pattern,
  maxLength,
  className = "",
  disabled = false,
}: InputTextoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        disabled={disabled}
        className={`mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
            : "border-gray-300 text-gray-800"
        }`}
      />
    </label>
  );
}

export default function ControlePermutasTabela() {
  const [permutas, setPermutas] = useState<PermutaControle[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoSaida, setBuscandoSaida] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [permutaEditando, setPermutaEditando] =
    useState<PermutaControle | null>(null);
  const [formulario, setFormulario] = useState<FormularioPermuta>(FORM_INICIAL);
  const [confirmacaoStatus, setConfirmacaoStatus] =
    useState<ConfirmacaoStatus>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const resumoStatus = useMemo(
    () => ({
      total: permutas.length,
      emAndamento: permutas.filter((permuta) => permuta.status === "em_andamento")
        .length,
      aprovadas: permutas.filter((permuta) => permuta.status === "concluida")
        .length,
      negadas: permutas.filter((permuta) => permuta.status === "negada").length,
    }),
    [permutas]
  );

  async function buscarPermutas(
    valorBusca = busca,
    valorStatus = statusFiltro
  ) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();

    if (valorBusca.trim()) params.set("busca", valorBusca.trim());
    if (valorStatus) params.set("status", valorStatus);

    const url = params.toString()
      ? `/api/permuta/controle?${params.toString()}`
      : "/api/permuta/controle";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar permutas.");
      setPermutas([]);
      setLoading(false);
      return;
    }

    setPermutas(resultado.permutas ?? []);
    setLoading(false);
  }

  useEffect(() => {
    buscarPermutas("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function atualizarCampo(campo: keyof FormularioPermuta, valor: string) {
    let valorTratado = valor;

    if (CAMPOS_MAIUSCULOS.includes(campo)) {
      valorTratado = normalizarTextoMaiusculo(valor);
    }

    if (campo === "email_entrada") valorTratado = valor.toLowerCase();
    if (campo === "carga_horaria_entrada") {
      valorTratado = cargaHorariaParaInput(valor);
    }

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [campo]: valorTratado,
    }));
  }

  function abrirModalNovaPermuta() {
    setPermutaEditando(null);
    setFormulario(FORM_INICIAL);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirModalEditar(permuta: PermutaControle) {
    setPermutaEditando(permuta);
    setErro("");
    setSucesso("");
    setFormulario({
      id: permuta.id,
      pref_saida: permuta.pref_saida || "",
      matricula_saida: permuta.matricula_saida || "",
      nome_saida: permuta.nome_saida || "",
      cargo_saida: permuta.cargo_saida || "",
      pref_entrada: permuta.pref_entrada || "",
      matricula_entrada: permuta.matricula_entrada || "",
      nome_entrada: permuta.nome_entrada || "",
      cargo_entrada: permuta.cargo_entrada || "",
      carga_horaria_entrada: cargaHorariaParaInput(
        permuta.carga_horaria_entrada
      ),
      exercicio_entrada: dataParaInput(permuta.exercicio_entrada),
      cpf_entrada: permuta.cpf_entrada || "",
      pis_entrada: permuta.pis_entrada || "",
      data_nascimento_entrada: dataParaInput(permuta.data_nascimento_entrada),
      email_entrada: permuta.email_entrada || "",
      unidade_origem: permuta.unidade_origem || "",
      inicio_hmrg: dataParaInput(permuta.inicio_hmrg),
      observacao: permuta.observacao || "",
      status:
        permuta.status === "concluida" || permuta.status === "negada"
          ? permuta.status
          : "em_andamento",
    });
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando || buscandoSaida) return;

    setModalAberto(false);
    setPermutaEditando(null);
    setFormulario(FORM_INICIAL);
  }

  useEffect(() => {
    if (!modalAberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        fecharModal();
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      window.removeEventListener("keydown", aoPressionarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalAberto, salvando, buscandoSaida]);

  useEffect(() => {
    if (!confirmacaoStatus) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setConfirmacaoStatus(null);
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [confirmacaoStatus]);

  async function buscarColaboradorSaida() {
    setErro("");
    setSucesso("");

    const erroMatricula = validarMatricula(
      formulario.matricula_saida,
      "Matrícula de quem sai"
    );

    if (erroMatricula) {
      setErro(erroMatricula);
      return;
    }

    setBuscandoSaida(true);

    const response = await fetch(
      `/api/permuta/buscar-colaborador?matricula=${encodeURIComponent(
        formulario.matricula_saida.trim()
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao buscar colaborador.");
      setBuscandoSaida(false);
      return;
    }

    if (!resultado.encontrado || !resultado.colaborador) {
      setErro(
        resultado.message || "Nenhum colaborador encontrado para esta matrícula."
      );
      setBuscandoSaida(false);
      return;
    }

    const colaborador = resultado.colaborador;

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      pref_saida: colaborador.pref || "",
      matricula_saida: colaborador.matricula || formularioAtual.matricula_saida,
      nome_saida: colaborador.nome || "",
      cargo_saida: colaborador.cargo || "",
    }));

    setBuscandoSaida(false);
  }

  function validarAntesDeSalvar() {
    const erroMatriculaSaida = validarMatricula(
      formulario.matricula_saida,
      "Matrícula de quem sai"
    );
    const erroMatriculaEntrada = validarMatricula(
      formulario.matricula_entrada,
      "Matrícula de quem entra"
    );

    if (erroMatriculaSaida) return erroMatriculaSaida;
    if (erroMatriculaEntrada) return erroMatriculaEntrada;
    if (formulario.matricula_saida === formulario.matricula_entrada) {
      return "As matrículas de quem sai e de quem entra devem ser diferentes.";
    }
    if (!formulario.nome_saida.trim()) return "Busque quem sai do HMRG.";
    if (!formulario.cargo_saida.trim()) return "Busque quem sai do HMRG.";
    if (!formulario.nome_entrada.trim()) return "O nome de quem entra é obrigatório.";
    if (!formulario.cargo_entrada.trim()) {
      return "O cargo de quem entra é obrigatório.";
    }

    const erroCargaHoraria = validarCargaHoraria(
      formulario.carga_horaria_entrada
    );

    if (erroCargaHoraria) return erroCargaHoraria;
    if (!formulario.exercicio_entrada) {
      return "A admissão de quem entra é obrigatória.";
    }
    if (!formulario.unidade_origem.trim()) {
      return "A unidade de origem é obrigatória.";
    }
    if (!formulario.inicio_hmrg) return "O início no HMRG é obrigatório.";

    return "";
  }

  async function salvarPermuta(e: FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const erroValidacao = validarAntesDeSalvar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    const editando = Boolean(permutaEditando);
    const response = await fetch("/api/permuta/controle", {
      method: editando ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formulario,
        carga_horaria_entrada: formatarCargaHoraria(
          formulario.carga_horaria_entrada
        ),
        id: permutaEditando?.id,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao salvar permuta.");
      setSalvando(false);
      return;
    }

    setSucesso(
      editando ? "Permuta atualizada com sucesso." : "Permuta salva com sucesso."
    );
    setSalvando(false);
    fecharModal();
    buscarPermutas(busca, statusFiltro);
  }

  function abrirConfirmacaoStatus(
    permuta: PermutaControle,
    novoStatus: StatusPermuta
  ) {
    setConfirmacaoStatus({ permuta, novoStatus });
  }

  async function confirmarAlteracaoStatus() {
    if (!confirmacaoStatus) return;

    setErro("");
    setSucesso("");

    const { permuta, novoStatus } = confirmacaoStatus;
    setConfirmacaoStatus(null);

    const response = await fetch("/api/permuta/controle", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: permuta.id,
        status: novoStatus,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao alterar status da permuta.");
      return;
    }

    setSucesso("Status da permuta atualizado com sucesso.");
    buscarPermutas(busca, statusFiltro);
  }

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    buscarPermutas(busca, statusFiltro);
  }

  function limparBusca() {
    setBusca("");
    setStatusFiltro("");
    buscarPermutas("", "");
  }

  function baixarCsv() {
    const cabecalho = [
      "Status",
      "Pref. saída",
      "Matrícula saída",
      "Nome saída",
      "Cargo saída",
      "Pref. entrada",
      "Matrícula entrada",
      "Nome entrada",
      "Cargo entrada",
      "Carga horária entrada",
      "Admissão entrada",
      "CPF entrada",
      "PIS entrada",
      "Data nascimento entrada",
      "E-mail entrada",
      "Unidade origem",
      "Início HMRG",
      "Observação",
      "Criado em",
      "Criado por",
    ];

    const linhas = permutas.map((permuta) => [
      statusLabel(permuta.status),
      permuta.pref_saida,
      permuta.matricula_saida,
      permuta.nome_saida,
      permuta.cargo_saida,
      permuta.pref_entrada,
      permuta.matricula_entrada,
      permuta.nome_entrada,
      permuta.cargo_entrada,
      formatarCargaHorariaTabela(permuta.carga_horaria_entrada),
      formatarData(permuta.exercicio_entrada),
      permuta.cpf_entrada,
      permuta.pis_entrada,
      formatarData(permuta.data_nascimento_entrada),
      permuta.email_entrada,
      permuta.unidade_origem,
      formatarData(permuta.inicio_hmrg),
      permuta.observacao,
      formatarData(permuta.criado_em),
      permuta.criado_por_email,
    ]);

    const conteudoCsv = [
      cabecalho.map(formatarValorCsv).join(";"),
      ...linhas.map((linha) => linha.map(formatarValorCsv).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + conteudoCsv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = gerarNomeArquivoCsv();
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-8 min-w-0 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <button
            type="button"
            onClick={abrirModalNovaPermuta}
            className="w-fit rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Nova permuta
          </button>

          <form
            onSubmit={pesquisar}
            className="flex w-full flex-col gap-3 md:flex-row xl:w-auto"
          >
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por matrícula, nome, CPF, cargo ou unidade"
              className="h-10 w-full rounded-xl border border-gray-300 px-4 text-center text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-96"
            />

            <select
              value={statusFiltro}
              onChange={(e) => {
                const valor = e.target.value;
                setStatusFiltro(valor);
                buscarPermutas(busca, valor);
              }}
              className="h-10 rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPCOES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={limparBusca}
              disabled={loading}
              className="h-10 rounded-xl border px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={baixarCsv}
              disabled={loading || permutas.length === 0}
              title="Baixar Excel/CSV"
              aria-label="Baixar Excel/CSV"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
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
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {resumoStatus.total}{" "}
            {resumoStatus.total === 1 ? "permuta" : "permutas"}
          </span>

          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
            {resumoStatus.emAndamento} em andamento
          </span>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {resumoStatus.aprovadas} aprovadas
          </span>

          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            {resumoStatus.negadas} negadas
          </span>
        </div>
      </div>

      {erro && !modalAberto && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {sucesso}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Carregando permutas...
        </div>
      ) : (
        <div className="w-full max-w-full overflow-x-auto rounded-xl border">
          <table className="min-w-[2380px] table-fixed text-center text-xs [&_td]:border-r [&_td]:border-slate-200/70 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200/70 [&_th:last-child]:border-r-0">
            <colgroup>
              <col className="w-[118px]" />
              <col className="w-[210px]" />
              <col className="w-[240px]" />
              <col className="w-[80px]" />
              <col className="w-[110px]" />
              <col className="w-[240px]" />
              <col className="w-[190px]" />
              <col className="w-[126px]" />
              <col className="w-[112px]" />
              <col className="w-[125px]" />
              <col className="w-[125px]" />
              <col className="w-[135px]" />
              <col className="w-[220px]" />
              <col className="w-[170px]" />
              <col className="w-[118px]" />
              <col className="w-[300px]" />
            </colgroup>

            <thead className="bg-slate-100">
              <tr className="border-b text-gray-600">
                <th className="px-3 py-4 text-center">Status</th>
                <th className="px-3 py-4 text-center">Ações</th>
                <th className="px-3 py-4 text-center">Quem sai do HMRG</th>
                <th className="px-3 py-4 text-center">Pref.</th>
                <th className="px-3 py-4 text-center">Matrícula</th>
                <th className="px-3 py-4 text-center">Nome</th>
                <th className="px-3 py-4 text-center">Cargo</th>
                <th className="px-3 py-4 text-center">Carga horária</th>
                <th className="px-3 py-4 text-center">Admissão</th>
                <th className="px-3 py-4 text-center">CPF</th>
                <th className="px-3 py-4 text-center">PIS</th>
                <th className="px-3 py-4 text-center">Nascimento</th>
                <th className="px-3 py-4 text-center">E-mail</th>
                <th className="px-3 py-4 text-center">Unidade origem</th>
                <th className="px-3 py-4 text-center">Início HMRG</th>
                <th className="px-3 py-4 text-center">Observação</th>
              </tr>
            </thead>

            <tbody>
              {permutas.map((permuta) => (
                <tr
                  key={permuta.id}
                  className="border-b align-middle hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        permuta.status
                      )}`}
                    >
                      {statusLabel(permuta.status)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(permuta)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        Editar
                      </button>

                      {permuta.status === "em_andamento" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              abrirConfirmacaoStatus(permuta, "concluida")
                            }
                            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            Aprovar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirConfirmacaoStatus(permuta, "negada")
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Negar
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-4 text-left align-middle text-gray-700">
                    <p className="font-semibold text-gray-800">
                      {texto(permuta.nome_saida)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Mat. {texto(permuta.matricula_saida)} | Pref.{" "}
                      {texto(permuta.pref_saida)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {texto(permuta.cargo_saida)}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.pref_entrada)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-gray-800">
                    {texto(permuta.matricula_entrada)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle font-semibold text-gray-800">
                    {texto(permuta.nome_entrada)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.cargo_entrada)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {formatarCargaHorariaTabela(
                      permuta.carga_horaria_entrada
                    )}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {formatarData(permuta.exercicio_entrada)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.cpf_entrada)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.pis_entrada)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {formatarData(permuta.data_nascimento_entrada)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.email_entrada)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.unidade_origem)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-blue-700">
                    {formatarData(permuta.inicio_hmrg)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {texto(permuta.observacao)}
                  </td>
                </tr>
              ))}

              {permutas.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-10 text-center text-gray-500">
                    Nenhuma permuta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirmacaoStatus && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          onMouseDown={() => setConfirmacaoStatus(null)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                confirmacaoStatus.novoStatus === "concluida"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {confirmacaoStatus.novoStatus === "concluida" ? (
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="m6 6 12 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            <h3 className="mt-4 text-lg font-bold text-gray-800">
              {confirmacaoStatus.novoStatus === "concluida"
                ? "Aprovar permuta?"
                : "Negar permuta?"}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {texto(confirmacaoStatus.permuta.nome_saida)} troca com{" "}
              {texto(confirmacaoStatus.permuta.nome_entrada)}.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmacaoStatus(null)}
                className="rounded-xl border px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarAlteracaoStatus}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition ${
                  confirmacaoStatus.novoStatus === "concluida"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmacaoStatus.novoStatus === "concluida"
                  ? "Aprovar"
                  : "Negar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAberto && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          onMouseDown={fecharModal}
        >
          <form
            onSubmit={salvarPermuta}
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-7xl overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {permutaEditando ? "Editar permuta" : "Nova permuta"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Busque quem sai do HMRG e preencha os dados de quem entra.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="rounded-full px-3 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {erro && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                Quem sai do HMRG
              </h4>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                <InputTexto
                  label="Matrícula"
                  value={formulario.matricula_saida}
                  onChange={(valor) => atualizarCampo("matricula_saida", valor)}
                  placeholder="Ex: 40524579"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  required
                  disabled={Boolean(permutaEditando)}
                  className="xl:col-span-2"
                />

                {!permutaEditando && (
                  <div className="flex items-end xl:col-span-2">
                    <button
                      type="button"
                      onClick={buscarColaboradorSaida}
                      disabled={buscandoSaida || salvando}
                      className="h-10 w-full rounded-xl bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {buscandoSaida ? "Buscando..." : "Buscar matrícula"}
                    </button>
                  </div>
                )}

                <InputTexto
                  label="Pref."
                  value={formulario.pref_saida}
                  disabled
                  className="xl:col-span-1"
                />

                <InputTexto
                  label="Nome"
                  value={formulario.nome_saida}
                  disabled
                  className="xl:col-span-4"
                />

                <InputTexto
                  label="Cargo"
                  value={formulario.cargo_saida}
                  disabled
                  className="xl:col-span-3"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-blue-700">
                Quem entra no HMRG
              </h4>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                <InputTexto
                  label="Matrícula"
                  value={formulario.matricula_entrada}
                  onChange={(valor) =>
                    atualizarCampo("matricula_entrada", valor)
                  }
                  placeholder="Ex: 40717512"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  required
                  className="xl:col-span-2"
                />

                <InputTexto
                  label="Pref."
                  value={formulario.pref_entrada}
                  onChange={(valor) => atualizarCampo("pref_entrada", valor)}
                  className="xl:col-span-1"
                />

                <InputTexto
                  label="Nome"
                  value={formulario.nome_entrada}
                  onChange={(valor) => atualizarCampo("nome_entrada", valor)}
                  required
                  className="xl:col-span-5"
                />

                <InputTexto
                  label="Cargo"
                  value={formulario.cargo_entrada}
                  onChange={(valor) => atualizarCampo("cargo_entrada", valor)}
                  required
                  className="xl:col-span-4"
                />

                <InputTexto
                  label="Carga horária"
                  value={formulario.carga_horaria_entrada}
                  onChange={(valor) =>
                    atualizarCampo("carga_horaria_entrada", valor)
                  }
                  placeholder="10 a 40"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  required
                  className="xl:col-span-2"
                />

                <InputTexto
                  label="Admissão"
                  value={formulario.exercicio_entrada}
                  onChange={(valor) =>
                    atualizarCampo("exercicio_entrada", valor)
                  }
                  type="date"
                  required
                  className="xl:col-span-2"
                />

                <InputTexto
                  label="CPF"
                  value={formulario.cpf_entrada}
                  onChange={(valor) => atualizarCampo("cpf_entrada", valor)}
                  className="xl:col-span-2"
                />

                <InputTexto
                  label="PIS"
                  value={formulario.pis_entrada}
                  onChange={(valor) => atualizarCampo("pis_entrada", valor)}
                  className="xl:col-span-2"
                />

                <InputTexto
                  label="Data de nascimento"
                  value={formulario.data_nascimento_entrada}
                  onChange={(valor) =>
                    atualizarCampo("data_nascimento_entrada", valor)
                  }
                  type="date"
                  className="xl:col-span-2"
                />

                <InputTexto
                  label="E-mail"
                  value={formulario.email_entrada}
                  onChange={(valor) => atualizarCampo("email_entrada", valor)}
                  type="email"
                  className="xl:col-span-4"
                />

                <InputTexto
                  label="Unidade origem"
                  value={formulario.unidade_origem}
                  onChange={(valor) => atualizarCampo("unidade_origem", valor)}
                  required
                  className="xl:col-span-4"
                />

                <InputTexto
                  label="Início no HMRG"
                  value={formulario.inicio_hmrg}
                  onChange={(valor) => atualizarCampo("inicio_hmrg", valor)}
                  type="date"
                  required
                  className="xl:col-span-2"
                />

                <label className="block xl:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Status
                  </span>

                  <select
                    value={formulario.status}
                    onChange={(e) =>
                      atualizarCampo("status", e.target.value as StatusPermuta)
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluida">Aprovada</option>
                    <option value="negada">Negada</option>
                  </select>
                </label>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-gray-700">
                Observação
              </span>

              <textarea
                value={formulario.observacao}
                onChange={(e) => atualizarCampo("observacao", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando || buscandoSaida}
                className="rounded-xl border px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando || buscandoSaida}
                className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : permutaEditando
                  ? "Salvar alterações"
                  : "Salvar permuta"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
