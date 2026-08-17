"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

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

type TerminoContrato = {
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
  base_origem: string | null;
  regra_contrato: string | null;
  ano_contrato: number | null;
  anos_maximos: number | null;
  data_termino: string | null;
  dias_restantes: number;
  status_termino: string;
  status_termino_label: string;
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

const MESES_TERMINOS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

function mesAtual() {
  return String(new Date().getMonth() + 1);
}

function anoAtual() {
  return String(new Date().getFullYear());
}

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

function statusClass(status: string | null | undefined, temaDia = false) {
  const valor = String(status || "").toLowerCase();

  if (valor === "enviado" || valor === "computado" || valor === "subido") {
    return temaDia
      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }

  if (valor === "erro") {
    return temaDia
      ? "border border-red-200 bg-red-50 text-red-700"
      : "border border-red-300/25 bg-red-400/10 text-red-100";
  }

  return temaDia
    ? "border border-yellow-200 bg-yellow-50 text-yellow-700"
    : "border border-yellow-300/25 bg-yellow-300/10 text-yellow-100";
}

function statusTerminoClass(status: string | null | undefined, temaDia = false) {
  const valor = String(status || "").toLowerCase();

  if (valor === "vencido") {
    return temaDia
      ? "border border-red-200 bg-red-50 text-red-700"
      : "border border-red-300/25 bg-red-400/10 text-red-100";
  }

  if (valor === "vence_hoje") {
    return temaDia
      ? "border border-yellow-200 bg-yellow-50 text-yellow-700"
      : "border border-yellow-300/25 bg-yellow-300/10 text-yellow-100";
  }

  if (valor === "futuro") {
    return temaDia
      ? "border border-blue-200 bg-blue-50 text-blue-700"
      : "border border-blue-300/25 bg-blue-300/10 text-blue-100";
  }

  return temaDia
    ? "border border-slate-200 bg-slate-50 text-slate-700"
    : "border border-white/10 bg-white/[0.06] text-slate-200";
}

function formatarDiasRestantes(dias: number) {
  if (dias < 0) {
    const diasVencido = Math.abs(dias);
    return `${diasVencido} ${diasVencido === 1 ? "dia" : "dias"} vencido`;
  }

  if (dias === 0) {
    return "Vence hoje";
  }

  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
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

  return `desligamentos-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
}

function gerarNomeArquivoTerminosContrato() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  return `terminos-contrato-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
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
  inputMode,
  pattern,
  maxLength,
  className = "",
  disabled = false,
}: InputTextoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="voxx-text-primary text-sm font-semibold">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        disabled={disabled}
        className={`voxx-field mt-1 h-11 w-full rounded-2xl px-3 text-sm ${
          disabled
            ? "cursor-not-allowed opacity-55"
            : ""
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
      <span className="voxx-text-primary text-sm font-semibold">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="voxx-field mt-1 h-11 w-full rounded-2xl px-3 text-sm"
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
  const { temaDia } = useTema();
  const [desligamentos, setDesligamentos] = useState<DesligamentoControle[]>(
    []
  );
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoColaborador, setBuscandoColaborador] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTerminosAberto, setModalTerminosAberto] = useState(false);
  const [voltarParaTerminos, setVoltarParaTerminos] = useState(false);
  const [loadingTerminos, setLoadingTerminos] = useState(false);
  const [erroTerminos, setErroTerminos] = useState("");
  const [terminosContrato, setTerminosContrato] = useState<TerminoContrato[]>(
    []
  );
  const [buscaTermino, setBuscaTermino] = useState("");
  const [mesTerminos, setMesTerminos] = useState(mesAtual);
  const [anoTerminos, setAnoTerminos] = useState(anoAtual);
  const [filtroPrefTermino, setFiltroPrefTermino] = useState("todos");
  const [paginaTerminos, setPaginaTerminos] = useState(1);
  const [itensPorPaginaTerminos, setItensPorPaginaTerminos] = useState(25);
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

  const terminosFiltrados = useMemo(() => {
    const termo = buscaTermino.trim().toLowerCase();

    return terminosContrato.filter((termino) => {
      const passaPref =
        filtroPrefTermino === "todos" || termino.pref === filtroPrefTermino;

      const textoBusca = [
        termino.matricula,
        termino.nome,
        termino.cargo,
        termino.cpf,
        termino.email,
        termino.pref,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const passaBusca = !termo || textoBusca.includes(termo);

      return passaPref && passaBusca;
    });
  }, [terminosContrato, filtroPrefTermino, buscaTermino]);

  const resumoTerminos = useMemo(() => {
    return {
      vencidos: terminosFiltrados.filter(
        (termino) => termino.status_termino === "vencido"
      ).length,
      hoje: terminosFiltrados.filter(
        (termino) => termino.status_termino === "vence_hoje"
      ).length,
      futuros: terminosFiltrados.filter(
        (termino) => termino.status_termino === "futuro"
      ).length,
    };
  }, [terminosFiltrados]);

  const totalPaginasTerminos = Math.max(
    1,
    Math.ceil(terminosFiltrados.length / itensPorPaginaTerminos)
  );

  const terminosPaginados = useMemo(() => {
    const inicio = (paginaTerminos - 1) * itensPorPaginaTerminos;
    const fim = inicio + itensPorPaginaTerminos;

    return terminosFiltrados.slice(inicio, fim);
  }, [terminosFiltrados, paginaTerminos, itensPorPaginaTerminos]);

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

  async function buscarTerminosContrato(
    mes = mesTerminos,
    ano = anoTerminos
  ) {
    setLoadingTerminos(true);
    setErroTerminos("");

    const params = new URLSearchParams({
      mes,
      ano,
    });

    const response = await fetch(
      `/api/desligamento/terminos-contrato?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErroTerminos(
        resultado.error || "Erro ao carregar términos de contrato."
      );
      setTerminosContrato([]);
      setLoadingTerminos(false);
      return;
    }

    setTerminosContrato(resultado.terminos ?? []);
    setLoadingTerminos(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarDesligamentos("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modalAberto) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (salvando || buscandoColaborador) return;

        const deveVoltarParaTerminos = voltarParaTerminos;

        setModalAberto(false);
        setDesligamentoEditando(null);
        setFormulario(FORM_INICIAL);
        setVoltarParaTerminos(false);

        if (deveVoltarParaTerminos) {
          setModalTerminosAberto(true);
        }
      }
    }

    document.addEventListener("keydown", handleEsc, true);

    return () => {
      document.removeEventListener("keydown", handleEsc, true);
    };
  }, [modalAberto, salvando, buscandoColaborador, voltarParaTerminos]);

  useEffect(() => {
    if (!modalTerminosAberto) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        setModalTerminosAberto(false);
        setErroTerminos("");
      }
    }

    document.addEventListener("keydown", handleEsc, true);

    return () => {
      document.removeEventListener("keydown", handleEsc, true);
    };
  }, [modalTerminosAberto]);

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
    setVoltarParaTerminos(false);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirModalEditar(desligamento: DesligamentoControle) {
    setDesligamentoEditando(desligamento);
    setVoltarParaTerminos(false);
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

    setVoltarParaTerminos(false);
    setModalAberto(true);
  }

  function abrirModalDesligamentoPorTermino(termino: TerminoContrato) {
    setDesligamentoEditando(null);
    setErro("");
    setSucesso("");
    setErroTerminos("");

    setFormulario({
      pref: termino.pref || "",
      matricula: termino.matricula || "",
      nome: termino.nome || "",
      cargo: termino.cargo || "",
      carga_horaria: termino.carga_horaria || "",
      exercicio: dataParaInput(termino.exercicio),
      cpf: termino.cpf || "",
      pis: termino.pis || "",
      data_nascimento: dataParaInput(termino.data_nascimento),
      email: termino.email || "",
      data_desligamento: dataParaInput(termino.data_termino),
      tipo_desligamento: TIPOS_DESLIGAMENTO[0],
      data_aso: "",
      data_homologacao: "",
      base_origem: termino.base_origem || "",
      observacao: termino.observacao || "",
    });

    setModalTerminosAberto(false);
    setVoltarParaTerminos(true);
    setModalAberto(true);
  }

  function alterarAnoTerminos(delta: number) {
    const anoBase = Number(anoTerminos) || new Date().getFullYear();
    const novoAno = String(Math.max(1900, anoBase + delta));

    setAnoTerminos(novoAno);
    setPaginaTerminos(1);
    buscarTerminosContrato(mesTerminos, novoAno);
  }

  async function abrirModalTerminos() {
    setModalTerminosAberto(true);
    setVoltarParaTerminos(false);
    setBuscaTermino("");
    setFiltroPrefTermino("todos");
    setPaginaTerminos(1);
    await buscarTerminosContrato(mesTerminos, anoTerminos);
  }

  function fecharModal() {
    if (salvando || buscandoColaborador) return;

    const deveVoltarParaTerminos = voltarParaTerminos;

    setModalAberto(false);
    setDesligamentoEditando(null);
    setFormulario(FORM_INICIAL);
    setVoltarParaTerminos(false);

    if (deveVoltarParaTerminos) {
      setModalTerminosAberto(true);
    }
  }

  function fecharModalTerminos() {
    if (loadingTerminos) return;

    setModalTerminosAberto(false);
    setVoltarParaTerminos(false);
    setErroTerminos("");
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

    const deveVoltarParaTerminos = voltarParaTerminos;

    setSalvando(false);
    setModalAberto(false);
    setDesligamentoEditando(null);
    setFormulario(FORM_INICIAL);
    setVoltarParaTerminos(false);

    if (deveVoltarParaTerminos) {
      setModalTerminosAberto(true);
      buscarTerminosContrato(mesTerminos, anoTerminos);
    }

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

  function baixarExcelTerminosContrato() {
    const cabecalho = [
      "Status",
      "Pref.",
      "Matrícula",
      "Nome",
      "Função",
      "CH",
      "Exercício",
      "Término",
      "Prazo",
      "Base",
      "Marco",
    ];

    const linhas = terminosFiltrados.map((termino) => [
      termino.status_termino_label,
      termino.pref,
      termino.matricula,
      termino.nome,
      termino.cargo,
      termino.carga_horaria,
      formatarData(termino.exercicio),
      formatarData(termino.data_termino),
      formatarDiasRestantes(termino.dias_restantes),
      baseOrigemLabel(termino.base_origem),
      termino.ano_contrato && termino.anos_maximos
        ? `${termino.ano_contrato}/${termino.anos_maximos}`
        : "-",
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
    link.download = gerarNomeArquivoTerminosContrato();
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

  const campoBuscaClass = "voxx-field h-11 w-full rounded-2xl px-4 text-center text-sm xl:w-96";

  const textoSecundarioTabela = temaDia ? "text-slate-600" : "text-slate-300";
  const textoDestaqueTabela = temaDia ? "text-slate-950" : "text-slate-100";
  return (
    <section className="voxx-desligamento-module voxx-surface mt-6 min-w-0 overflow-hidden rounded-[26px] p-5">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={abrirModalNovoDesligamento}
              className="voxx-button-primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Novo desligamento
            </button>

            <button
              type="button"
              onClick={abrirModalTerminos}
              disabled={loadingTerminos}
              className="voxx-button-secondary rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingTerminos ? "Carregando..." : "Términos de Contrato"}
            </button>

            <button
              type="button"
              disabled
              title="Vamos ativar este botão em uma próxima etapa."
              className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-400" : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-500"}
            >
              Enviar para SEDE ({pendentesSede.length})
            </button>

            <button
              type="button"
              disabled
              title="Vamos ativar este botão em uma próxima etapa."
              className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-400" : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-500"}
            >
              Computar desligamento ({pendentesBase.length})
            </button>
          </div>

          <form onSubmit={pesquisar} className="flex w-full gap-3 xl:w-auto">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={campoBuscaClass}
            />

            <button
              type="submit"
              disabled={loading}
              className="voxx-button-primary h-11 rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={limparBusca}
              disabled={loading}
              className="voxx-button-secondary h-11 rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={baixarExcel}
              disabled={loading || desligamentos.length === 0}
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
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700" : "rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200"}>
            {desligamentos.length}{" "}
            {desligamentos.length === 1 ? "desligamento" : "desligamentos"}
          </span>

          <span className={temaDia ? "rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700" : "rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100"}>
            {pendentesSede.length} pendente
            {pendentesSede.length === 1 ? "" : "s"} para SEDE
          </span>

          <span className={temaDia ? "rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700" : "rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100"}>
            {pendentesBase.length} pendente
            {pendentesBase.length === 1 ? "" : "s"} para computar
          </span>
        </div>
      </div>

      {erro && !modalAberto && (
        <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          {sucesso}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">
          Carregando desligamentos...
        </div>
      ) : (
        <div className="voxx-scrollbar voxx-surface-raised w-full max-w-full overflow-x-auto rounded-[22px]">
          <table className={temaDia ? "min-w-[1830px] text-center text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0" : "min-w-[1830px] text-center text-xs [&_td]:border-r [&_td]:border-white/10 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0"}>
            <thead className={temaDia ? "sticky top-0 z-10 bg-slate-100" : "sticky top-0 z-10 bg-[#2a3040]"}>
              <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                <th className="px-3 py-4 text-center">#</th>
                <th className="px-3 py-4 text-center">Ações</th>
                <th className="px-3 py-4 text-center">Pref.</th>
                <th className="px-3 py-4 text-center">Matrícula</th>
                <th className="px-3 py-4 text-center">Nome</th>
                <th className="px-3 py-4 text-center">Cargo</th>
                <th className="px-3 py-4 text-center">CH</th>
                <th className="w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center">
                  Exercício
                </th>
                <th className="px-3 py-4 text-center">
                  Data do
                  <br />
                  desligamento
                </th>
                <th className="px-3 py-4 text-center">Tipo</th>
                <th className="w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center">
                  ASO
                </th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] px-1 py-4 text-center">
                  Homologação
                </th>
                <th className="px-3 py-4 text-center">Base origem</th>
                <th className="px-3 py-4 text-center">Status SEDE</th>
                <th className="px-3 py-4 text-center">Status Base</th>
                <th className="px-3 py-4 text-center">Obs.</th>
              </tr>
            </thead>

            <tbody>
              {desligamentos.map((desligamento, indice) => (
                <tr
                  key={desligamento.id}
                  className={temaDia ? "border-b border-slate-200 align-middle text-slate-700 transition hover:bg-slate-50" : "border-b border-white/10 align-middle text-slate-200 transition hover:bg-white/[0.055]"}
                >
                  <td className="px-3 py-4 text-center align-middle">
                    <span className={temaDia ? "inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2 text-[11px] font-bold text-slate-700" : "inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] px-2 text-[11px] font-bold text-slate-200"}>
                      {indice + 1}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(desligamento)}
                      className={temaDia ? "rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200" : "rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.1]"}
                    >
                      Editar
                    </button>
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(desligamento.pref)}
                  </td>

                  <td className={`whitespace-nowrap px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                    {texto(desligamento.matricula)}
                  </td>

                  <td className={`min-w-[180px] px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                    {texto(desligamento.nome)}
                  </td>

                  <td className={`min-w-[180px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(desligamento.cargo)}
                  </td>

                  <td className={`min-w-[80px] whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(desligamento.carga_horaria)}
                  </td>

                  <td className={`w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {formatarData(desligamento.exercicio)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle font-semibold text-red-100">
                    {formatarData(desligamento.data_desligamento)}
                  </td>

                  <td className={`min-w-[90px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(desligamento.tipo_desligamento)}
                  </td>

                  <td className={`w-[60px] min-w-[60px] max-w-[60px] px-1 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {formatarData(desligamento.data_aso)}
                  </td>

                  <td className={`w-[80px] min-w-[80px] max-w-[80px] px-1 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {formatarData(desligamento.data_homologacao)}
                  </td>

                  <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {baseOrigemLabel(desligamento.base_origem)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        desligamento.status_sede,
                        temaDia
                      )}`}
                    >
                      {texto(desligamento.status_sede)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        desligamento.status_base,
                        temaDia
                      )}`}
                    >
                      {texto(desligamento.status_base)}
                    </span>
                  </td>

                  <td className={`min-w-[240px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(desligamento.observacao)}
                  </td>
                </tr>
              ))}

              {desligamentos.length === 0 && (
                <tr>
                  <td
                    colSpan={16}
                    className={temaDia ? "px-4 py-10 text-center text-slate-500" : "px-4 py-10 text-center text-slate-400"}
                  >
                    Nenhum desligamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalTerminosAberto && (
        <div
          className="voxx-desligamento-modal fixed inset-0 z-[95] flex items-center justify-center bg-[var(--voxx-overlay)] px-4 backdrop-blur-sm"
          onMouseDown={fecharModalTerminos}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="voxx-surface-raised flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={temaDia ? "text-2xl font-bold text-slate-950" : "text-2xl font-bold text-slate-100"}>
                  Términos de Contrato
                </h3>

                <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
                  Colaboradores cujo prazo final do contrato vence no mês e ano
                  selecionados. Nesta etapa, a tela é apenas para conferência.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalTerminos}
                disabled={loadingTerminos}
                className={temaDia ? "rounded-full px-3 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60" : "rounded-full px-3 py-1 text-slate-400 hover:bg-white/[0.04] hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"}
              >
                ×
              </button>
            </div>

            {erroTerminos && (
              <div className={temaDia ? "mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "mt-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"}>
                {erroTerminos}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[170px_110px_110px_1fr] lg:w-[860px]">
                <label className="block">
                  <span className={temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-semibold text-slate-300"}>
                    Mês
                  </span>

                  <select
                    value={mesTerminos}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setMesTerminos(valor);
                      setPaginaTerminos(1);
                      buscarTerminosContrato(valor, anoTerminos);
                    }}
                    disabled={loadingTerminos}
                    className={temaDia ? "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition [color-scheme:light] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-white [&>option]:text-slate-900" : "mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition [color-scheme:dark] focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-[#171a23] [&>option]:text-slate-100"}
                  >
                    {MESES_TERMINOS.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-semibold text-slate-300"}>
                    Ano
                  </span>

                  <div className={temaDia ? "mt-1 flex h-10 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-sm" : "mt-1 flex h-10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] text-sm text-slate-100 shadow-sm"}>
                    <button
                      type="button"
                      onClick={() => alterarAnoTerminos(-1)}
                      disabled={loadingTerminos}
                      title="Ano anterior"
                      aria-label="Ano anterior"
                      className={temaDia ? "flex w-10 items-center justify-center bg-slate-50 text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "flex w-10 items-center justify-center bg-white/[0.08] text-blue-100 transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="m15 18-6-6 6-6"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <span className="flex min-w-0 flex-1 items-center justify-center px-2 font-semibold">
                      {anoTerminos}
                    </span>

                    <button
                      type="button"
                      onClick={() => alterarAnoTerminos(1)}
                      disabled={loadingTerminos}
                      title="Próximo ano"
                      aria-label="Próximo ano"
                      className={temaDia ? "flex w-10 items-center justify-center bg-slate-50 text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "flex w-10 items-center justify-center bg-white/[0.08] text-blue-100 transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="m9 18 6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className={temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-semibold text-slate-300"}>
                    Contrato
                  </span>

                  <select
                    value={filtroPrefTermino}
                    onChange={(e) => {
                      setFiltroPrefTermino(e.target.value);
                      setPaginaTerminos(1);
                    }}
                    disabled={loadingTerminos}
                    className={temaDia ? "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition [color-scheme:light] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-white [&>option]:text-slate-900" : "mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition [color-scheme:dark] focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-[#171a23] [&>option]:text-slate-100"}
                  >
                    <option value="todos">Todos</option>
                    <option value="47">47</option>
                    <option value="95">95</option>
                  </select>
                </label>

                <label className="block">
                  <span className={temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-semibold text-slate-300"}>
                    Buscar
                  </span>

                  <input
                    type="text"
                    value={buscaTermino}
                    onChange={(e) => {
                      setBuscaTermino(e.target.value);
                      setPaginaTerminos(1);
                    }}
                    className="voxx-field mt-1 h-10 w-full rounded-xl px-3 text-sm"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700" : "rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-200"}>
                  {terminosFiltrados.length} resultado
                  {terminosFiltrados.length === 1 ? "" : "s"}
                </span>

                <span className={temaDia ? "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700" : "rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-100"}>
                  {resumoTerminos.vencidos} vencido
                  {resumoTerminos.vencidos === 1 ? "" : "s"}
                </span>

                <span className={temaDia ? "rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" : "rounded-full border border-blue-300/25 bg-blue-300/10 px-3 py-1 text-xs font-semibold text-blue-100"}>
                  {resumoTerminos.futuros} a vencer
                </span>

                <span className={temaDia ? "rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700" : "rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100"}>
                  {resumoTerminos.hoje} hoje
                </span>

                <label className={temaDia ? "flex items-center gap-2 text-xs font-semibold text-slate-600" : "flex items-center gap-2 text-xs font-semibold text-slate-300"}>
                  Linhas:
                  <select
                    value={itensPorPaginaTerminos}
                    onChange={(e) => {
                      setItensPorPaginaTerminos(Number(e.target.value));
                      setPaginaTerminos(1);
                    }}
                    className={temaDia ? "h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none [color-scheme:light] [&>option]:bg-white [&>option]:text-slate-900" : "h-9 rounded-lg border border-white/10 bg-white/[0.06] px-2 text-xs text-slate-100 outline-none [color-scheme:dark] [&>option]:bg-[#171a23] [&>option]:text-slate-100"}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={baixarExcelTerminosContrato}
                  disabled={loadingTerminos || terminosFiltrados.length === 0}
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
                  onClick={() =>
                    buscarTerminosContrato(mesTerminos, anoTerminos)
                  }
                  disabled={loadingTerminos}
                  className={temaDia ? "h-10 rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "h-10 rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"}
                >
                  Atualizar
                </button>
              </div>
            </div>

            <div className="voxx-scrollbar voxx-surface-raised mt-5 max-h-[52vh] overflow-auto rounded-[22px]">
              <table className={temaDia ? "min-w-[1220px] text-center text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0" : "min-w-[1220px] text-center text-xs [&_td]:border-r [&_td]:border-white/10 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0"}>
                <thead className={temaDia ? "sticky top-0 z-10 bg-slate-100" : "sticky top-0 z-10 bg-[#2a3040]"}>
                  <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                    <th className="px-3 py-4 text-center">Status</th>
                    <th className="px-3 py-4 text-center">Pref.</th>
                    <th className="px-3 py-4 text-center">Matrícula</th>
                    <th className="px-3 py-4 text-center">Nome</th>
                    <th className="px-3 py-4 text-center">Função</th>
                    <th className="px-3 py-4 text-center">CH</th>
                    <th className="px-3 py-4 text-center">Exercício</th>
                    <th className="px-3 py-4 text-center">Término</th>
                    <th className="px-3 py-4 text-center">Prazo</th>
                    <th className="px-3 py-4 text-center">Base</th>
                    <th className="px-3 py-4 text-center">Marco</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingTerminos ? (
                    <tr>
                      <td
                        colSpan={11}
                        className={temaDia ? "px-4 py-10 text-center text-slate-500" : "px-4 py-10 text-center text-slate-400"}
                      >
                        Carregando términos de contrato...
                      </td>
                    </tr>
                  ) : (
                    <>
                      {terminosPaginados.map((termino) => (
                        <tr
                          key={`${termino.base_origem}-${termino.id}-${termino.matricula}-${termino.ano_contrato}`}
                          className={temaDia ? "border-b border-slate-200 align-middle text-slate-700 transition hover:bg-slate-50" : "border-b border-white/10 align-middle text-slate-200 transition hover:bg-white/[0.055]"}
                        >
                          <td className="whitespace-nowrap px-3 py-4 text-center align-middle">
                            <div className="mx-auto grid w-[150px] grid-cols-[1fr_1.75rem] items-center gap-2">
                              <span
                                className={`flex h-7 items-center justify-center rounded-full px-3 text-xs font-semibold ${statusTerminoClass(
                                  termino.status_termino,
                                  temaDia
                                )}`}
                              >
                                {termino.status_termino_label}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalDesligamentoPorTermino(termino)
                                }
                                title="Lançar desligamento"
                                aria-label={`Lançar desligamento de ${
                                  termino.nome || "colaborador"
                                }`}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-300/25 bg-blue-300/10 text-sm font-bold text-blue-100 transition hover:bg-blue-300/20"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                            {texto(termino.pref)}
                          </td>

                          <td className={`whitespace-nowrap px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                            {texto(termino.matricula)}
                          </td>

                          <td className={`w-[220px] max-w-[220px] whitespace-normal break-words px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                            {texto(termino.nome)}
                          </td>

                          <td className={`w-[170px] max-w-[170px] whitespace-normal break-words px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                            {texto(termino.cargo)}
                          </td>

                          <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                            {texto(termino.carga_horaria)}
                          </td>

                          <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                            {formatarData(termino.exercicio)}
                          </td>

                          <td className={temaDia ? "whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-red-700" : "whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-red-100"}>
                            {formatarData(termino.data_termino)}
                          </td>

                          <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                            {formatarDiasRestantes(termino.dias_restantes)}
                          </td>

                          <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                            {baseOrigemLabel(termino.base_origem)}
                          </td>

                          <td className={`whitespace-nowrap px-3 py-4 text-center align-middle font-semibold ${textoSecundarioTabela}`}>
                            {termino.ano_contrato && termino.anos_maximos
                              ? `${termino.ano_contrato}/${termino.anos_maximos}`
                              : "-"}
                          </td>
                        </tr>
                      ))}

                      {terminosFiltrados.length === 0 && (
                        <tr>
                          <td
                            colSpan={11}
                            className={temaDia ? "px-4 py-10 text-center text-slate-500" : "px-4 py-10 text-center text-slate-400"}
                          >
                            Nenhum término encontrado com os filtros
                            selecionados.
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className={temaDia ? "text-xs text-slate-500" : "text-xs text-slate-400"}>
                Página {paginaTerminos} de {totalPaginasTerminos}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPaginaTerminos((paginaAtual) =>
                      Math.max(1, paginaAtual - 1)
                    )
                  }
                  disabled={paginaTerminos === 1 || loadingTerminos}
                  className={temaDia ? "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" : "rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"}
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaginaTerminos((paginaAtual) =>
                      Math.min(totalPaginasTerminos, paginaAtual + 1)
                    )
                  }
                  disabled={paginaTerminos === totalPaginasTerminos || loadingTerminos}
                  className={temaDia ? "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" : "rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"}
                >
                  Próxima
                </button>
              </div>
            </div>

            <div className={temaDia ? "mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5" : "mt-6 flex justify-end gap-3 border-t border-white/10 pt-5"}>
              <button
                type="button"
                onClick={fecharModalTerminos}
                disabled={loadingTerminos}
                className={temaDia ? "rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAberto && (
        <div
          className="voxx-desligamento-modal fixed inset-0 z-[90] flex items-center justify-center bg-[var(--voxx-overlay)] px-4 backdrop-blur-sm"
          onMouseDown={fecharModal}
        >
          <form
            onSubmit={salvarDesligamento}
            onMouseDown={(e) => e.stopPropagation()}
            className="voxx-surface-raised max-h-[92vh] w-full max-w-6xl overflow-y-auto overflow-x-hidden rounded-[28px] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {erro && (
                  <div className={temaDia ? "mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700" : "mt-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-center text-sm font-medium text-red-100"}>
                    {erro}
                  </div>
                )}

                <h3 className={temaDia ? "text-2xl font-bold text-slate-950" : "text-2xl font-bold text-slate-100"}>
                  {desligamentoEditando
                    ? "Editar desligamento"
                    : "Novo desligamento"}
                </h3>

                <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
                  {desligamentoEditando
                    ? "Atualize os dados do desligamento selecionado."
                    : "Informe a matrícula, busque o colaborador e preencha os dados do desligamento."}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className={temaDia ? "rounded-full px-3 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" : "rounded-full px-3 py-1 text-slate-400 hover:bg-white/[0.04] hover:text-slate-300"}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
              <InputTexto
                label="Matrícula"
                value={formulario.matricula}
                onChange={(valor) => atualizarCampo("matricula", valor)}
                placeholder="Ex: 40524579"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                className="xl:col-span-2"
              />

              <div className="flex items-end xl:col-span-2">
                <button
                  type="button"
                  onClick={buscarColaboradorPorMatricula}
                  disabled={buscandoColaborador || salvando}
                  className="voxx-button-primary h-11 w-full rounded-2xl px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buscandoColaborador ? "Buscando..." : "Buscar matrícula"}
                </button>
              </div>

              <InputTexto
                label="Pref."
                value={formulario.pref}
                disabled
                className="xl:col-span-1"
              />

              <InputTexto
                label="Nome"
                value={formulario.nome}
                disabled
                className="xl:col-span-4"
              />

              <InputTexto
                label="Base origem"
                value={baseOrigemLabel(formulario.base_origem)}
                disabled
                className="xl:col-span-3"
              />

              <InputTexto
                label="Cargo"
                value={formulario.cargo}
                disabled
                className="xl:col-span-4"
              />

              <InputTexto
                label="Carga horária"
                value={formulario.carga_horaria}
                disabled
                className="xl:col-span-2"
              />

              <InputTexto
                label="CPF"
                value={formulario.cpf}
                disabled
                className="xl:col-span-2"
              />

              <InputTexto
                label="Exercício"
                value={formulario.exercicio}
                type="date"
                disabled
                className="xl:col-span-2"
              />

              <InputTexto
                label="PIS"
                value={formulario.pis}
                disabled
                className="xl:col-span-2"
              />

              <InputTexto
                label="Data de nascimento"
                value={formulario.data_nascimento}
                type="date"
                disabled
                className="xl:col-span-2"
              />

              <InputTexto
                label="E-mail"
                value={formulario.email}
                disabled
                className="xl:col-span-4"
              />

              <SelectCampo
                label="Tipo de desligamento"
                value={formulario.tipo_desligamento}
                onChange={(valor) =>
                  atualizarCampo("tipo_desligamento", valor)
                }
                required
                className="xl:col-span-3"
                options={TIPOS_DESLIGAMENTO.map((tipo) => ({
                  value: tipo,
                  label: tipo,
                }))}
              />

              <InputTexto
                label="Data do desligamento"
                value={formulario.data_desligamento}
                onChange={(valor) =>
                  atualizarCampo("data_desligamento", valor)
                }
                type="date"
                required
                className="xl:col-span-2"
              />

              <InputTexto
                label="Data do ASO"
                value={formulario.data_aso}
                onChange={(valor) => atualizarCampo("data_aso", valor)}
                type="date"
                className="xl:col-span-2"
              />

              <InputTexto
                label="Data da homologação"
                value={formulario.data_homologacao}
                onChange={(valor) =>
                  atualizarCampo("data_homologacao", valor)
                }
                type="date"
                className="xl:col-span-2"
              />
            </div>

            <label className="mt-5 block">
              <span className={temaDia ? "text-sm font-semibold text-slate-700" : "text-sm font-semibold text-slate-300"}>
                Observação
              </span>

              <textarea
                value={formulario.observacao}
                onChange={(e) => atualizarCampo("observacao", e.target.value)}
                rows={4}
                className={temaDia ? "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" : "mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20"}
              />
            </label>

            <div className={temaDia ? "mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5" : "mt-6 flex justify-end gap-3 border-t border-white/10 pt-5"}>
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando || buscandoColaborador}
                className={temaDia ? "rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" : "rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando || buscandoColaborador}
                className="voxx-button-primary rounded-xl px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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



