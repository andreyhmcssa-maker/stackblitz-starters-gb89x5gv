import type { Permission, ProfileKey } from "./types";

export type PermissionInfo = {
  key: Permission;
  label: string;
  description: string;
  view: boolean; // true = só visualiza
};

export const PERMISSIONS: PermissionInfo[] = [
  { key: "dashboard.ver", label: "Ver Dashboard", description: "Ver o painel inicial", view: true },
  { key: "equipe.ver", label: "Ver Equipe", description: "Ver os colaboradores", view: true },
  {
    key: "equipe.editar",
    label: "Editar Equipe",
    description: "Cadastrar, editar e desligar colaboradores",
    view: false,
  },
  {
    key: "escalas.ver",
    label: "Ver Escalas",
    description: "Ver as escalas e baixar o PDF",
    view: true,
  },
  {
    key: "escalas.editar",
    label: "Editar Escalas",
    description: "Fixar, ajustar o dia e lançar plantão",
    view: false,
  },
  { key: "trocas.ver", label: "Ver Trocas", description: "Ver as trocas", view: true },
  {
    key: "trocas.registrar",
    label: "Registrar Trocas",
    description: "Lançar trocas de plantão",
    view: false,
  },
  { key: "remanejos.ver", label: "Ver Remanejos", description: "Ver os remanejos", view: true },
  {
    key: "remanejos.registrar",
    label: "Registrar Remanejos",
    description: "Lançar remanejos",
    view: false,
  },
  {
    key: "conflitos.ver",
    label: "Ver Conflitos",
    description: "Ver lançamentos, Eu devo, Me deve, folgas TRE e feriados",
    view: true,
  },
  {
    key: "conflitos.lancar",
    label: "Lançar em Conflitos",
    description: "Fazer lançamentos, saldos de folga TRE, feriados e datas de pagamento",
    view: false,
  },
];

export const PROFILES: { key: ProfileKey; label: string; description: string }[] = [
  {
    key: "admin",
    label: "Administrador geral",
    description: "Vê e edita tudo, acessa as Configurações e escolhe o setor ao entrar.",
  },
  {
    key: "diretoria",
    label: "Diretoria",
    description: "Só visualiza. Pode ter vários setores e escolhe qual ver ao entrar.",
  },
  {
    key: "gerencia",
    label: "Gerência",
    description: "Responsável por um setor. Entra direto nele.",
  },
  {
    key: "horizontal",
    label: "Horizontal",
    description: "Responsável por um setor. Entra direto nele.",
  },
  {
    key: "rh",
    label: "RH",
    description: "Responsável por um setor. Entra direto nele.",
  },
];

export const profileLabel = Object.fromEntries(
  PROFILES.map((profile) => [profile.key, profile.label])
) as Record<ProfileKey, string>;

export const profileStyle: Record<ProfileKey, string> = {
  admin: "bg-purple-100 text-purple-700",
  diretoria: "bg-sky-100 text-sky-700",
  gerencia: "bg-emerald-100 text-emerald-700",
  horizontal: "bg-amber-100 text-amber-800",
  rh: "bg-rose-100 text-rose-700",
};

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((item) => item.key);

export const VIEW_PERMISSIONS: Permission[] = PERMISSIONS.filter((item) => item.view).map(
  (item) => item.key
);

// Quem edita precisa ver
const REQUIRES: Partial<Record<Permission, Permission>> = {
  "equipe.editar": "equipe.ver",
  "escalas.editar": "escalas.ver",
  "trocas.registrar": "trocas.ver",
  "remanejos.registrar": "remanejos.ver",
  "conflitos.lancar": "conflitos.ver",
};

// Padrão de cada perfil (a tabela combinada)
export const DEFAULT_PROFILE_PERMISSIONS: Record<ProfileKey, Permission[]> = {
  admin: ALL_PERMISSIONS,
  diretoria: VIEW_PERMISSIONS,
  gerencia: [
    "dashboard.ver",
    "equipe.ver",
    "escalas.ver",
    "escalas.editar",
    "trocas.ver",
    "trocas.registrar",
    "remanejos.ver",
    "remanejos.registrar",
    "conflitos.ver",
  ],
  horizontal: [
    "dashboard.ver",
    "equipe.ver",
    "escalas.ver",
    "escalas.editar",
    "trocas.ver",
    "remanejos.ver",
    "remanejos.registrar",
    "conflitos.ver",
  ],
  rh: [
    "dashboard.ver",
    "equipe.ver",
    "equipe.editar",
    "escalas.ver",
    "trocas.ver",
    "trocas.registrar",
    "remanejos.ver",
    "remanejos.registrar",
    "conflitos.ver",
    "conflitos.lancar",
  ],
};

// Ajusta uma lista: administrador tem tudo, Diretoria só visualiza, quem edita precisa ver
export const normalizePermissions = (profile: ProfileKey, permissions: Permission[]) => {
  if (profile === "admin") return ALL_PERMISSIONS;

  let result = new Set<Permission>(permissions);

  if (profile === "diretoria") {
    result = new Set(Array.from(result).filter((item) => VIEW_PERMISSIONS.includes(item)));
  }

  Array.from(result).forEach((item) => {
    const needed = REQUIRES[item];

    if (needed) result.add(needed);
  });

  return ALL_PERMISSIONS.filter((item) => result.has(item));
};

// Permissão que o perfil não pode mudar
export const isLockedPermission = (profile: ProfileKey, key: Permission) =>
  profile === "admin" || (profile === "diretoria" && !VIEW_PERMISSIONS.includes(key));

// Marca ou desmarca uma permissão, mantendo as dependências
export const togglePermission = (
  profile: ProfileKey,
  permissions: Permission[],
  key: Permission
) => {
  if (isLockedPermission(profile, key)) return permissions;

  if (permissions.includes(key)) {
    // tirar uma permissão tira também as que dependem dela
    return permissions.filter((item) => item !== key && REQUIRES[item] !== key);
  }

  return normalizePermissions(profile, [...permissions, key]);
};