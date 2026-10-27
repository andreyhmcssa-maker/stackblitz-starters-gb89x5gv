import type { Collaborator } from "./types";

type Reader = (person: Collaborator, dateIso: string) => string;

export type LeaveItem = {
  person: Collaborator;
  start: string; // primeiro dia do período (AAAA-MM-DD)
  end: string; // último dia do período
  days: number;
};

export type Leaves = {
  onVacation: LeaveItem[]; // de férias hoje
  upcomingVacation: LeaveItem[]; // férias que começam nos próximos dias
  onSick: LeaveItem[]; // de atestado hoje
  enteredSick: LeaveItem[]; // atestados que começaram nos últimos dias
};

// Janelas dos cards
export const UPCOMING_VACATION_DAYS = 30;
export const RECENT_SICK_DAYS = 7;

const DAY = 86400000;
const MAX_SPAN = 400;

const addDays = (iso: string, amount: number) =>
  new Date(Date.parse(iso) + amount * DAY).toISOString().slice(0, 10);

// Período seguido com o mesmo código ao redor de uma data (ex.: todos os dias de FE)
const runAround = (
  person: Collaborator,
  dateIso: string,
  code: string,
  getShiftOn: Reader
) => {
  let start = dateIso;
  let end = dateIso;

  for (let i = 0; i < MAX_SPAN; i++) {
    const previous = addDays(start, -1);

    if (getShiftOn(person, previous) !== code) break;
    start = previous;
  }

  for (let i = 0; i < MAX_SPAN; i++) {
    const next = addDays(end, 1);

    if (getShiftOn(person, next) !== code) break;
    end = next;
  }

  return {
    start,
    end,
    days: Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1,
  };
};

const byName = (a: LeaveItem, b: LeaveItem) =>
  a.person.name.localeCompare(b.person.name, "pt-BR");

// Lê a escala de verdade (lançamentos de Conflitos e códigos lançados na escala padrão)
export const computeLeaves = (
  people: Collaborator[],
  today: string,
  getShiftOn: Reader
): Leaves => {
  const leaves: Leaves = {
    onVacation: [],
    upcomingVacation: [],
    onSick: [],
    enteredSick: [],
  };

  people.forEach((person) => {
    const codeToday = getShiftOn(person, today);

    if (codeToday === "FE") {
      leaves.onVacation.push({
        person,
        ...runAround(person, today, "FE", getShiftOn),
      });
    }

    if (codeToday === "ATE") {
      leaves.onSick.push({
        person,
        ...runAround(person, today, "ATE", getShiftOn),
      });
    }

    // férias que começam nos próximos dias
    for (let i = 1; i <= UPCOMING_VACATION_DAYS; i++) {
      const date = addDays(today, i);

      if (
        getShiftOn(person, date) === "FE" &&
        getShiftOn(person, addDays(date, -1)) !== "FE"
      ) {
        leaves.upcomingVacation.push({
          person,
          ...runAround(person, date, "FE", getShiftOn),
        });
        break;
      }
    }

    // atestados que começaram nos últimos dias (hoje incluído), mesmo que já tenham terminado
    for (let i = RECENT_SICK_DAYS - 1; i >= 0; i--) {
      const date = addDays(today, -i);

      if (
        getShiftOn(person, date) === "ATE" &&
        getShiftOn(person, addDays(date, -1)) !== "ATE"
      ) {
        leaves.enteredSick.push({
          person,
          ...runAround(person, date, "ATE", getShiftOn),
        });
        break;
      }
    }
  });

  leaves.onVacation.sort(byName);
  leaves.upcomingVacation.sort(byName);
  leaves.onSick.sort(byName);
  leaves.enteredSick.sort(byName);

  return leaves;
};