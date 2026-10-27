import type { Collaborator } from "./types";
import { daysUntil } from "./holidays";

// COREN que vence nos próximos dias entra no aviso
export const COREN_WARNING_DAYS = 60;

export type BirthdayItem = {
  person: Collaborator;
  day: number; // dia do aniversário no mês
  turning: number; // idade que faz (ou fez) este ano
  daysLeft: number; // dias até o aniversário (0 = hoje, negativo = já passou)
  isToday: boolean;
};

// Aniversariantes do mês de hoje, em ordem de dia
export const getBirthdays = (people: Collaborator[], today: string): BirthdayItem[] => {
  const [year, month, dayNow] = today.split("-").map(Number);

  return people
    .filter((person) => person.birthDate && Number(person.birthDate.slice(5, 7)) === month)
    .map((person) => {
      const day = Number(person.birthDate.slice(8, 10));

      return {
        person,
        day,
        turning: year - Number(person.birthDate.slice(0, 4)),
        daysLeft: day - dayNow,
        isToday: day === dayNow,
      };
    })
    .sort(
      (a, b) =>
        a.day - b.day || a.person.name.localeCompare(b.person.name, "pt-BR")
    );
};

export type CorenItem = {
  person: Collaborator;
  expiry: string; // AAAA-MM-DD
  days: number; // dias até vencer (negativo = já venceu)
};

// COREN vencido ou que vence nos próximos dias, dos mais urgentes para os menos urgentes
export const getCorenAlerts = (people: Collaborator[], today: string) => {
  const items: CorenItem[] = people
    .filter((person) => person.corenExpiry)
    .map((person) => ({
      person,
      expiry: person.corenExpiry,
      days: daysUntil(person.corenExpiry, today),
    }))
    .filter((item) => item.days <= COREN_WARNING_DAYS)
    .sort(
      (a, b) =>
        a.days - b.days || a.person.name.localeCompare(b.person.name, "pt-BR")
    );

  return {
    items,
    expired: items.filter((item) => item.days < 0).length,
    expiring: items.filter((item) => item.days >= 0).length,
  };
};