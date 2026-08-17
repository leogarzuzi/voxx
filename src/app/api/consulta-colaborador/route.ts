import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TAMANHO_PAGINA = 4;
const MODULOS_VALIDOS = [
  "desligamentos",
  "transferencias",
  "permutas",
  "atestados",
  "trocasPlantao",
  "bancoHoras",
] as const;
type ModuloHistorico = (typeof MODULOS_VALIDOS)[number];

type RegistroHistorico = {
  id: string;
  modulo: string;
  titulo: string;
  descricao: string;
  data: string | null;
  status?: string | null;
};

type LinhaBanco = Record<string, unknown>;

type Vinculo = {
  matricula: string;
  nome: string | null;
  cpf: string | null;
  cargo: string | null;
  cargaHoraria: string | null;
  admissao: string | null;
  desligamento: string | null;
  statusAtual: string | null;
};

function limparBusca(valor: string | null) {
  return String(valor || "").trim().replace(/[,%*()]/g, " ").replace(/\s+/g, " ");
}

function somenteDigitos(valor: unknown) {
  return String(valor || "").replace(/\D/g, "");
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined || String(valor).trim() === "") return null;
  return String(valor).trim();
}

function cpfFormatado(valor: unknown) {
  const cpf = somenteDigitos(valor);
  return cpf.length === 11 ? `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}` : texto(valor);
}

function dataExibicao(valor: unknown) {
  const data = texto(valor);
  if (!data) return null;
  const parte = data.split("T")[0];
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parte);
  return correspondencia ? `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}` : data;
}

function dataRegistro(registro: Record<string, unknown>) {
  return texto(
    registro.criado_em ||
      registro.atualizado_em ||
      registro.created_at ||
      registro.computado_em ||
      registro.inicio_hmrg ||
      registro.inicio_nova_unidade ||
      registro.data_desligamento ||
      registro.exercicio ||
      registro.exercicio_entrada ||
      registro.data_inicial
  );
}

function montarFiltroBusca(busca: string, campos: string[]) {
  const termo = busca.replace(/[.\-]/g, "");
  return campos.map((campo) => `${campo}.ilike.*${termo}*`).join(",");
}

function corresponde(valor: unknown, busca: string) {
  const normalizar = (item: unknown) => String(item || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  return normalizar(valor).includes(normalizar(busca));
}

async function buscarCandidatos(supabase: SupabaseClient, tabela: string, select: string, campos: string[], busca: string): Promise<LinhaBanco[]> {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(select)
      .or(montarFiltroBusca(busca, campos))
      .limit(30);
    return error ? [] : (data ?? []) as unknown as LinhaBanco[];
  } catch {
    return [];
  }
}

function adicionarVinculo(mapa: Map<string, Vinculo>, dados: Record<string, unknown>) {
  const matricula = somenteDigitos(dados.matricula);
  if (!matricula) return;
  const atual = mapa.get(matricula);
  mapa.set(matricula, {
    matricula,
    nome: atual?.nome || texto(dados.nome),
    cpf: atual?.cpf || cpfFormatado(dados.cpf),
    cargo: atual?.cargo || texto(dados.cargo),
    cargaHoraria: atual?.cargaHoraria || texto(dados.cargaHoraria),
    admissao: atual?.admissao || texto(dados.admissao),
    desligamento: atual?.desligamento || texto(dados.desligamento),
    statusAtual: atual?.statusAtual || texto(dados.statusAtual),
  });
}

async function localizarVinculos(supabase: SupabaseClient, busca: string) {
  const [colaboradores, gestao, admissoes, desligamentos, transferencias, permutas, atestados, trocas, bancoHoras] = await Promise.all([
    buscarCandidatos(supabase, "colaboradores", "matricula,nome,cpf,cargo,carga_horaria,exercicio", ["nome", "matricula", "cpf"], busca),
    buscarCandidatos(supabase, "colaboradores_gestao_rh", "matricula,nome,cpf,cargo,carga_horaria,exercicio", ["nome", "matricula", "cpf"], busca),
    buscarCandidatos(supabase, "admissoes_controle", "matricula,nome,cpf,cargo,ch_final,exercicio", ["nome", "matricula", "cpf"], busca),
    buscarCandidatos(supabase, "desligamentos_controle", "matricula,nome,cpf,cargo,carga_horaria,exercicio,data_desligamento", ["nome", "matricula", "cpf"], busca),
    buscarCandidatos(supabase, "transferencias_controle", "matricula,nome,cpf,cargo,carga_horaria,exercicio", ["nome", "matricula", "cpf"], busca),
    buscarCandidatos(supabase, "permutas_controle", "matricula_saida,nome_saida,cargo_saida,matricula_entrada,nome_entrada,cargo_entrada,carga_horaria_entrada,exercicio_entrada,cpf_entrada", ["nome_saida", "matricula_saida", "nome_entrada", "matricula_entrada", "cpf_entrada"], busca),
    buscarCandidatos(supabase, "atestados", "matricula,nome,funcao", ["nome", "matricula"], busca),
    buscarCandidatos(supabase, "trocas_plantao", "matricula_solicitante,nome_solicitante,funcao_solicitante,matricula_solicitado,nome_solicitado,funcao_solicitado", ["nome_solicitante", "matricula_solicitante", "nome_solicitado", "matricula_solicitado"], busca),
    buscarCandidatos(supabase, "banco_horas_controle", "matricula,nome,funcao", ["nome", "matricula"], busca),
  ]);

  const mapa = new Map<string, Vinculo>();
  for (const item of colaboradores) adicionarVinculo(mapa, { ...item, cargaHoraria: item.carga_horaria, admissao: item.exercicio, statusAtual: "Ativo na base de colaboradores" });
  for (const item of gestao) adicionarVinculo(mapa, { ...item, cargaHoraria: item.carga_horaria, admissao: item.exercicio, statusAtual: "Na base Gestão e RH" });
  for (const item of admissoes) adicionarVinculo(mapa, { ...item, cargaHoraria: item.ch_final, admissao: item.exercicio, statusAtual: "Registro de admissão" });
  for (const item of desligamentos) {
    adicionarVinculo(mapa, { ...item, cargaHoraria: item.carga_horaria, admissao: item.exercicio, desligamento: item.data_desligamento });
    const matricula = somenteDigitos(item.matricula);
    const vinculo = mapa.get(matricula);
    if (vinculo) mapa.set(matricula, { ...vinculo, desligamento: texto(item.data_desligamento), statusAtual: "Desligado" });
  }
  for (const item of transferencias) adicionarVinculo(mapa, { ...item, cargaHoraria: item.carga_horaria, admissao: item.exercicio, statusAtual: "Registro de transferência" });
  for (const item of permutas) {
    if (corresponde(item.nome_saida, busca) || corresponde(item.matricula_saida, busca)) adicionarVinculo(mapa, { matricula: item.matricula_saida, nome: item.nome_saida, cargo: item.cargo_saida, statusAtual: "Registro de permuta" });
    if (corresponde(item.nome_entrada, busca) || corresponde(item.matricula_entrada, busca) || corresponde(item.cpf_entrada, busca)) adicionarVinculo(mapa, { matricula: item.matricula_entrada, nome: item.nome_entrada, cpf: item.cpf_entrada, cargo: item.cargo_entrada, cargaHoraria: item.carga_horaria_entrada, admissao: item.exercicio_entrada, statusAtual: "Registro de permuta" });
  }
  for (const item of atestados) adicionarVinculo(mapa, { matricula: item.matricula, nome: item.nome, cargo: item.funcao, statusAtual: "Possui registros no sistema" });
  for (const item of trocas) {
    if (corresponde(item.nome_solicitante, busca) || corresponde(item.matricula_solicitante, busca)) adicionarVinculo(mapa, { matricula: item.matricula_solicitante, nome: item.nome_solicitante, cargo: item.funcao_solicitante, statusAtual: "Memorando de troca de plantão" });
    if (corresponde(item.nome_solicitado, busca) || corresponde(item.matricula_solicitado, busca)) adicionarVinculo(mapa, { matricula: item.matricula_solicitado, nome: item.nome_solicitado, cargo: item.funcao_solicitado, statusAtual: "Memorando de troca de plantão" });
  }
  for (const item of bancoHoras) adicionarVinculo(mapa, { matricula: item.matricula, nome: item.nome, cargo: item.funcao, statusAtual: "Memorando de banco de horas" });

  return [...mapa.values()].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}

async function consultarPorMatricula(
  supabase: SupabaseClient,
  tabela: string,
  select: string,
  camposMatricula: string[],
  matricula: string,
  quantidade: number,
  ordenarPor?: string
) {
  try {
    const filtro = camposMatricula.map((campo) => `${campo}.eq.${matricula}`).join(",");
    let query = supabase
      .from(tabela)
      .select(select, { count: "exact" })
      .or(filtro);
    if (ordenarPor) query = query.order(ordenarPor, { ascending: false });
    const { data, error, count } = await query.range(0, Math.max(quantidade - 1, 0));
    return error ? { data: [] as LinhaBanco[], count: 0 } : { data: (data ?? []) as unknown as LinhaBanco[], count: count ?? 0 };
  } catch {
    return { data: [], count: 0 };
  }
}

async function carregarModulo(supabase: SupabaseClient, modulo: ModuloHistorico, matricula: string, offset: number) {
  const quantidade = offset + TAMANHO_PAGINA;
  let registros: RegistroHistorico[] = [];
  let total = 0;

  if (modulo === "desligamentos") {
    const resultado = await consultarPorMatricula(supabase, "desligamentos_controle", "id,matricula,nome,cargo,data_desligamento,tipo_desligamento,status_sede,status_base,criado_em", ["matricula"], matricula, quantidade);
    total = resultado.count;
    registros = resultado.data.map((item) => ({ id: `desligamento-${item.id}`, modulo, titulo: texto(item.tipo_desligamento) || "Desligamento", descricao: `${texto(item.cargo) || "Cargo não informado"} · Matrícula ${matricula}`, data: texto(item.data_desligamento) || dataRegistro(item), status: texto(item.status_base || item.status_sede) }));
  }

  if (modulo === "transferencias") {
    const resultado = await consultarPorMatricula(supabase, "transferencias_controle", "id,matricula,nome,cargo,tipo_movimento,cedente,cessionario,inicio_nova_unidade,status,criado_em", ["matricula"], matricula, quantidade);
    total = resultado.count;
    registros = resultado.data.map((item) => ({ id: `transferencia-${item.id}`, modulo, titulo: texto(item.tipo_movimento) || "Transferência", descricao: `${texto(item.cedente) || "Origem não informada"} → ${texto(item.cessionario) || "Destino não informado"}`, data: texto(item.inicio_nova_unidade) || dataRegistro(item), status: texto(item.status) }));
  }

  if (modulo === "permutas") {
    const resultado = await consultarPorMatricula(supabase, "permutas_controle", "id,matricula_saida,nome_saida,cargo_saida,matricula_entrada,nome_entrada,cargo_entrada,unidade_origem,inicio_hmrg,status,criado_em", ["matricula_saida", "matricula_entrada"], matricula, quantidade);
    total = resultado.count;
    registros = resultado.data.map((item) => ({ id: `permuta-${item.id}`, modulo, titulo: "Permuta", descricao: `${texto(item.nome_saida) || "-"} ↔ ${texto(item.nome_entrada) || "-"}`, data: texto(item.inicio_hmrg) || dataRegistro(item), status: texto(item.status) }));
  }

  if (modulo === "atestados") {
    const resultado = await consultarPorMatricula(supabase, "atestados", "id,matricula,nome,funcao,data_inicial,data_final,cid,observacao,mes", ["matricula"], matricula, quantidade);
    total = resultado.count;
    registros = resultado.data.map((item) => ({ id: `atestado-${item.id}`, modulo, titulo: `Atestado${texto(item.cid) ? ` · CID ${texto(item.cid)}` : ""}`, descricao: `${texto(item.data_inicial) || "Data inicial não informada"} até ${texto(item.data_final) || "data final não informada"}${texto(item.observacao) ? ` · ${texto(item.observacao)}` : ""}`, data: texto(item.data_inicial), status: texto(item.mes) }));
  }

  if (modulo === "trocasPlantao") {
    const resultado = await consultarPorMatricula(supabase, "trocas_plantao", "id,protocolo,matricula_solicitante,nome_solicitante,data_plantao_solicitante,tipo_plantao_solicitante,matricula_solicitado,nome_solicitado,data_plantao_solicitado,tipo_plantao_solicitado,status,recebido_em,criado_em", ["matricula_solicitante", "matricula_solicitado"], matricula, quantidade, "recebido_em");
    total = resultado.count;
    registros = resultado.data.map((item) => {
      const solicitante = somenteDigitos(item.matricula_solicitante) === matricula;
      const outraPessoa = solicitante ? texto(item.nome_solicitado) : texto(item.nome_solicitante);
      const dataOriginal = solicitante ? texto(item.data_plantao_solicitante) : texto(item.data_plantao_solicitado);
      const tipoOriginal = solicitante ? texto(item.tipo_plantao_solicitante) : texto(item.tipo_plantao_solicitado);
      const dataNova = solicitante ? texto(item.data_plantao_solicitado) : texto(item.data_plantao_solicitante);
      const tipoNovo = solicitante ? texto(item.tipo_plantao_solicitado) : texto(item.tipo_plantao_solicitante);
      return { id: `troca-${item.id}`, modulo, titulo: texto(item.protocolo) || "Troca de plantão", descricao: `Plantão original: ${dataExibicao(dataOriginal) || "não informado"}${tipoOriginal ? ` (${tipoOriginal})` : ""} · Novo plantão: ${dataExibicao(dataNova) || "não informado"}${tipoNovo ? ` (${tipoNovo})` : ""} · Troca com ${outraPessoa || "colaborador não informado"}`, data: dataOriginal || dataRegistro(item), status: texto(item.status) };
    });
  }

  if (modulo === "bancoHoras") {
    const resultado = await consultarPorMatricula(supabase, "banco_horas_controle", "id,protocolo,matricula,nome,data_plantao_original,tipo_plantao_original,data_novo_plantao,tipo_novo_plantao,status,recebido_em,criado_em", ["matricula"], matricula, quantidade, "recebido_em");
    total = resultado.count;
    registros = resultado.data.map((item) => ({ id: `banco-horas-${item.id}`, modulo, titulo: texto(item.protocolo) || "Banco de horas", descricao: `Plantão original: ${dataExibicao(item.data_plantao_original) || "não informado"}${texto(item.tipo_plantao_original) ? ` (${texto(item.tipo_plantao_original)})` : ""} · Novo plantão: ${dataExibicao(item.data_novo_plantao) || "não informado"}${texto(item.tipo_novo_plantao) ? ` (${texto(item.tipo_novo_plantao)})` : ""}`, data: texto(item.recebido_em) || dataRegistro(item), status: texto(item.status) }));
  }

  registros.sort((a, b) => (b.data ? new Date(b.data).getTime() : 0) - (a.data ? new Date(a.data).getTime() : 0));
  const pagina = registros.slice(offset, offset + TAMANHO_PAGINA);
  return { registros: pagina, total, temMais: offset + pagina.length < total };
}

async function carregarFicha(supabase: SupabaseClient, matricula: string, modulo?: ModuloHistorico, offset = 0) {
  if (modulo) return carregarModulo(supabase, modulo, matricula, offset);

  const pares = await Promise.all(
    MODULOS_VALIDOS.map(async (nomeModulo) => [nomeModulo, await carregarModulo(supabase, nomeModulo, matricula, 0)] as const)
  );
  const historico = Object.fromEntries(pares);
  const vinculos = await localizarVinculos(supabase, matricula);
  const vinculo = vinculos.find((item) => item.matricula === matricula) ?? null;
  return { dadosPrincipais: vinculo, historico };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.email) return Response.json({ success: false, error: "Não autenticado." }, { status: 401 });

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("status")
      .eq("email", auth.user.email.toLowerCase())
      .single();
    if (usuario?.status !== "ativo") return Response.json({ success: false, error: "Usuário sem acesso ativo." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const matricula = somenteDigitos(searchParams.get("matricula"));
    const moduloParam = searchParams.get("modulo");
    const modulo = MODULOS_VALIDOS.includes(moduloParam as ModuloHistorico) ? (moduloParam as ModuloHistorico) : undefined;
    const offset = Math.min(Math.max(Number(searchParams.get("offset") || "0"), 0), 1000);

    if (matricula) {
      if (matricula.length !== 8) {
        return Response.json({ success: false, error: "Matrícula inválida." }, { status: 400 });
      }
      const ficha = await carregarFicha(supabase, matricula, modulo, offset);
      return Response.json({ success: true, matricula, ...ficha });
    }

    const busca = limparBusca(searchParams.get("busca"));
    if (busca.length < 2 || busca.length > 100) {
      return Response.json({ success: false, error: "Informe uma busca entre 2 e 100 caracteres." }, { status: 400 });
    }

    const vinculos = await localizarVinculos(supabase, busca);
    return Response.json({
      success: true,
      encontrado: vinculos.length > 0,
      requerSelecao: vinculos.length > 1,
      vinculos,
    });
  } catch (error) {
    console.error("Erro na consulta segura de colaborador:", error);
    return Response.json({ success: false, error: "Não foi possível consultar o colaborador." }, { status: 500 });
  }
}
