"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StatusTransferencia = "em_andamento" | "concluida" | "negada";
type TipoMovimento = "entrada" | "saida";
type ModoTransferencia = TipoMovimento | "";

type TransferenciaControle = {
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
  tipo_movimento: TipoMovimento | string | null;
  cedente: string | null;
  cessionario: string | null;
  inicio_nova_unidade: string | null;
  observacao: string | null;
  status: StatusTransferencia | string | null;
  criado_em: string | null;
  criado_por_email: string | null;
  atualizado_em: string | null;
  atualizado_por_email: string | null;
};

type FormularioTransferencia = {
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
  tipo_movimento: ModoTransferencia;
  cedente: string;
  cessionario: string;
  inicio_nova_unidade: string;
  observacao: string;
  status: StatusTransferencia;
};

type ConfirmacaoStatus = {
  transferencia: TransferenciaControle;
  novoStatus: StatusTransferencia;
} | null;

const HMRG = "HMRG";

const FORM_INICIAL: FormularioTransferencia = {
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
  tipo_movimento: "",
  cedente: "",
  cessionario: "",
  inicio_nova_unidade: "",
  observacao: "",
  status: "em_andamento",
};

const CAMPOS_MAIUSCULOS: (keyof FormularioTransferencia)[] = [
  "nome",
  "cargo",
  "cedente",
  "cessionario",
  "observacao",
];

const STATUS_OPCOES = [
  { value: "", label: "Todos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "negada", label: "Negada" },
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

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(textoData)) return textoData;

  if (/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) {
    const [ano, mes, dia] = apenasData.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return textoData;
}

function statusLabel(status: string | null | undefined) {
  if (status === "concluida") return "Concluída";
  if (status === "negada") return "Negada";
  return "Em andamento";
}

function statusClass(status: string | null | undefined) {
  if (status === "concluida") {
    return "border border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "negada") {
    return "border border-red-300/25 bg-red-400/10 text-red-100";
  }

  return "border border-yellow-300/25 bg-yellow-300/10 text-yellow-100";
}

function tipoMovimentoLabel(tipo: string | null | undefined) {
  if (tipo === "entrada") return "Entrada";
  if (tipo === "saida") return "Saída";
  return "-";
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

  return `transferencias-voxx-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
}

function validarMatricula(matricula: string) {
  const valor = matricula.trim();

  if (!valor) return "A matrícula é obrigatória.";
  if (!/^\d+$/.test(valor)) return "Matrícula deve conter somente números.";
  if (valor.length !== 8) return "Matrícula deve ter 8 dígitos.";
  if (!valor.startsWith("40")) return "Matrícula deve começar com 40.";

  return "";
}

function cargaHorariaParaInput(valor: string | null | undefined) {
  if (!valor) return "";

  const numeros = String(valor).replace(/\D/g, "");

  return numeros.slice(0, 2);
}

function formatarCargaHoraria(valor: string) {
  const numeros = cargaHorariaParaInput(valor);

  return numeros ? `${numeros} HORAS` : "";
}

function formatarCargaHorariaTabela(valor: string | null | undefined) {
  if (!valor) return "-";

  const textoCarga = String(valor).trim();

  if (/^\d{1,2}$/.test(textoCarga)) {
    return `${textoCarga} HORAS`;
  }

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
      <span className="text-sm font-semibold text-slate-300">
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
        className={`mt-1 h-11 w-full rounded-2xl border px-3 text-sm outline-none transition [color-scheme:dark] focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-white/[0.035] text-slate-500"
            : "border-white/10 bg-white/[0.06] text-slate-100 placeholder:text-slate-500"
        }`}
      />
    </label>
  );
}

export default function ControleTransferenciasTabela() {
  const [transferencias, setTransferencias] = useState<TransferenciaControle[]>(
    []
  );
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoColaborador, setBuscandoColaborador] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [transferenciaEditando, setTransferenciaEditando] =
    useState<TransferenciaControle | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioTransferencia>(FORM_INICIAL);
  const [confirmacaoStatus, setConfirmacaoStatus] =
    useState<ConfirmacaoStatus>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const resumoStatus = useMemo(
    () => ({
      total: transferencias.length,
      emAndamento: transferencias.filter(
        (transferencia) => transferencia.status === "em_andamento"
      ).length,
      concluidas: transferencias.filter(
        (transferencia) => transferencia.status === "concluida"
      ).length,
      negadas: transferencias.filter(
        (transferencia) => transferencia.status === "negada"
      ).length,
    }),
    [transferencias]
  );

  async function buscarTransferencias(
    valorBusca = busca,
    valorStatus = statusFiltro
  ) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();

    if (valorBusca.trim()) params.set("busca", valorBusca.trim());
    if (valorStatus) params.set("status", valorStatus);

    const url = params.toString()
      ? `/api/transferencia/controle?${params.toString()}`
      : "/api/transferencia/controle";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar transferências.");
      setTransferencias([]);
      setLoading(false);
      return;
    }

    setTransferencias(resultado.transferencias ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarTransferencias("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function atualizarCampo(
    campo: keyof FormularioTransferencia,
    valor: string
  ) {
    let valorTratado = valor;

    if (CAMPOS_MAIUSCULOS.includes(campo)) {
      valorTratado = normalizarTextoMaiusculo(valor);
    }

    if (campo === "email") {
      valorTratado = valor.toLowerCase();
    }

    if (campo === "carga_horaria") {
      valorTratado = cargaHorariaParaInput(valor);
    }

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [campo]: valorTratado,
    }));
  }

  function abrirModalNovaTransferencia() {
    setTransferenciaEditando(null);
    setFormulario(FORM_INICIAL);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirModalEditar(transferencia: TransferenciaControle) {
    setTransferenciaEditando(transferencia);
    setErro("");
    setSucesso("");
    setFormulario({
      id: transferencia.id,
      pref: transferencia.pref || "",
      matricula: transferencia.matricula || "",
      nome: transferencia.nome || "",
      cargo: transferencia.cargo || "",
      carga_horaria: cargaHorariaParaInput(transferencia.carga_horaria),
      exercicio: dataParaInput(transferencia.exercicio),
      cpf: transferencia.cpf || "",
      pis: transferencia.pis || "",
      data_nascimento: dataParaInput(transferencia.data_nascimento),
      email: transferencia.email || "",
      tipo_movimento:
        transferencia.tipo_movimento === "entrada" ||
        transferencia.tipo_movimento === "saida"
          ? transferencia.tipo_movimento
          : "",
      cedente: transferencia.cedente || "",
      cessionario: transferencia.cessionario || "",
      inicio_nova_unidade: dataParaInput(transferencia.inicio_nova_unidade),
      observacao: transferencia.observacao || "",
      status:
        transferencia.status === "concluida" ||
        transferencia.status === "negada"
          ? transferencia.status
          : "em_andamento",
    });
    setModalAberto(true);
  }

  function escolherTipoMovimento(tipo: TipoMovimento) {
    setErro("");
    setFormulario((formularioAtual) => ({
      ...FORM_INICIAL,
      tipo_movimento: tipo,
      cedente: tipo === "saida" ? HMRG : "",
      cessionario: tipo === "entrada" ? HMRG : "",
      status: "em_andamento",
      matricula: formularioAtual.matricula,
    }));
  }

  function fecharModal() {
    if (salvando || buscandoColaborador) return;

    setModalAberto(false);
    setTransferenciaEditando(null);
    setFormulario(FORM_INICIAL);
  }

  function voltarOuFecharModal() {
    if (salvando || buscandoColaborador) return;

    if (modalAberto && !transferenciaEditando && formulario.tipo_movimento) {
      setErro("");
      setFormulario(FORM_INICIAL);
      return;
    }

    fecharModal();
  }

  useEffect(() => {
    if (!modalAberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        voltarOuFecharModal();
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      window.removeEventListener("keydown", aoPressionarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modalAberto,
    transferenciaEditando,
    formulario.tipo_movimento,
    salvando,
    buscandoColaborador,
  ]);

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
      `/api/transferencia/buscar-colaborador?matricula=${encodeURIComponent(
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
      carga_horaria: cargaHorariaParaInput(colaborador.carga_horaria),
      exercicio: dataParaInput(colaborador.exercicio),
      cpf: colaborador.cpf || "",
      pis: colaborador.pis || "",
      data_nascimento: dataParaInput(colaborador.data_nascimento),
      email: colaborador.email || "",
    }));

    setBuscandoColaborador(false);
  }

  function validarAntesDeSalvar() {
    const erroMatricula = validarMatricula(formulario.matricula);

    if (erroMatricula) return erroMatricula;
    if (!formulario.nome.trim()) return "O nome é obrigatório.";
    if (!formulario.cargo.trim()) return "O cargo é obrigatório.";

    const erroCargaHoraria = validarCargaHoraria(formulario.carga_horaria);

    if (erroCargaHoraria) return erroCargaHoraria;

    if (!formulario.exercicio) return "A admissão é obrigatória.";
    if (!formulario.cedente.trim()) return "O cedente é obrigatório.";
    if (!formulario.cessionario.trim()) return "O cessionário é obrigatório.";
    if (!formulario.inicio_nova_unidade) {
      return "O início na nova unidade é obrigatório.";
    }
    if (!formulario.tipo_movimento) {
      return "Escolha se a transferência é entrada ou saída.";
    }

    return "";
  }

  async function salvarTransferencia(e: FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const erroValidacao = validarAntesDeSalvar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    const editando = Boolean(transferenciaEditando);
    const response = await fetch("/api/transferencia/controle", {
      method: editando ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formulario,
        carga_horaria: formatarCargaHoraria(formulario.carga_horaria),
        id: transferenciaEditando?.id,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao salvar transferência.");
      setSalvando(false);
      return;
    }

    setSucesso(
      editando
        ? "Transferência atualizada com sucesso."
        : "Transferência salva com sucesso."
    );
    setSalvando(false);
    fecharModal();
    buscarTransferencias(busca, statusFiltro);
  }

  function abrirConfirmacaoStatus(
    transferencia: TransferenciaControle,
    novoStatus: StatusTransferencia
  ) {
    setConfirmacaoStatus({ transferencia, novoStatus });
  }

  async function confirmarAlteracaoStatus() {
    if (!confirmacaoStatus) return;

    setErro("");
    setSucesso("");

    const { transferencia, novoStatus } = confirmacaoStatus;
    setConfirmacaoStatus(null);

    const response = await fetch("/api/transferencia/controle", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: transferencia.id,
        status: novoStatus,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao alterar status da transferência.");
      return;
    }

    setSucesso("Status da transferência atualizado com sucesso.");
    buscarTransferencias(busca, statusFiltro);
  }

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    buscarTransferencias(busca, statusFiltro);
  }

  function limparBusca() {
    setBusca("");
    setStatusFiltro("");
    buscarTransferencias("", "");
  }

  function baixarCsv() {
    const cabecalho = [
      "Status",
      "Tipo",
      "Pref.",
      "Matrícula",
      "Nome",
      "Cargo",
      "Carga horária",
      "Admissão",
      "CPF",
      "PIS",
      "Data de nascimento",
      "E-mail",
      "Cedente",
      "Cessionário",
      "Início na nova unidade",
      "Observação",
      "Criado em",
      "Criado por",
    ];

    const linhas = transferencias.map((transferencia) => [
      statusLabel(transferencia.status),
      tipoMovimentoLabel(transferencia.tipo_movimento),
      transferencia.pref,
      transferencia.matricula,
      transferencia.nome,
      transferencia.cargo,
      formatarCargaHorariaTabela(transferencia.carga_horaria),
      formatarData(transferencia.exercicio),
      transferencia.cpf,
      transferencia.pis,
      formatarData(transferencia.data_nascimento),
      transferencia.email,
      transferencia.cedente,
      transferencia.cessionario,
      formatarData(transferencia.inicio_nova_unidade),
      transferencia.observacao,
      formatarData(transferencia.criado_em),
      transferencia.criado_por_email,
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
    <section className="mt-6 min-w-0 overflow-hidden rounded-[26px] border border-white/10 bg-[#171a23] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={abrirModalNovaTransferencia}
              className="rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_35px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-200"
            >
              Nova transferência
            </button>
          </div>

          <form
            onSubmit={pesquisar}
            className="flex w-full flex-col gap-3 md:flex-row xl:w-auto"
          >
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por matrícula, nome, CPF, cargo ou unidade"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-center text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-300/10 xl:w-96"
            />

            <select
              value={statusFiltro}
              onChange={(e) => {
                const valor = e.target.value;
                setStatusFiltro(valor);
                buscarTransferencias(busca, valor);
              }}
              className="h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition [color-scheme:dark] focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [&>option]:bg-[#171a23] [&>option]:text-slate-100"
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

            <button
              type="button"
              onClick={baixarCsv}
              disabled={loading || transferencias.length === 0}
              title="Baixar Excel/CSV"
              aria-label="Baixar Excel/CSV"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-50"
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
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">
            {resumoStatus.total}{" "}
            {resumoStatus.total === 1 ? "transferência" : "transferências"}
          </span>

          <span className="rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100">
            {resumoStatus.emAndamento} em andamento
          </span>

          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            {resumoStatus.concluidas} concluídas
          </span>

          <span className="rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-100">
            {resumoStatus.negadas} negadas
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
          Carregando transferências...
        </div>
      ) : (
        <div className="voxx-scrollbar w-full max-w-full overflow-x-auto rounded-[22px] border border-white/10 bg-[#202532] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
          <table className="min-w-[1890px] table-fixed text-center text-xs [&_td]:border-r [&_td]:border-white/10 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0">
            <colgroup>
              <col className="w-[118px]" />
              <col className="w-[220px]" />
              <col className="w-[92px]" />
              <col className="w-[70px]" />
              <col className="w-[104px]" />
              <col className="w-[220px]" />
              <col className="w-[170px]" />
              <col className="w-[126px]" />
              <col className="w-[112px]" />
              <col className="w-[118px]" />
              <col className="w-[118px]" />
              <col className="w-[130px]" />
              <col className="w-[190px]" />
              <col className="w-[140px]" />
              <col className="w-[140px]" />
              <col className="w-[126px]" />
              <col className="w-[300px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-[#2a3040]">
              <tr className="border-b border-white/10 text-slate-300">
                <th className="px-3 py-4 text-center">Status</th>
                <th className="px-3 py-4 text-center">Ações</th>
                <th className="px-3 py-4 text-center">Tipo</th>
                <th className="px-3 py-4 text-center">Pref.</th>
                <th className="px-3 py-4 text-center">Matrícula</th>
                <th className="px-3 py-4 text-center">Nome</th>
                <th className="px-3 py-4 text-center">Cargo</th>
                <th className="px-3 py-4 text-center">Carga horária</th>
                <th className="px-3 py-4 text-center">Admissão</th>
                <th className="px-3 py-4 text-center">CPF</th>
                <th className="px-3 py-4 text-center">PIS</th>
                <th className="px-3 py-4 text-center">Data de nascimento</th>
                <th className="px-3 py-4 text-center">E-mail</th>
                <th className="px-3 py-4 text-center">Cedente</th>
                <th className="px-3 py-4 text-center">Cessionário</th>
                <th className="px-3 py-4 text-center">
                  Início na nova unidade
                </th>
                <th className="px-3 py-4 text-center">Observação</th>
              </tr>
            </thead>

            <tbody>
              {transferencias.map((transferencia) => (
                <tr
                  key={transferencia.id}
                  className="border-b border-white/10 align-middle text-slate-200 transition hover:bg-white/[0.055]"
                >
                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        transferencia.status
                      )}`}
                    >
                      {statusLabel(transferencia.status)}
                    </span>
                  </td>

                  <td className="min-w-[230px] whitespace-nowrap px-3 py-4 text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(transferencia)}
                        className="rounded-xl border border-blue-300/25 bg-blue-300/10 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-300/20"
                      >
                        Editar
                      </button>

                      {transferencia.status === "em_andamento" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              abrirConfirmacaoStatus(transferencia, "concluida")
                            }
                            className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
                          >
                            Concluir
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirConfirmacaoStatus(transferencia, "negada")
                            }
                            className="rounded-xl border border-red-300/25 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-400/20"
                          >
                            Negar
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-slate-300">
                    {tipoMovimentoLabel(transferencia.tipo_movimento)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.pref)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-slate-100">
                    {texto(transferencia.matricula)}
                  </td>

                  <td className="min-w-[220px] px-3 py-4 text-center align-middle font-semibold text-slate-100">
                    {texto(transferencia.nome)}
                  </td>

                  <td className="min-w-[180px] px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.cargo)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-slate-300">
                    {formatarCargaHorariaTabela(transferencia.carga_horaria)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-slate-300">
                    {formatarData(transferencia.exercicio)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.cpf)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.pis)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-slate-300">
                    {formatarData(transferencia.data_nascimento)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.email)}
                  </td>

                  <td className="min-w-[160px] px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.cedente)}
                  </td>

                  <td className="min-w-[160px] px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.cessionario)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center align-middle font-semibold text-blue-100">
                    {formatarData(transferencia.inicio_nova_unidade)}
                  </td>

                  <td className="min-w-[260px] px-3 py-4 text-center align-middle text-slate-300">
                    {texto(transferencia.observacao)}
                  </td>
                </tr>
              ))}

              {transferencias.length === 0 && (
                <tr>
                  <td
                    colSpan={17}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Nenhuma transferência encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirmacaoStatus && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={() => setConfirmacaoStatus(null)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#171a23] p-6 text-center text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.48)]"
          >
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                confirmacaoStatus.novoStatus === "concluida"
                  ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                  : "border border-red-300/25 bg-red-400/10 text-red-100"
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

            <h3 className="mt-4 text-lg font-bold text-slate-100">
              {confirmacaoStatus.novoStatus === "concluida"
                ? "Concluir transferência?"
                : "Negar transferência?"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {texto(confirmacaoStatus.transferencia.nome)} - matrícula{" "}
              {texto(confirmacaoStatus.transferencia.matricula)}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmacaoStatus(null)}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarAlteracaoStatus}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition ${
                  confirmacaoStatus.novoStatus === "concluida"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {confirmacaoStatus.novoStatus === "concluida"
                  ? "Concluir"
                  : "Negar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAberto && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={fecharModal}
        >
          <form
            onSubmit={salvarTransferencia}
            onMouseDown={(e) => e.stopPropagation()}
            className="voxx-scrollbar max-h-[92vh] w-full max-w-7xl overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.48)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-100">
                  {transferenciaEditando
                    ? "Editar transferência"
                    : "Nova transferência"}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Informe o movimento, colaborador e unidade de destino.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="rounded-full px-3 py-1 text-slate-400 hover:bg-white/[0.04] hover:text-slate-300"
              >
                ×
              </button>
            </div>

            {erro && (
              <div className="mt-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-center text-sm font-medium text-red-100">
                {erro}
              </div>
            )}

            {!formulario.tipo_movimento && !transferenciaEditando ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => escolherTipoMovimento("entrada")}
                  className="rounded-[24px] border border-blue-300/25 bg-blue-300/10 px-6 py-8 text-left transition hover:-translate-y-0.5 hover:bg-blue-300/15"
                >
                  <span className="block text-lg font-bold text-blue-100">
                    Está vindo para o HMRG
                  </span>
                  <span className="mt-1 block text-sm text-blue-200/80">
                    Entrada por transferência
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => escolherTipoMovimento("saida")}
                  className="rounded-[24px] border border-white/10 bg-white/[0.06] px-6 py-8 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  <span className="block text-lg font-bold text-slate-100">
                    Está saindo do HMRG
                  </span>
                  <span className="mt-1 block text-sm text-slate-300">
                    Saída por transferência
                  </span>
                </button>
              </div>
            ) : (
              <>
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
                    disabled={Boolean(transferenciaEditando)}
                    className="xl:col-span-2"
                  />

                  {formulario.tipo_movimento === "saida" &&
                    !transferenciaEditando && (
                      <div className="flex items-end xl:col-span-2">
                        <button
                          type="button"
                          onClick={buscarColaboradorPorMatricula}
                          disabled={buscandoColaborador || salvando}
                          className="h-11 w-full rounded-2xl bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {buscandoColaborador
                            ? "Buscando..."
                            : "Buscar matrícula"}
                        </button>
                      </div>
                    )}

                  <InputTexto
                    label="Pref."
                    value={formulario.pref}
                    onChange={(valor) => atualizarCampo("pref", valor)}
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-1"
                  />

                  <InputTexto
                    label="Nome"
                    value={formulario.nome}
                    onChange={(valor) => atualizarCampo("nome", valor)}
                    required
                    disabled={formulario.tipo_movimento === "saida"}
                    className={
                      formulario.tipo_movimento === "saida"
                        ? "xl:col-span-5"
                        : "xl:col-span-7"
                    }
                  />

                  <InputTexto
                    label="Tipo"
                    value={tipoMovimentoLabel(formulario.tipo_movimento)}
                    disabled
                    className="xl:col-span-2"
                  />

                  <InputTexto
                    label="Cargo"
                    value={formulario.cargo}
                    onChange={(valor) => atualizarCampo("cargo", valor)}
                    required
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-4"
                  />

                  <InputTexto
                    label="Carga horária"
                    value={formulario.carga_horaria}
                    onChange={(valor) =>
                      atualizarCampo("carga_horaria", valor)
                    }
                    placeholder="10 a 40"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    required
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-2"
                  />

                  <InputTexto
                    label="Admissão"
                    value={formulario.exercicio}
                    onChange={(valor) => atualizarCampo("exercicio", valor)}
                    type="date"
                    required
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-2"
                  />

                  <InputTexto
                    label="CPF"
                    value={formulario.cpf}
                    onChange={(valor) => atualizarCampo("cpf", valor)}
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-2"
                  />

                  <InputTexto
                    label="PIS"
                    value={formulario.pis}
                    onChange={(valor) => atualizarCampo("pis", valor)}
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-2"
                  />

                  <InputTexto
                    label="Data de nascimento"
                    value={formulario.data_nascimento}
                    onChange={(valor) =>
                      atualizarCampo("data_nascimento", valor)
                    }
                    type="date"
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-2"
                  />

                  <InputTexto
                    label="E-mail"
                    value={formulario.email}
                    onChange={(valor) => atualizarCampo("email", valor)}
                    type="email"
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-4"
                  />

                  <InputTexto
                    label="Cedente"
                    value={formulario.cedente}
                    onChange={(valor) => atualizarCampo("cedente", valor)}
                    required
                    disabled={formulario.tipo_movimento === "saida"}
                    className="xl:col-span-3"
                  />

                  <InputTexto
                    label="Cessionário"
                    value={formulario.cessionario}
                    onChange={(valor) => atualizarCampo("cessionario", valor)}
                    required
                    disabled={formulario.tipo_movimento === "entrada"}
                    className="xl:col-span-3"
                  />

                  <InputTexto
                    label="Início na nova unidade"
                    value={formulario.inicio_nova_unidade}
                    onChange={(valor) =>
                      atualizarCampo("inicio_nova_unidade", valor)
                    }
                    type="date"
                    required
                    className="xl:col-span-2"
                  />

                  <label className="block xl:col-span-2">
                    <span className="text-sm font-semibold text-slate-300">
                      Status
                    </span>

                    <select
                      value={formulario.status}
                      onChange={(e) =>
                        atualizarCampo(
                          "status",
                          e.target.value as StatusTransferencia
                        )
                      }
                      className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition [color-scheme:dark] focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [&>option]:bg-[#171a23] [&>option]:text-slate-100"
                    >
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                      <option value="negada">Negada</option>
                    </select>
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-300">
                    Observação
                  </span>

                  <textarea
                    value={formulario.observacao}
                    onChange={(e) =>
                      atualizarCampo("observacao", e.target.value)
                    }
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-blue-300/10"
                  />
                </label>

                <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={fecharModal}
                    disabled={salvando || buscandoColaborador}
                    className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando || buscandoColaborador}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvando
                      ? "Salvando..."
                      : transferenciaEditando
                      ? "Salvar alterações"
                      : "Salvar transferência"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </section>
  );
}

