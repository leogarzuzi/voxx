// perfis oficiais do sistema
export const PERFIS = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
} as const;

// permissões de cada perfil
export const PERFIS_CONFIG = {
  Admin: {
    solicitacoes: true, // pode aprovar acessos
    dashboard: true, // acesso ao dashboard
    conferenciaFolha: true, // acesso à conferência de folha
    admissoes: true, // acesso às admissões
    desligamentos: true, // acesso aos desligamentos
    atestados: true, // acesso aos atestados
  },

  Gerente: {
    solicitacoes: false, // não acessa solicitações
    dashboard: true,
    conferenciaFolha: true,
    admissoes: true,
    desligamentos: true,
    atestados: true,
  },
} as const;