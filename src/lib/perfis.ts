// perfis oficiais do sistema
export const PERFIS = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
} as const;

export type Perfil = (typeof PERFIS)[keyof typeof PERFIS];

// permissões oficiais do sistema
export const PERMISSOES = {
  SOLICITACOES: "solicitacoes",
  DASHBOARD: "dashboard",
  CONFERENCIA_FOLHA: "conferenciaFolha",
  ADMISSOES: "admissoes",
  DESLIGAMENTOS: "desligamentos",
  ATESTADOS: "atestados",
  AUDITORIA: "auditoria",
  USUARIOS: "usuarios",

  // base de dados
  BASE_DADOS_COLABORADORES: "baseDadosColaboradores",
  BASE_DADOS_GESTAO_RH: "baseDadosGestaoRh",
} as const;

export type Permissao = (typeof PERMISSOES)[keyof typeof PERMISSOES];

type PerfilConfig = Record<Permissao, boolean>;

// permissões de cada perfil
export const PERFIS_CONFIG: Record<Perfil, PerfilConfig> = {
  Admin: {
    solicitacoes: true, // pode aprovar acessos
    dashboard: true, // acesso ao dashboard
    conferenciaFolha: true, // acesso à conferência de folha
    admissoes: true, // acesso às admissões
    desligamentos: true, // acesso aos desligamentos
    atestados: true, // acesso aos atestados
    auditoria: true, // acesso aos logs de auditoria
    usuarios: true, // gestão de usuários

    // base de dados
    baseDadosColaboradores: true, // todos os perfis oficiais atuais podem ver
    baseDadosGestaoRh: true, // somente perfis liberados podem ver
  },

  Gerente: {
    solicitacoes: false, // não acessa solicitações
    dashboard: true,
    conferenciaFolha: true,
    admissoes: true,
    desligamentos: true,
    atestados: true,
    auditoria: false,
    usuarios: false,

    // base de dados
    baseDadosColaboradores: true,
    baseDadosGestaoRh: true,
  },
};

// verifica se o perfil recebido existe no sistema
export function perfilExiste(perfil: string | null | undefined): perfil is Perfil {
  if (!perfil) return false;

  return Object.values(PERFIS).includes(perfil as Perfil);
}

// função principal para validar permissões
export function temPermissao(
  perfil: string | null | undefined,
  permissao: Permissao
) {
  if (!perfilExiste(perfil)) {
    return false;
  }

  return PERFIS_CONFIG[perfil][permissao] === true;
}

// usada para saber se aparece o menu pai "Base de Dados"
export function podeVerMenuBaseDados(perfil: string | null | undefined) {
  return (
    temPermissao(perfil, PERMISSOES.BASE_DADOS_COLABORADORES) ||
    temPermissao(perfil, PERMISSOES.BASE_DADOS_GESTAO_RH)
  );
}