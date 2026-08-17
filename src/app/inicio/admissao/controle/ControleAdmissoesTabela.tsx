"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type AdmissaoControle = {
  id: number;
  pref: string | null;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  ch_edital: string | null;
  alteracao_ch: string | null;
  ch_final: string | null;
  sirg: boolean | null;
  horario: string | null;
  exercicio: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  pis: string | null;
  edital: string | null;
  email: string | null;
  carta_banco: boolean | null;
  acesso_ponto: boolean | null;
  registro_ponto: string | null;
  base_destino: string | null;
  enviar_email_colaborador: boolean | null;
  email_colaborador_enviado: boolean | null;
  email_colaborador_enviado_em: string | null;
  observacao: string | null;
  status_sede: string | null;
  enviado_sede_em: string | null;
  enviado_sede_por_email: string | null;
  status_script: string | null;
  subido_base_em: string | null;
  subido_base_por_email: string | null;
  criado_em: string | null;
  criado_por_email: string | null;
  atualizado_em: string | null;
  atualizado_por_email: string | null;
};

type FormularioAdmissao = {
  pref: string;
  matricula: string;
  nome: string;
  cargo: string;
  ch_edital: string;
  alteracao_ch: string;
  sirg: boolean;
  horario: string;
  exercicio: string;
  data_nascimento: string;
  cpf: string;
  pis: string;
  edital: string;
  email: string;
  carta_banco: boolean;
  acesso_ponto: boolean;
  registro_ponto: string;
  base_destino: string;
  enviar_email_colaborador: boolean;
  observacao: string;
};

const FORM_INICIAL: FormularioAdmissao = {
  pref: "",
  matricula: "",
  nome: "",
  cargo: "",
  ch_edital: "",
  alteracao_ch: "",
  sirg: false,
  horario: "",
  exercicio: "",
  data_nascimento: "",
  cpf: "",
  pis: "",
  edital: "",
  email: "",
  carta_banco: false,
  acesso_ponto: false,
  registro_ponto: "",
  base_destino: "colaboradores",
  enviar_email_colaborador: false,
  observacao: "",
};

const HORARIOS_ADMISSAO = [
  "07:00 às 16:00",
  "08:00 às 17:00",
  "07:00 às 17:00",
  "08:00 às 18:00",
  "07:00 às 19:00",
  "19:00 às 07:00",
  "07:00 às 07:00",
  "19:00 às 19:00",
  "ROTINA LIVRE",
];

function texto(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "-";

  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }

  return String(valor);
}

function textoHoras(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "-";

  return `${valor} HORAS`;
}

function formatarData(valor: string | null | undefined) {
  if (!valor) return "-";

  const apenasData = valor.split("T")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(apenasData)) {
    const [ano, mes, dia] = apenasData.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return valor;
}

function baseDestinoLabel(valor: string | null | undefined) {
  if (valor === "gestao_rh") return "Gestão e RH";
  return "Colaboradores";
}

function calcularChFinal(chEdital: string, alteracaoCh: string) {
  const editalTexto = chEdital.trim();
  const alteracaoTexto = alteracaoCh.trim();

  if (!editalTexto && !alteracaoTexto) return "";

  const edital = editalTexto ? Number(editalTexto) : 0;
  const alteracao = alteracaoTexto ? Number(alteracaoTexto) : 0;

  if (Number.isNaN(edital) || Number.isNaN(alteracao)) return "";

  return String(edital + alteracao);
}

function registroBadge(registro: string | null | undefined) {
  if (!registro) return null;

  const valor = registro.toLowerCase();

  if (valor.includes("facial")) {

  return (
      <span className="ml-1 rounded-md border border-blue-300/25 bg-blue-300/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-100">
        F
      </span>
    );
  }

  if (valor.includes("digital")) {
    return (
      <span className="ml-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
        D
      </span>
    );
  }

  return null;
}

function statusClass(status: string | null | undefined, temaDia = false) {
  const valor = String(status || "").toLowerCase();

  if (valor === "enviado" || valor === "subido") {
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

function validarCamposNumericos(formulario: FormularioAdmissao) {
  const matricula = formulario.matricula.trim();

  if (matricula && !/^40\d{6}$/.test(matricula)) {
    return "Matrícula deve ter 8 dígitos e começar com 40. Ex: 40524579.";
  }

  const campos = [
    {
      label: "CH do edital",
      valor: formulario.ch_edital,
      exemplo: "40",
    },
    {
      label: "Alteração de CH",
      valor: formulario.alteracao_ch,
      exemplo: "10",
    },
  ];

  for (const campo of campos) {
    const valor = campo.valor.trim();

    if (valor && !/^\d+$/.test(valor)) {
      return `${campo.label} deve conter apenas números. Ex: ${campo.exemplo}.`;
    }
  }

  return "";
}

function validarMaioridade(dataNascimento: string) {
  if (!dataNascimento) return "";

  const nascimento = new Date(`${dataNascimento}T00:00:00`);

  if (Number.isNaN(nascimento.getTime())) {
    return "Data de nascimento inválida.";
  }

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade -= 1;
  }

  if (idade < 18) {
    return "O colaborador precisa ter pelo menos 18 anos.";
  }

  return "";
}

const CAMPOS_MAIUSCULOS: (keyof FormularioAdmissao)[] = [
  "nome",
  "cargo",
  "edital",
  "observacao",
];

function normalizarTextoMaiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

function normalizarFormulario(formulario: FormularioAdmissao) {
  return {
    ...formulario,
    nome: normalizarTextoMaiusculo(formulario.nome.trim()),
    cargo: normalizarTextoMaiusculo(formulario.cargo.trim()),
    edital: normalizarTextoMaiusculo(formulario.edital.trim()),
    observacao: normalizarTextoMaiusculo(formulario.observacao.trim()),
    email: formulario.email.trim().toLowerCase(),
    pref: formulario.pref.trim(),
    matricula: formulario.matricula.trim(),
    ch_edital: formulario.ch_edital.trim(),
    alteracao_ch: formulario.alteracao_ch.trim(),
    cpf: formulario.cpf.trim(),
    pis: formulario.pis.trim(),
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

  return `admissoes-${ano}-${mes}-${dia}-${hora}${minuto}.csv`;
}

type InputTextoProps = {
  label: string;
  value: string;
  onChange: (valor: string) => void;
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
  onChange,
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
};

function SelectCampo({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  className = "",
}: SelectCampoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="voxx-text-primary text-sm font-semibold">{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

type CheckboxCampoProps = {
  label: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
  description?: string;
};

function CheckboxCampo({
  label,
  checked,
  onChange,
  description,
}: CheckboxCampoProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] p-3 transition hover:border-[var(--voxx-border-strong)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />

      <span>
        <span className="voxx-text-primary block text-sm font-semibold">
          {label}
        </span>

        {description && (
          <span className="voxx-text-muted mt-0.5 block text-xs">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export default function ControleAdmissoesTabela() {
  const { temaDia } = useTema();
  const [admissoes, setAdmissoes] = useState<AdmissaoControle[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [admissaoEditando, setAdmissaoEditando] =
    useState<AdmissaoControle | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioAdmissao>(FORM_INICIAL);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvandoRapidoId, setSalvandoRapidoId] = useState<number | null>(null);

  const chFinalCalculada = calcularChFinal(
    formulario.ch_edital,
    formulario.alteracao_ch
  );

  const pendentesSede = useMemo(() => {
    return admissoes.filter((admissao) => admissao.status_sede === "pendente");
  }, [admissoes]);

  const pendentesBase = useMemo(() => {
    return admissoes.filter(
      (admissao) => admissao.status_script === "pendente"
    );
  }, [admissoes]);

  async function buscarAdmissoes(valorBusca = busca) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();

    if (valorBusca.trim()) {
      params.set("busca", valorBusca.trim());
    }

    const url = params.toString()
      ? `/api/admissao/controle?${params.toString()}`
      : "/api/admissao/controle";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar admissões.");
      setAdmissoes([]);
      setLoading(false);
      return;
    }

    setAdmissoes(resultado.admissoes ?? []);
    setLoading(false);
  }

  useEffect(() => {
    buscarAdmissoes("");
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
    campo: keyof FormularioAdmissao,
    valor: string | boolean
  ) {
    let valorTratado = valor;

    if (typeof valor === "string" && CAMPOS_MAIUSCULOS.includes(campo)) {
      valorTratado = normalizarTextoMaiusculo(valor);
    }

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [campo]: valorTratado,
    }));
  }

  function abrirModalNovaAdmissao() {
    setFormulario(FORM_INICIAL);
    setAdmissaoEditando(null);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirModalEditar(admissao: AdmissaoControle) {
    setAdmissaoEditando(admissao);
    setErro("");
    setSucesso("");

    setFormulario({
      pref: admissao.pref || "",
      matricula: admissao.matricula || "",
      nome: admissao.nome || "",
      cargo: admissao.cargo || "",
      ch_edital: admissao.ch_edital || "",
      alteracao_ch: admissao.alteracao_ch || "",
      sirg: admissao.sirg === true,
      horario: admissao.horario || "",
      exercicio: admissao.exercicio || "",
      data_nascimento: admissao.data_nascimento || "",
      cpf: admissao.cpf || "",
      pis: admissao.pis || "",
      edital: admissao.edital || "",
      email: admissao.email || "",
      carta_banco: admissao.carta_banco === true,
      acesso_ponto: admissao.acesso_ponto === true,
      registro_ponto: admissao.registro_ponto || "",
      base_destino: admissao.base_destino || "colaboradores",
      enviar_email_colaborador: admissao.enviar_email_colaborador === true,
      observacao: admissao.observacao || "",
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setAdmissaoEditando(null);
    setFormulario(FORM_INICIAL);
  }

  async function salvarAdmissao(e: FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const erroValidacao = validarCamposNumericos(formulario);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const erroMaioridade = validarMaioridade(formulario.data_nascimento);

    if (erroMaioridade) {
      setErro(erroMaioridade);
      return;
    }

    setSalvando(true);

    const editando = Boolean(admissaoEditando);
    const formularioNormalizado = normalizarFormulario(formulario);

    const response = await fetch("/api/admissao/controle", {
      method: editando ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formularioNormalizado,
        id: admissaoEditando?.id,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao salvar admissão.");
      setSalvando(false);
      return;
    }

    setSucesso(
      editando
        ? "Admissão atualizada com sucesso."
        : "Admissão salva com sucesso."
    );
    setSalvando(false);
    fecharModal();
    buscarAdmissoes(busca);
  }

  function montarFormularioDaAdmissao(admissao: AdmissaoControle): FormularioAdmissao {
    return {
      pref: admissao.pref || "",
      matricula: admissao.matricula || "",
      nome: admissao.nome || "",
      cargo: admissao.cargo || "",
      ch_edital: admissao.ch_edital || "",
      alteracao_ch: admissao.alteracao_ch || "",
      sirg: admissao.sirg === true,
      horario: admissao.horario || "",
      exercicio: admissao.exercicio || "",
      data_nascimento: admissao.data_nascimento || "",
      cpf: admissao.cpf || "",
      pis: admissao.pis || "",
      edital: admissao.edital || "",
      email: admissao.email || "",
      carta_banco: admissao.carta_banco === true,
      acesso_ponto: admissao.acesso_ponto === true,
      registro_ponto: admissao.registro_ponto || "",
      base_destino: admissao.base_destino || "colaboradores",
      enviar_email_colaborador: admissao.enviar_email_colaborador === true,
      observacao: admissao.observacao || "",
    };
  }

  async function atualizarCheckboxTabela(
    admissao: AdmissaoControle,
    campo: "carta_banco" | "acesso_ponto",
    valor: boolean
  ) {
    setErro("");
    setSucesso("");
    setSalvandoRapidoId(admissao.id);

    const formularioAtualizado = montarFormularioDaAdmissao(admissao);
    formularioAtualizado[campo] = valor;

    setAdmissoes((admissoesAtuais) =>
      admissoesAtuais.map((item) =>
        item.id === admissao.id ? { ...item, [campo]: valor } : item
      )
    );

    const response = await fetch("/api/admissao/controle", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...normalizarFormulario(formularioAtualizado),
        id: admissao.id,
      }),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao atualizar admissão.");
      buscarAdmissoes(busca);
    }

    setSalvandoRapidoId(null);
  }

  function baixarExcel() {
    const cabecalho = [
      "Pref.",
      "Matrícula",
      "Nome",
      "Cargo",
      "CH Edital",
      "Alteração CH",
      "CH Final",
      "SIRG",
      "Horário",
      "Exercício",
      "Nascimento",
      "CPF",
      "PIS",
      "Edital",
      "E-mail",
      "Carta Banco",
      "Acesso Ponto",
      "Registro",
      "Base destino",
      "Status SEDE",
      "Status Base",
      "Observação",
    ];

    const linhas = admissoes.map((admissao) => [
      admissao.pref,
      admissao.matricula,
      admissao.nome,
      admissao.cargo,
      admissao.ch_edital,
      admissao.alteracao_ch,
      admissao.ch_final,
      admissao.sirg,
      admissao.horario,
      formatarData(admissao.exercicio),
      formatarData(admissao.data_nascimento),
      admissao.cpf,
      admissao.pis,
      admissao.edital,
      admissao.email,
      admissao.carta_banco,
      admissao.acesso_ponto,
      admissao.registro_ponto,
      baseDestinoLabel(admissao.base_destino),
      admissao.status_sede,
      admissao.status_script,
      admissao.observacao,
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
    buscarAdmissoes(busca);
  }

  function limparBusca() {
    setBusca("");
    buscarAdmissoes("");
  }

  const campoBuscaClass = "voxx-field h-11 w-full rounded-2xl px-4 text-center text-sm xl:w-96";

  const textoSecundarioTabela = temaDia ? "text-slate-600" : "text-slate-300";
  const textoDestaqueTabela = temaDia ? "text-slate-950" : "text-slate-100";
  return (
    <section className="voxx-admissao-module voxx-surface mt-6 min-w-0 overflow-hidden rounded-[26px] p-5">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={abrirModalNovaAdmissao}
              className="voxx-button-primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Nova admissão
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
              Subir para Base de Dados ({pendentesBase.length})
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
              disabled={loading || admissoes.length === 0}
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
            {admissoes.length} {admissoes.length === 1 ? "admissão" : "admissões"}
          </span>

          <span className={temaDia ? "rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700" : "rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100"}>
            {pendentesSede.length} pendente
            {pendentesSede.length === 1 ? "" : "s"} para SEDE
          </span>

          <span className={temaDia ? "rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700" : "rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100"}>
            {pendentesBase.length} pendente
            {pendentesBase.length === 1 ? "" : "s"} para Base
          </span>
        </div>
      </div>

      {erro && !modalAberto && (
        <div className={temaDia ? "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "mb-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"}>
          {erro}
        </div>
      )}

      {sucesso && (
        <div className={temaDia ? "mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" : "mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"}>
          {sucesso}
        </div>
      )}

      {loading ? (
        <div className={temaDia ? "py-10 text-center text-sm text-slate-500" : "py-10 text-center text-sm text-slate-400"}>
          Carregando admissões...
        </div>
      ) : (
        <div className="voxx-scrollbar voxx-surface-raised w-full max-w-full overflow-x-auto rounded-[22px]">
          <table className={temaDia ? "min-w-[2210px] text-center text-xs [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0" : "min-w-[2210px] text-center text-xs [&_td]:border-r [&_td]:border-white/10 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-white/10 [&_th:last-child]:border-r-0"}>
            <thead className={temaDia ? "sticky top-0 z-10 bg-slate-100" : "sticky top-0 z-10 bg-[#2a3040]"}>
              <tr className={temaDia ? "border-b border-slate-200 text-slate-600" : "border-b border-white/10 text-slate-300"}>
                <th className="px-3 py-4 text-center">#</th>
                <th className="px-3 py-4 text-center">Ações</th>
                <th className="px-3 py-4 text-center">Pref.</th>  
                <th className="px-3 py-4 text-center">Matrícula</th>
                <th className="px-3 py-4 text-center">Nome</th>
                <th className="px-3 py-4 text-center">Cargo</th>
                <th className="px-3 py-4 text-center">CH Edital</th>
                <th className="px-3 py-4 text-center">Alteração CH</th>
                <th className="px-3 py-4 text-center">CH Final</th>
                <th className="px-3 py-4 text-center">SIRG</th>
                <th className="px-3 py-4 text-center">Horário</th>
                <th className="px-3 py-4 text-center">Exercício</th>
                <th className="px-3 py-4 text-center">Nascimento</th>
                <th className="px-3 py-4 text-center">CPF</th>
                <th className="px-3 py-4 text-center">PIS</th>
                <th className="px-3 py-4 text-center">Edital</th>
                <th className="px-3 py-4 text-center">E-mail</th>
                <th className="w-[80px] px-2 py-4 text-center">Carta Banco</th>
                <th className="w-[80px] px-2 py-4 text-center">Acesso Ponto</th>
                <th className="px-3 py-4 text-center">Registro</th>
                <th className="px-3 py-4 text-center">Base destino</th>
                <th className="px-3 py-4 text-center">Status SEDE</th>
                <th className="px-3 py-4 text-center">Status Base</th>
                <th className="px-3 py-4 text-center">Obs.</th>
              </tr>
            </thead>

            <tbody>
              {admissoes.map((admissao, indice) => (
                <tr
                  key={admissao.id}
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
                      onClick={() => abrirModalEditar(admissao)}
                      className={temaDia ? "rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100" : "rounded-xl border border-blue-300/25 bg-blue-300/10 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-300/20"}
                    >
                      Editar
                    </button>
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.pref)}
                  </td>

                  <td className={`whitespace-nowrap px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                    {texto(admissao.matricula)}
                    {registroBadge(admissao.registro_ponto)}
                  </td>

                  <td className={`min-w-[180px] px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                    {texto(admissao.nome)}
                  </td>

                  <td className={`min-w-[180px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.cargo)}
                  </td>

                  <td className={`min-w-[80px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {textoHoras(admissao.ch_edital)}
                  </td>

                  <td className={`min-w-[80px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {textoHoras(admissao.alteracao_ch)}
                  </td>

                  <td className={`min-w-[80px] px-3 py-4 text-center align-middle font-semibold ${textoDestaqueTabela}`}>
                    {textoHoras(admissao.ch_final)}
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.sirg)}
                  </td>

                  <td className={`min-w-[100px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.horario)}
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {formatarData(admissao.exercicio)}
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {formatarData(admissao.data_nascimento)}
                  </td>

                  <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.cpf)}
                  </td>

                  <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.pis)}
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.edital)}
                  </td>

                  <td className={`min-w-[180px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.email)}
                  </td>

                  <td className={`w-[80px] px-2 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    <input
                      type="checkbox"
                      checked={admissao.carta_banco === true}
                      disabled={salvandoRapidoId === admissao.id}
                      onChange={(e) =>
                        atualizarCheckboxTabela(
                          admissao,
                          "carta_banco",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Carta banco"
                    />
                  </td>

                  <td className={`w-[80px] px-2 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    <input
                      type="checkbox"
                      checked={admissao.acesso_ponto === true}
                      disabled={salvandoRapidoId === admissao.id}
                      onChange={(e) =>
                        atualizarCheckboxTabela(
                          admissao,
                          "acesso_ponto",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Acesso ao ponto"
                    />
                  </td>

                  <td className={`px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.registro_ponto)}
                  </td>

                  <td className={`whitespace-nowrap px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {baseDestinoLabel(admissao.base_destino)}
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        admissao.status_sede,
                        temaDia
                      )}`}
                    >
                      {texto(admissao.status_sede)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-center align-middle">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        admissao.status_script,
                        temaDia
                      )}`}
                    >
                      {texto(admissao.status_script)}
                    </span>
                  </td>

                  <td className={`min-w-[240px] px-3 py-4 text-center align-middle ${textoSecundarioTabela}`}>
                    {texto(admissao.observacao)}
                  </td>
                </tr>
              ))}

              {admissoes.length === 0 && (
                <tr>
                  <td
                    colSpan={24}
                    className={temaDia ? "px-4 py-10 text-center text-slate-500" : "px-4 py-10 text-center text-slate-400"}
                  >
                    Nenhuma admissão encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div
          className="voxx-admissao-modal fixed inset-0 z-[90] flex items-center justify-center bg-[var(--voxx-overlay)] px-4 backdrop-blur-[2px]"
          onMouseDown={fecharModal}
        >
          <form
            onSubmit={salvarAdmissao}
            onMouseDown={(e) => e.stopPropagation()}
            className="voxx-surface-raised max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {erro && (
                  <div className={temaDia ? "mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700" : "mt-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-center text-sm font-medium text-red-100"}>
                    {erro}
                  </div>
                )}
                <h3 className={temaDia ? "text-2xl font-bold text-slate-950" : "text-2xl font-bold text-slate-100"}>
                  {admissaoEditando ? "Editar admissão" : "Nova admissão"}
                </h3>

                <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
                  {admissaoEditando
                    ? "Atualize os dados da admissão selecionada."
                    : "Preencha os dados do colaborador admitido."}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className={temaDia ? "rounded-full px-3 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" : "rounded-full px-3 py-1 text-slate-400 hover:bg-white/10 hover:text-white"}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <InputTexto
                label="Pref."
                value={formulario.pref}
                onChange={(valor) => atualizarCampo("pref", valor)}
                placeholder="Ex: 95"
              />

              <InputTexto
                label="Matrícula"
                value={formulario.matricula}
                onChange={(valor) => atualizarCampo("matricula", valor)}
                placeholder="Ex: 40524579"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
              />

              <InputTexto
                label="Nome"
                value={formulario.nome}
                onChange={(valor) => atualizarCampo("nome", valor)}
                required
                className="lg:col-span-2"
              />

              <InputTexto
                label="Cargo"
                value={formulario.cargo}
                onChange={(valor) => atualizarCampo("cargo", valor)}
                className="lg:col-span-2"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
                <InputTexto
                  label="CH edital"
                  value={formulario.ch_edital}
                  onChange={(valor) => atualizarCampo("ch_edital", valor)}
                  placeholder="Ex: 40"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                />

                <InputTexto
                  label="Alt. CH"
                  value={formulario.alteracao_ch}
                  onChange={(valor) => atualizarCampo("alteracao_ch", valor)}
                  placeholder="Ex: 10"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                />

                <InputTexto
                  label="CH final"
                  value={chFinalCalculada}
                  onChange={() => {}}
                  placeholder="Calc."
                  disabled
                />
              </div>

              <SelectCampo
                label="Horário"
                value={formulario.horario}
                onChange={(valor) => atualizarCampo("horario", valor)}
                placeholder="Selecione o horário"
                options={HORARIOS_ADMISSAO.map((horario) => ({
                  value: horario,
                  label: horario,
                }))}
              />

              <InputTexto
                label="Exercício"
                value={formulario.exercicio}
                onChange={(valor) => atualizarCampo("exercicio", valor)}
                type="date"
              />

              <InputTexto
                label="Data de nascimento"
                value={formulario.data_nascimento}
                onChange={(valor) => atualizarCampo("data_nascimento", valor)}
                type="date"
              />

              <InputTexto
                label="CPF"
                value={formulario.cpf}
                onChange={(valor) => atualizarCampo("cpf", valor)}
              />

              <InputTexto
                label="PIS"
                value={formulario.pis}
                onChange={(valor) => atualizarCampo("pis", valor)}
              />

              <InputTexto
                label="Edital"
                value={formulario.edital}
                onChange={(valor) => atualizarCampo("edital", valor)}
              />

              <InputTexto
                label="E-mail"
                value={formulario.email}
                onChange={(valor) => atualizarCampo("email", valor)}
                type="email"
                className="lg:col-span-2"
              />

              <SelectCampo
                label="Registro do ponto"
                value={formulario.registro_ponto}
                onChange={(valor) => atualizarCampo("registro_ponto", valor)}
                placeholder="Não informado"
                options={[
                  { value: "Facial", label: "Facial" },
                  { value: "Digital", label: "Digital" },
                ]}
              />

              <SelectCampo
                label="Base de destino"
                value={formulario.base_destino}
                onChange={(valor) => atualizarCampo("base_destino", valor)}
                options={[
                  { value: "colaboradores", label: "Colaboradores" },
                  { value: "gestao_rh", label: "Gestão e RH" },
                ]}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <CheckboxCampo
                label="SIRG feito"
                checked={formulario.sirg}
                onChange={(valor) => atualizarCampo("sirg", valor)}
              />

              <CheckboxCampo
                label="Carta banco"
                checked={formulario.carta_banco}
                onChange={(valor) => atualizarCampo("carta_banco", valor)}
              />

              <CheckboxCampo
                label="Acesso ao ponto"
                checked={formulario.acesso_ponto}
                onChange={(valor) => atualizarCampo("acesso_ponto", valor)}
                description="Indica se o acesso ao sistema de ponto será tratado pela admissão."
              />

              <CheckboxCampo
                label="Enviar instruções ao colaborador"
                checked={formulario.enviar_email_colaborador}
                onChange={(valor) =>
                  atualizarCampo("enviar_email_colaborador", valor)
                }
                description="O envio real será ativado em uma etapa futura."
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
                className={temaDia ? "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200" : "mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-blue-300/10"}
              />
            </label>

            <div className={temaDia ? "mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5" : "mt-6 flex justify-end gap-3 border-t border-white/10 pt-5"}>
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="voxx-button-secondary rounded-2xl px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="voxx-button-primary rounded-2xl px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : admissaoEditando
                  ? "Salvar alterações"
                  : "Salvar admissão"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

