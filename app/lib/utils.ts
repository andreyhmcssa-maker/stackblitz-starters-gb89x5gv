import type { Collaborator, Journey, JourneyAssignment } from "./types";

export const formatDate = (date: string) => {
  if (!date) return "Não informado";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const toUtc = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((toUtc(toIso) - toUtc(fromIso)) / 86400000);

export const getHistory = (person: Collaborator): JourneyAssignment[] =>
  person.journeyHistory && person.journeyHistory.length > 0
    ? person.journeyHistory
    : [{ journey: person.journey, startDate: "" }];

const getAssignmentOn = (person: Collaborator, dateIso: string) => {
  let found: JourneyAssignment | null = null;

  for (const item of getHistory(person)) {
    if (item.startDate && item.startDate <= dateIso) {
      found = item;
    }
  }

  return found;
};

export const getAutoShift = (
  person: Collaborator,
  dateIso: string,
  journeys: Journey[]
) => {
  const assignment = getAssignmentOn(person, dateIso);

  if (!assignment) return "";

  const journey = journeys.find((item) => item.name === assignment.journey);

  if (!journey) return "";

  const workLetter = journey.shift === "Noturno" ? "N" : "D";

  if (journey.type === "semanal") {
    const weekday = (new Date(toUtc(dateIso)).getUTCDay() + 6) % 7;

    if (journey.days[weekday] === "T") return workLetter;
    if (journey.days[weekday] === "F") return "F";
    return "";
  }

  const cycle = journey.workDays + journey.offDays;

  if (cycle <= 0) return "";

  const position = daysBetween(assignment.startDate, dateIso) % cycle;

  return position < journey.workDays ? workLetter : "F";
};

export const getJourneyNotice = (person: Collaborator, dateIso: string) => {
  const history = getHistory(person);
  const index = history.findIndex((item) => item.startDate === dateIso);

  if (index === -1) return null;

  if (index === 0) {
    return `Início da escala: ${history[0].journey}`;
  }

  if (history[index - 1].journey === history[index].journey) {
    return `Reinício do ciclo: ${history[index].journey}`;
  }

  return `Troca de jornada: ${history[index - 1].journey} → ${history[index].journey}`;
};

export const previousDay = (iso: string) => {
  if (!iso) return "";

  const [year, month, day] = iso.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
};

const weekdayNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export const getWeekdayShort = (iso: string) =>
  weekdayNames[new Date(toUtc(iso)).getUTCDay()];

  export const shortName = (name: string) => {
    const parts = name.trim().split(/\s+/);
  
    if (parts.length <= 1) return parts[0] ?? "";
  
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  export const todayIso = () => {
    const now = new Date();
  
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };