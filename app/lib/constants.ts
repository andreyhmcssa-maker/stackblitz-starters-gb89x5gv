import type {
  Collaborator,
  CollaboratorForm,
  Journey,
  JourneyForm,
} from "./types";

export const currentUser = "Administrador";

export const menuItems = [
  { icon: "📊", label: "Dashboard" },
  { icon: "👥", label: "Equipe" },
  { icon: "📅", label: "Escalas" },
  { icon: "🔄", label: "Trocas" },
  { icon: "🔀", label: "Remanejos" },
  { icon: "⚠️", label: "Conflitos" },
];

export const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const emptyWeek = ["", "", "", "", "", "", ""];

export const emptyJourney: JourneyForm = {
  name: "",
  shift: "Diurno",
  type: "ciclo",
  workDays: 1,
  offDays: 1,
  days: emptyWeek,
};

export const defaultJourneys: Journey[] = [
  { id: 1, name: "12x36 Diurno", shift: "Diurno", type: "ciclo", workDays: 1, offDays: 1, days: emptyWeek, active: true },
  { id: 2, name: "12x36 Noturno", shift: "Noturno", type: "ciclo", workDays: 1, offDays: 1, days: emptyWeek, active: true },
  { id: 3, name: "12x60 Diurno", shift: "Diurno", type: "ciclo", workDays: 1, offDays: 2, days: emptyWeek, active: true },
  { id: 4, name: "12x60 Noturno", shift: "Noturno", type: "ciclo", workDays: 1, offDays: 2, days: emptyWeek, active: true },
  { id: 5, name: "12x70 Diurno", shift: "Diurno", type: "ciclo", workDays: 1, offDays: 2, days: emptyWeek, active: true },
  { id: 6, name: "12x70 Noturno", shift: "Noturno", type: "ciclo", workDays: 1, offDays: 2, days: emptyWeek, active: true },
  { id: 7, name: "Diarista 5x2", shift: "Diurno", type: "semanal", workDays: 5, offDays: 2, days: ["T", "T", "T", "T", "T", "F", "F"], active: true },
];

export const emptyCollaborator: CollaboratorForm = {
  registration: "",
  name: "",
  role: "Técnico de Enfermagem",
  contract: "",
  sector: "",
  journey: "12x36 Diurno",
  journeyStart: "",
  corenNumber: "",
  corenExpiry: "",
  birthDate: "",
  admissionDate: "",
};

export const defaultRoles = [
  "Técnico de Enfermagem",
  "Enfermeiro",
  "Administrativo",
];

export const defaultCollaborators: Collaborator[] = [
  {
    id: 1,
    registration: "1001",
    name: "João Silva",
    role: "Técnico de Enfermagem",
    sector: "UTI",
    journey: "12x36 Diurno",
    corenNumber: "",
    corenExpiry: "",
    birthDate: "",
    admissionDate: "",
  },
  {
    id: 2,
    registration: "1002",
    name: "Maria Souza",
    role: "Enfermeiro",
    sector: "UTI",
    journey: "12x36 Noturno",
    corenNumber: "",
    corenExpiry: "",
    birthDate: "",
    admissionDate: "",
  },
  {
    id: 3,
    registration: "1003",
    name: "Pedro Santos",
    role: "Técnico de Enfermagem",
    sector: "Enfermaria",
    journey: "12x36 Diurno",
    corenNumber: "",
    corenExpiry: "",
    birthDate: "",
    admissionDate: "",
  },
  {
    id: 4,
    registration: "1004",
    name: "Ana Oliveira",
    role: "Enfermeiro",
    sector: "Enfermaria",
    journey: "12x36 Noturno",
    corenNumber: "",
    corenExpiry: "",
    birthDate: "",
    admissionDate: "",
  },
];