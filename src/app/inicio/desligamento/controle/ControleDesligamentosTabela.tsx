"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type DesligamentoControle = {
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
  data_desligamento: string | null;
  tipo_desligamento: string | null;
  data_aso: string | null;
  data_homologacao: string | null;
  base_origem: string | null;
  status_sede: string | null;
  status_base: string | null;
  observacao: string | null;
  criado_em: string | null;
  criado_por_email: string | null;
  atualizado_em: string | null;
  atualizado_por_email: string | null;
};

type FormularioDesligamento = {
  id?: number;
  pref: string;
  matricula: string;
  nome: string;
  cargo: string;
  carga_horaria: string;
  exercicio: string;
  cpf: string;
  pis: string;
  data_nascimento: string;
  email: string;
  data_desligamento: string;
  tipo_desligamento: string;
  data_aso: string;
  data_homologacao: string;
  base_origem: string;
  observacao: string;
};

const FORM_INICIAL: FormularioDesligamento = {
  pref: "",
  matricula: "",
  nome: "",
  cargo: "",
  carga_horaria: "",
  exercicio: "",
  cpf: "",
  pis: "",
  data_nascimento: "",
  email: "",
  data_desligamento: "",
  tipo_desligamento: "",
  data_aso: "",
  data_homologacao: "",
  base_origem: "",
  observacao: "",
};

const TIPOS_DESLIGAMENTO = [
  "TÉRMINO DE CONTRATO",
  "NÃO RENOVAÇÃO DE CONTRATO",
  "INICIATIVA DO EMPREGADO",
  "INICIATIVA DO EMPREGADOR",
  "JUSTA CAUSA",
];

const CAMPOS_MAIUSCULOS: (keyof FormularioDesligamento)[] = [
  "nome",
  "cargo",
  "tipo_desligamento",
  "observacao",
];

function texto(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "-";

  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }

  return String(valor);
}

function normalizarTextoMaiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

function dataParaInput(valor: string | null | undefined) {
  if (!valor) return "";

  const textoData = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(textoData)) {
    return textoData.slice(0, 10);
  }

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

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(textoData)) {
    return textoData;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) {
    const [ano, mes, dia] = apenasData.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return textoData;
}

function baseOrigemLabel(valor: string | null | undefined) {
  if (valor === "gestao_rh") return "Gestão RH";
  if (valor === "colaboradores") return "Colaboradores";
  return "-";
}

function statusClass(status: string | null | undefined) {
  const valor = String(status || "").toLowerCase();

  if (valor === "enviado" || valor === "computado" || valor === "subido") {
    return "bg-green-50 text-green-700";
  }

  if (valor === "erro") {
    return "bg-red-50 text-red-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function validarMatricula(matricula: string) {
  const valor = matricula.trim();

  if (!valor) {
    return "A matrícula é obrigatória.";
  }

  if (!/^40\d{6}$/.test(valor)) {
    return "Matrícula deve ter 8 dígitos e começar com 40. Ex: 40524579.";
  }

  return "";
}

function normalizarFormulario(formulario: FormularioDesligamento) {
  return {
    ...formulario,
    pref: formulario.pref.trim(),
    matricula: formulario.matricula.trim(),
    nome: normalizarTextoMaiusculo(formulario.nome.trim()),
    cargo: normalizarTextoMaiusculo(formulario.cargo.trim()),
    carga_horaria: formulario.carga_horaria.trim(),
    cpf: formulario.cpf.trim(),
    pis: formulario.pis.trim(),
    email: formulario.email.trim().toLowerCase(),
    tipo_desligamento: normalizarTextoMaiusculo(
      formulario.tipo_desligamento.trim()
    ),
    observacao: normalizarTextoMaiusculo(formulario.observacao.trim()),
  };
}

function formatarValorExcel(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined) return "";

  if (typeof valor === "boolean") {
    return valor ? '"Sim"' : '"Não"';
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

  return `desligamentos-voxx-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
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

type SelectCampoProps = {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  required?: boolean;
};

function SelectCampo({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  className = "",
  required = false,
}: SelectCampoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 h-10 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>

        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ControleDesligamentosTabela() {
  const [desligamentos, setDesligamentos] = useState<DesligamentoControle[]>(
    []
  );
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoColaborador, setBuscandoColaborador] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [desligamentoEditando, setDesligamentoEditando] =
    useState<DesligamentoControle | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioDesligamento>(FORM_INICIAL);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const pendentesSede = useMemo(() => {
    return desligamentos.filter(
      (desligamento) => desligamento.status_sede === "pendente"
    );
  }, [desligamentos]);

  const pendentesBase = useMemo(() => {
    return desligamentos.filter(
      (desligamento) => desligamento.status_base === "pendente"
    );
  }, [desligamentos]);

  async function buscarDesligamentos(valorBusca = busca) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();

    if (valorBusca.trim()) {
      params.set("busca", valorBusca.trim());
    }

    const url = params.toString()
      ? `/api/desligamento/controle?${params.toString()}`
      : "/api/desligamento/controle";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar desligamentos.");
      setDesligamentos([]);
      setLoading(false);
      return;
    }

    setDesligamentos(resultado.desligamentos ?? []);
    setLoading(false);
  }

  useEffect(() => {
    buscarDesligamentos("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modalAberto) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        fecharModal();
      }
    }

    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [modalAberto]);

  function atualizarCampo(
    campo: keyof FormularioDesligamento,
    valor: string
  ) {
    let valorTratado = valor;

    if (CAMPOS_MAIUSCULOS.includes(campo)) {
      valorTratado = normalizarTextoMaiusculo(valor);
    }

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [campo]: valorTratado,
    }));
  }

  function abrirModalNovoDesligamento() {
    setFormulario(FORM_INICIAL);
    setDesligamentoEditando(null);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirModalEditar(desligamento: DesligamentoControle) {
    setDesligamentoEditando(desligamento);
    setErro("");
    setSucesso("");

    setFormulario({
      id: desligamento.id,
      pref: desligamento.pref || "",
      matricula: desligamento.matricula || "",
      nome: desligamento.nome || "",
      cargo: desligamento.cargo || "",
      carga_horaria: desligamento.carga_horaria || "",
      exercicio: dataParaInput(desligamento.exercicio),
      cpf: desligamento.cpf || "",
      pis: desligamento.pis || "",
      data_nascimento: dataParaInput(desligamento.data_nascimento),
      email: desligamento.email || "",
      data_desligamento: dataParaInput(desligamento.data_desligamento),
      tipo_desligamento: desligamento.tipo_desligamento || "",
      data_aso: dataParaInput(desligamento.data_aso),
      data_homologacao: dataParaInput(desligamento.data_homologacao),
      base_origem: desligamento.base_origem || "",
      observacao: desligamento.observacao || "",
    });

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando || buscandoColaborador) return;

    setModalAberto(false);
    setDesligamentoEditando(null);
    setFormulario(FORM_INICIAL);
  }

  async function buscarColaboradorPorMatricula() {
    setErro("");
    setSucesso("");

    const erroMatricula = validarMatricula(formulario.matricula);

    if (erroMatricula) {
      setErro(erroMatricula);
      return;
    }

    setBuscandoColaborador(true);

    const response = await fetch(
      `/api/desligamento/buscar-colaborador?matricula=${encodeURIComponent(
        formulario.matricula.trim()
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao buscar colaborador.");
      setBuscandoColaborador(false);
      return;
    }

    if (!resultado.encontrado || !resultado.colaborador) {
      setErro(
        resultado.message || "Nenhum colaborador encontrado para esta matrícula."
      );
      setBuscandoColaborador(false);
      return;
    }

    const colaborador = resultado.colaborador;

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      pref: colaborador.pref || "",
      matricula: colaborador.matricula || formularioAtual.matricula,
      nome: colaborador.nome || "",
      cargo: colaborador.cargo || "",
      carga_horaria: colaborador.carga_horaria || "",
      exercicio: dataParaInput(colaborador.exercicio),
      cpf: colaborador.cpf || "",
      pis: colaborador.pis || "",
      data_nascimento: dataParaInput(colaborador.data_nascimento),
      email: colaborador.email || "",
      base_origem: colaborador.base_origem || "",
    }));

    setBuscandoColaborador(false);
  }

  function validarAntesDeSalvar() {
    const erroMatricula = validarMatricula(formulario.matricula);

    if (erroMatricula) return erroMatricula;

    if (!formulario.nome.trim()) {
      return "Busque o colaborador pela matrícula antes de salvar.";
    }

    if (!formulario.data_desligamento) {
      return "A data do desligamento é obrigatória.";
    }

    if (!formulario.tipo_desligamento) {
      return "O tipo de desligamento é obrigatório.";
    }

    return "";
  }

  async function salvarDesligamento(e: FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const erroValidacao = validarAntesDeSalvar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    const editando = Boolean(desligamentoEditando);
    const formularioNormalizado = normalizarFormulario(formulario);

    const response = await fetch("/api/desligamento/controle", {
      method: editando ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formularioNormalizado,
        id: desligamentoEditando?.id,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao salvar desligamento.");
      setSalvando(false);
      return;
    }

    setSucesso(
      editando
        ? "Desligamento atualizado com sucesso."
        : "Desligamento salvo com sucesso."
    );

    setSalvando(false);
    fecharModal();
    buscarDesligamentos(busca);
  }

  function baixarExcel() {
    const cabecalho = [
      "Pref.",
      "Matrícula",
      "Nome",
      "Cargo",
      "Carga Horária",
      "Exercício",
      "CPF",
      "PIS",
      "Nascimento",
      "E-mail",
      "Data do desligamento",
      "Tipo de desligamento",
      "Data do ASO",
      "Data da homologação",
      "Base origem",
      "Status SEDE",
      "Status Base",
      "Observação",
    ];

    const linhas = desligamentos.map((desligamento) => [
      desligamento.pref,
      desligamento.matricula,
      desligamento.nome,
      desligamento.cargo,
      desligamento.carga_horaria,
      formatarData(desligamento.exercicio),
      desligamento.cpf,
      desligamento.pis,
      formatarData(desligamento.data_nascimento),
      desligamento.email,
      formatarData(desligamento.data_desligamento),
      desligamento.tipo_desligamento,
      formatarData(desligamento.data_aso),
      formatarData(desligamento.data_homologacao),
      baseOrigemLabel(desligamento.base_origem),
      desligamento.status_sede,
      desligamento.status_base,
      desligamento.observacao,
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
  }

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    buscarDesligamentos(busca);
  }

  function limparBusca() {
    setBusca("");
    buscarDesligamentos("");
  }

  return (
    <section className="mt-8 min-w-0 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={abrirModalNovoDesligamento}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Novo desligamento
            </button>

            <button
              type="button"
              disabled
              title="Vamos ativar este botão em uma próxima etapa."
              className="rounded-xl border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400"
            >
              Términos de Contrato
            </button>

            <button
              type="button"
              disabled
              title="Vamos ativar este botão em uma próxima etapa."
              className="rounded-xl border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400"
            >
              Enviar para SEDE ({pendentesSede.length})
            </button>

            <button
              type="button"
              disabled
              title="Vamos ativar este botão em uma próxima etapa."
              className="rounded-xl border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400"
            >
              Computar desligamento ({pendentesBase.length})
            </button>
          </div>

          <form onSubmit={pesquisar} className="flex w-full gap-3 xl:w-auto">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, matrícula, CPF, cargo ou e-mail"
              className="h-10 w-full rounded-xl border border-gray-300 px-4 text-center text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-96"
            />

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
              onClick={baixarExcel}
              disabled={loading || desligamentos.length === 0}
              title="Baixar Excel"
              aria-label="Baixar Excel"
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
            {desligamentos.length}{" "}
            {desligamentos.length === 1 ? "desligamento" : "desligamentos"}
          </span>

          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
            {pendentesSede.length} pendente
            {pendentesSede.length === 1 ? "" : "s"} para SEDE
          </span>

          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
            {pendentesBase.length} pendente
            {pendentesBase.length === 1 ? "" : "s"} para computar
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
          Carregando desligamentos...
        </div>
      ) : (
        <div className="w-full max-w-full overflow-x-auto rounded-xl border">
          <table className="min-w-[1770px] text-center text-xs [&_td]:border-r [&_td]:border-slate-200/70 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200/70 [&_th:last-child]:border-r-0">
            <thead className="bg-slate-100">
              <tr className="border-b text-gray-600">
                <th className="px-3 py-4 text-center">Ações</th>
                <th className="px-3 py-4 text-center">Pref.</th>
                <th className="px-3 py-4 text-center">Matrícula</th>
                <th className="px-3 py-4 text-center">Nome</th>
                <th className="px-3 py-4 text-center">Cargo</th>
                <th className="px-3 py-4 text-center">CH</th>
                <th className="w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center">Exercício</th>
                <th className="px-3 py-4 text-center">Data do<br />desligamento</th>
                <th className="px-3 py-4 text-center">Tipo</th>
                <th className="w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center">ASO</th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] px-1 py-4 text-center">Homologação</th>
                <th className="px-3 py-4 text-center">Base origem</th>
                <th className="px-3 py-4 text-center">Status SEDE</th>
                <th className="px-3 py-4 text-center">Status Base</th>
                <th className="px-3 py-4 text-center">Obs.</th>
              </tr>
            </thead>

            <tbody>
              {desligamentos.map((desligamento) => (
                <tr
                  key={desligamento.id}
                  className="border-b align-middle hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(desligamento)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      Editar
                    </button>
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {texto(desligamento.pref)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-gray-800">
                    {texto(desligamento.matricula)}
                  </td>

                  <td className="min-w-[180px] px-3 py-4 text-center align-middle font-semibold text-gray-800">
                    {texto(desligamento.nome)}
                  </td>

                  <td className="min-w-[180px] px-3 py-4 text-center align-middle text-gray-700">
                    {texto(desligamento.cargo)}
                  </td>

                  <td className="min-w-[80px] whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {texto(desligamento.carga_horaria)}
                  </td>

                  <td className="w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center align-middle text-gray-700">
                    {formatarData(desligamento.exercicio)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle font-semibold text-red-700">
                    {formatarData(desligamento.data_desligamento)}
                  </td>

                  <td className="min-w-[90px] px-3 py-4 text-center align-middle text-gray-700">
                    {texto(desligamento.tipo_desligamento)}
                  </td>

                  <td className="w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center align-middle text-gray-700">
                    {formatarData(desligamento.data_aso)}
                  </td>

                  <td className="w-[80px] min-w-[80px] max-w-[80px] px-1 py-4 text-center align-middle text-gray-700">
                    {formatarData(desligamento.data_homologacao)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-gray-700">
                    {baseOrigemLabel(desligamento.base_origem)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        desligamento.status_sede
                      )}`}
                    >
                      {texto(desligamento.status_sede)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        desligamento.status_base
                      )}`}
                    >
                      {texto(desligamento.status_base)}
                    </span>
                  </td>

                  <td className="min-w-[240px] px-3 py-4 text-center align-middle text-gray-700">
                    {texto(desligamento.observacao)}
                  </td>
                </tr>
              ))}

              {desligamentos.length === 0 && (
                <tr>
                  <td
                    colSpan={15}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Nenhum desligamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          onMouseDown={fecharModal}
        >
          <form
            onSubmit={salvarDesligamento}
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {erro && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                    {erro}
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-800">
                  {desligamentoEditando
                    ? "Editar desligamento"
                    : "Novo desligamento"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {desligamentoEditando
                    ? "Atualize os dados do desligamento selecionado."
                    : "Informe a matrícula, busque o colaborador e preencha os dados do desligamento."}
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
                  
                {/* LINHA 1 - MATRÍCULA, BUSCA, PREF. E NOME */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-24">
              <InputTexto
                label="Matrícula"
                value={formulario.matricula}
                onChange={(valor) => atualizarCampo("matricula", valor)}
                placeholder="Ex: 40524579"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                className="lg:col-span-3"
              />

              <div className="flex items-end lg:col-span-4">
                <button
                  type="button"
                  onClick={buscarColaboradorPorMatricula}
                  disabled={buscandoColaborador || salvando}
                  className="h-10 w-full rounded-xl bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buscandoColaborador ? "Buscando..." : "Buscar matrícula"}
                </button>
              </div>

              <InputTexto
                label="Pref."
                value={formulario.pref}
                disabled
                className="w-16 lg:col-span-2"
              />

              <InputTexto
                label="Nome"
                value={formulario.nome}
                disabled
                className="lg:col-span-15"
              />

              {/* LINHA 2 - CARGO, BASE, CARGA HORÁRIA E CPF */}
              <InputTexto
                label="Cargo"
                value={formulario.cargo}
                disabled
                className="lg:col-span-9"
              />

              <InputTexto
                label="Base origem"
                value={baseOrigemLabel(formulario.base_origem)}
                disabled
                className="lg:col-span-4"
              />

              <InputTexto
                label="Carga horária"
                value={formulario.carga_horaria}
                disabled
                className="lg:col-span-3"
              />

              <InputTexto
                label="CPF"
                value={formulario.cpf}
                disabled
                className="lg:col-span-4"
              />

              <InputTexto
                  label="Exercício"
                  value={formulario.exercicio}
                  type="date"
                  disabled
                  className="lg:col-span-4"
                />

              {/* LINHA 3 - PIS, NASCIMENTO E E-MAIL */}
              <InputTexto
                label="PIS"
                value={formulario.pis}
                disabled
                className="lg:col-span-4"
              />

              <InputTexto
                label="Data de nascimento"
                value={formulario.data_nascimento}
                type="date"
                disabled
                className="lg:col-span-5"
              />

              <InputTexto
                label="E-mail"
                value={formulario.email}
                disabled
                className="lg:col-span-15"
              />

              

              {/* LINHA 4 - TIPO E DATAS */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-24 lg:grid-cols-[repeat(24,minmax(0,1fr))]">
                <SelectCampo
                  label="Tipo de desligamento"
                  value={formulario.tipo_desligamento}
                  onChange={(valor) => atualizarCampo("tipo_desligamento", valor)}
                  required
                  className="lg:col-span-7"
                  options={TIPOS_DESLIGAMENTO.map((tipo) => ({
                    value: tipo,
                    label: tipo,
                  }))}
                />

                <InputTexto
                  label="Data do ASO"
                  value={formulario.data_aso}
                  onChange={(valor) => atualizarCampo("data_aso", valor)}
                  type="date"
                  className="lg:col-span-4"
                />

                <InputTexto
                  label="Data do desligamento"
                  value={formulario.data_desligamento}
                  onChange={(valor) => atualizarCampo("data_desligamento", valor)}
                  type="date"
                  required
                  className="lg:col-span-7"
                />
                <InputTexto
                  label="Data da homologação"
                  value={formulario.data_homologacao}
                  onChange={(valor) => atualizarCampo("data_homologacao", valor)}
                  type="date"
                  className="lg:col-span-6"
                />
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
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-center text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando || buscandoColaborador}
                className="rounded-xl border px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando || buscandoColaborador}
                className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : desligamentoEditando
                  ? "Salvar alterações"
                  : "Salvar desligamento"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}