import { PERMISSOES, type PerfilConfig, type Permissao } from "@/lib/perfis";

export type ModuloPerfil = {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Permissao[];
};

export const MODULOS_PERFIL: ModuloPerfil[] = [
  {
    id: "base-dados",
    nome: "Base de Dados",
    descricao: "Colaboradores e informações de Gestão e RH.",
    permissoes: [
      PERMISSOES.BASE_DADOS_COLABORADORES,
      PERMISSOES.BASE_DADOS_GESTAO_RH,
    ],
  },
  {
    id: "admissao",
    nome: "Admissão",
    descricao: "Controle de admissões e novos admitidos.",
    permissoes: [
      PERMISSOES.ADMISSOES_VISUALIZAR,
      PERMISSOES.ADMISSOES_CRIAR,
      PERMISSOES.ADMISSOES_EDITAR,
      PERMISSOES.ADMISSOES_ENVIAR_SEDE,
      PERMISSOES.ADMISSOES_SUBIR_BASE,
      PERMISSOES.NOVOS_ADMITIDOS_VISUALIZAR,
      PERMISSOES.NOVOS_ADMITIDOS_EDITAR,
    ],
  },
  {
    id: "desligamento",
    nome: "Desligamento",
    descricao: "Controle e acompanhamento de desligamentos.",
    permissoes: [PERMISSOES.DESLIGAMENTOS],
  },
  {
    id: "transferencia",
    nome: "Transferência",
    descricao: "Solicitações e controle de transferências.",
    permissoes: [PERMISSOES.TRANSFERENCIAS],
  },
  {
    id: "permuta",
    nome: "Permuta",
    descricao: "Solicitações e controle de permutas.",
    permissoes: [PERMISSOES.PERMUTAS],
  },
  {
    id: "dashboard",
    nome: "Dashboard",
    descricao: "Visão geral e indicadores gerenciais.",
    permissoes: [
      PERMISSOES.DASHBOARD,
      PERMISSOES.ADMISSOES_DASHBOARD,
      PERMISSOES.DESLIGAMENTOS_DASHBOARD,
      PERMISSOES.ATESTADOS,
    ],
  },
  {
    id: "central-memorandos",
    nome: "Central de Memorandos",
    descricao: "Trocas de plantão e banco de horas.",
    permissoes: [PERMISSOES.CENTRAL_MEMORANDOS],
  },
  {
    id: "analise-fopag",
    nome: "Análise FOPAG",
    descricao: "Conferência e análise da folha de pagamento.",
    permissoes: [PERMISSOES.CONFERENCIA_FOLHA],
  },
  {
    id: "solicitacoes",
    nome: "Solicitações",
    descricao: "Aprovação de solicitações de acesso.",
    permissoes: [PERMISSOES.SOLICITACOES],
  },
  {
    id: "usuarios",
    nome: "Usuários",
    descricao: "Gestão de contas, perfis e status.",
    permissoes: [PERMISSOES.USUARIOS],
  },
  {
    id: "perfis",
    nome: "Perfis",
    descricao: "Criação e administração de perfis de acesso.",
    permissoes: [PERMISSOES.PERFIS],
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    descricao: "Histórico de ações realizadas no sistema.",
    permissoes: [PERMISSOES.AUDITORIA],
  },
];

export function permissoesDosModulos(modulos: string[]): PerfilConfig {
  const selecionados = new Set(modulos);
  const config: PerfilConfig = {};

  for (const modulo of MODULOS_PERFIL) {
    for (const permissao of modulo.permissoes) {
      config[permissao] = selecionados.has(modulo.id);
    }
  }

  return config;
}

export function modulosDasPermissoes(permissoes: PerfilConfig): string[] {
  return MODULOS_PERFIL.filter((modulo) =>
    modulo.permissoes.some((permissao) => permissoes[permissao] === true)
  ).map((modulo) => modulo.id);
}

export function assinaturaModulos(modulos: string[]) {
  return [...new Set(modulos)].sort().join("|");
}

export function normalizarNomePerfil(nome: string) {
  return nome
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}
