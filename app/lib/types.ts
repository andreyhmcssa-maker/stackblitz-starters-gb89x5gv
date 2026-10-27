export type JourneyAssignment = {
  journey: string;
  startDate: string;
};

export type TerminationNote = {
  id: number;
  text: string;
  author: string;
  createdAt: string;
};

export type Collaborator = {
  id: number;
  registration: string;
  name: string;
  role: string;
  contract?: string;
  sector: string;
  journey: string;
  corenNumber: string;
  corenExpiry: string;
  birthDate: string;
  admissionDate: string;
  terminationDate?: string;
  terminationNotes?: TerminationNote[];
  journeyHistory?: JourneyAssignment[];
};

export type Journey = {
  id: number;
  name: string;
  shift: string;
  type: string;
  workDays: number;
  offDays: number;
  days: string[];
  active: boolean;
};

export type CollaboratorForm = {
  registration: string;
  name: string;
  role: string;
  contract: string;
  sector: string;
  journey: string;
  journeyStart: string;
  corenNumber: string;
  corenExpiry: string;
  birthDate: string;
  admissionDate: string;
};

export type JourneyForm = {
  name: string;
  shift: string;
  type: string;
  workDays: number;
  offDays: number;
  days: string[];
};

export type Fixation = {
  id: number;
  personId: number;
  sector: string;
  startDate: string;
  endDate: string; // "" = por tempo indeterminado
};

export type FixationForm = {
  id: number | null; // null = nova fixação; número = editando uma existente
  personId: number;
  personName: string;
  role: string;
  sector: string;
  startDate: string;
  endDate: string;
  indefinite: boolean;
};

export type Adjustment = {
  id: number;
  personId: number;
  dateIso: string;
  sector: string;
};

export type Swap = {
  id: number;
  firstId: number; // 1º colaborador
  secondId: number; // 2º colaborador
  firstDate: string; // plantão do 1º que passa para o 2º
  firstShift: string; // "D" ou "N"
  secondDate: string; // plantão do 2º que passa para o 1º
  secondShift: string; // "D" ou "N"
  createdAt: string;
};

export type SwapInput = Omit<Swap, "id" | "createdAt">;

export type Relocation = {
  id: number;
  personId: number;
  kind: "casa" | "colaborador"; // casa = a casa pediu ("Eu devo") · colaborador = ele pediu ("Me deve")
  date: string; // dia do remanejo
  shift: string; // "D" ou "N"
  payDate: string; // dia do pagamento ("" = ainda sem data)
  payShift?: string; // turno do pagamento ("D" ou "N"); sem valor = o mesmo turno do remanejo
  createdAt: string;
};

export type RelocationInput = Omit<Relocation, "id" | "createdAt">;

export type Occurrence = {
  id: number;
  personId: number;
  kind: "ATE" | "FE" | "FA" | "FJ" | "FT"; // FJ = folga com justificativa · FT = folga TRE (desconta do saldo)
  creditId?: number; // folga TRE: de qual saldo sai
  dates: string[]; // dias do lançamento, em ordem (AAAA-MM-DD)
  note: string; // observação (na folga com justificativa é obrigatória)
  createdAt: string;
};

export type OccurrenceInput = Omit<Occurrence, "id" | "createdAt">;

export type TreCredit = {
  id: number;
  personId: number;
  election: string; // ex.: "Eleição 2020"
  granted: number; // folgas ganhas nessa eleição
  createdAt: string;
};

export type TreCreditInput = Omit<TreCredit, "id" | "createdAt">;

export type Holiday = {
  id: number;
  name: string;
  date: string; // AAAA-MM-DD
  roles: string[]; // funções que folgam nesse dia
  sectorId: number; // setor do feriado (cada setor tem os seus)
  createdAt: string;
};

export type HolidayInput = Omit<Holiday, "id" | "createdAt" | "sectorId">;

export type Sector = {
  id: number;
  name: string;
  active: boolean;
};

export type ProfileKey = "admin" | "diretoria" | "gerencia" | "horizontal" | "rh";

export type Permission =
  | "dashboard.ver"
  | "equipe.ver"
  | "equipe.editar"
  | "escalas.ver"
  | "escalas.editar"
  | "trocas.ver"
  | "trocas.registrar"
  | "remanejos.ver"
  | "remanejos.registrar"
  | "conflitos.ver"
  | "conflitos.lancar";

export type Access = {
  id: string; // identificador do usuário no Supabase
  name: string;
  email: string;
  profile: ProfileKey;
  sectorIds: number[]; // setores pelos quais responde (administrador: vazio = todos)
  permissions: Permission[];
  active: boolean;
  createdAt: string;
};

export type AccessInput = Omit<Access, "id" | "active" | "createdAt">;

export type LayoutPost = {
  id: number;
  label: string; // nome do posto (ex.: SALA VERMELHA)
  slots: number; // vagas (linhas) do posto
  rotation: boolean; // entra no rodízio?
  day: boolean; // existe no plantão diurno?
  night: boolean; // existe no plantão noturno?
};

// Função com posto fixo dentro dos blocos de outra função
export type LayoutHome = { role: string; post: string };

export type LayoutRole = {
  role: string; // função que monta os blocos
  title: string; // nome no título do bloco (ex.: "Técnicos de Enfermagem")
  posts: LayoutPost[];
  spill: string; // posto que recebe a sobra ("" = nenhum)
  homes: LayoutHome[];
};

export type SectorLayout = {
  sectorId: number;
  rotationStart: string; // AAAA-MM-DD
  roles: LayoutRole[];
};