// perfis oficiais do sistema
export const PERFIS = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
  ADMISSAO_SEM_ACENTO: "Admissao",
  TRANSFERENCIA: "Transferência",
  TRANSFERENCIA_SEM_ACENTO: "Transferencia",
  DESLIGAMENTO: "Desligamento",
  ADMISSAO: "Admissão",
  ATENDIMENTO: "Atendimento",
} as const;

export type Perfil = (typeof PERFIS)[keyof typeof PERFIS];

// permissões oficiais do sistema
export const PERMISSOES = {
  SOLICITACOES: "solicitacoes",
  DASHBOARD: "dashboard",
  CONFERENCIA_FOLHA: "conferenciaFolha",

  // dashboards antigos
  ADMISSOES_DASHBOARD: "admissoesDashboard",
  DESLIGAMENTOS: "desligamentos",
  ATESTADOS: "atestados",
  TRANSFERENCIAS: "transferencias",
  PERMUTAS: "permutas",

  // áreas administrativas
  AUDITORIA: "auditoria",
  USUARIOS: "usuarios",

  // base de dados
  BASE_DADOS_COLABORADORES: "baseDadosColaboradores",
  BASE_DADOS_GESTAO_RH: "baseDadosGestaoRh",

  // módulo de admissão
  ADMISSOES_VISUALIZAR: "admissoesVisualizar",
  ADMISSOES_CRIAR: "admissoesCriar",
  ADMISSOES_EDITAR: "admissoesEditar",
  ADMISSOES_ENVIAR_SEDE: "admissoesEnviarSede",
  ADMISSOES_SUBIR_BASE: "admissoesSubirBase",

  // módulo novos admitidos
  NOVOS_ADMITIDOS_VISUALIZAR: "novosAdmitidosVisualizar",
  NOVOS_ADMITIDOS_EDITAR: "novosAdmitidosEditar",
} as const;

export type Permissao = (typeof PERMISSOES)[keyof typeof PERMISSOES];

type PerfilConfig = Record<Permissao, boolean>;

// permissões de cada perfil
export const PERFIS_CONFIG: Record<Perfil, PerfilConfig> = {
  Admin: {
    solicitacoes: true,
    dashboard: true,
    conferenciaFolha: true,

    admissoesDashboard: true,
    desligamentos: true,
    atestados: true,
    transferencias: true,
    permutas: true,

    auditoria: true,
    usuarios: true,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: true,

    admissoesVisualizar: true,
    admissoesCriar: true,
    admissoesEditar: true,
    admissoesEnviarSede: true,
    admissoesSubirBase: true,

    novosAdmitidosVisualizar: true,
    novosAdmitidosEditar: true,
  },

  Gerente: {
    solicitacoes: false,
    dashboard: true,
    conferenciaFolha: true,

    admissoesDashboard: true,
    desligamentos: true,
    atestados: true,
    transferencias: true,
    permutas: true,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: true,

    admissoesVisualizar: true,
    admissoesCriar: true,
    admissoesEditar: true,
    admissoesEnviarSede: true,
    admissoesSubirBase: true,

    novosAdmitidosVisualizar: true,
    novosAdmitidosEditar: true,
  },

  Admissão: {
    solicitacoes: false,
    dashboard: false,
    conferenciaFolha: false,

    admissoesDashboard: false,
    desligamentos: false,
    atestados: false,
    transferencias: true,
    permutas: true,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: false,

    admissoesVisualizar: true,
    admissoesCriar: true,
    admissoesEditar: true,
    admissoesEnviarSede: true,
    admissoesSubirBase: true,

    novosAdmitidosVisualizar: true,
    novosAdmitidosEditar: false,
  },

  Admissao: {
    solicitacoes: false,
    dashboard: false,
    conferenciaFolha: false,

    admissoesDashboard: false,
    desligamentos: false,
    atestados: false,
    transferencias: true,
    permutas: true,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: false,

    admissoesVisualizar: true,
    admissoesCriar: true,
    admissoesEditar: true,
    admissoesEnviarSede: true,
    admissoesSubirBase: true,

    novosAdmitidosVisualizar: true,
    novosAdmitidosEditar: false,
  },

  Transferência: {
    solicitacoes: false,
    dashboard: false,
    conferenciaFolha: false,

    admissoesDashboard: false,
    desligamentos: false,
    atestados: false,
    transferencias: true,
    permutas: true,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: true,

    admissoesVisualizar: false,
    admissoesCriar: false,
    admissoesEditar: false,
    admissoesEnviarSede: false,
    admissoesSubirBase: false,

    novosAdmitidosVisualizar: false,
    novosAdmitidosEditar: false,
  },

  Transferencia: {
    solicitacoes: false,
    dashboard: false,
    conferenciaFolha: false,

    admissoesDashboard: false,
    desligamentos: false,
    atestados: false,
    transferencias: true,
    permutas: true,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: true,

    admissoesVisualizar: false,
    admissoesCriar: false,
    admissoesEditar: false,
    admissoesEnviarSede: false,
    admissoesSubirBase: false,

    novosAdmitidosVisualizar: false,
    novosAdmitidosEditar: false,
  },

  Desligamento: {
    solicitacoes: false,
    dashboard: false,
    conferenciaFolha: false,

    admissoesDashboard: false,
    desligamentos: true,
    atestados: false,
    transferencias: true,
    permutas: true,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: true,

    admissoesVisualizar: false,
    admissoesCriar: false,
    admissoesEditar: false,
    admissoesEnviarSede: false,
    admissoesSubirBase: false,

    novosAdmitidosVisualizar: false,
    novosAdmitidosEditar: false,
  },

  Atendimento: {
    solicitacoes: false,
    dashboard: false,
    conferenciaFolha: false,

    admissoesDashboard: false,
    desligamentos: false,
    atestados: false,
    transferencias: false,
    permutas: false,

    auditoria: false,
    usuarios: false,

    baseDadosColaboradores: true,
    baseDadosGestaoRh: false,

    admissoesVisualizar: false,
    admissoesCriar: false,
    admissoesEditar: false,
    admissoesEnviarSede: false,
    admissoesSubirBase: false,

    novosAdmitidosVisualizar: true,
    novosAdmitidosEditar: true,
  },
};

export function perfilExiste(perfil: string | null | undefined): perfil is Perfil {
  if (!perfil) return false;

  return Object.values(PERFIS).includes(perfil as Perfil);
}

export function temPermissao(
  perfil: string | null | undefined,
  permissao: Permissao
) {
  if (!perfilExiste(perfil)) return false;

  return PERFIS_CONFIG[perfil][permissao] === true;
}

export function podeVerMenuBaseDados(perfil: string | null | undefined) {
  return (
    temPermissao(perfil, PERMISSOES.BASE_DADOS_COLABORADORES) ||
    temPermissao(perfil, PERMISSOES.BASE_DADOS_GESTAO_RH)
  );
}

export function podeVerMenuAdmissao(perfil: string | null | undefined) {
  return (
    temPermissao(perfil, PERMISSOES.ADMISSOES_VISUALIZAR) ||
    temPermissao(perfil, PERMISSOES.NOVOS_ADMITIDOS_VISUALIZAR)
  );
}
