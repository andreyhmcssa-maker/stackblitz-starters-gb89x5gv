import type { Holiday } from "./types";
import { shiftParts } from "./swaps";

// Feriados que chegam nos próximos dias aparecem em destaque
export const UPCOMING_DAYS = 30;

const DAY = 86400000;

// Quantos dias faltam até a data (0 = hoje, negativo = já passou)
export const daysUntil = (dateIso: string, today: string) =>
  Math.round((Date.parse(dateIso) - Date.parse(today)) / DAY);

// Feriado que vale para essa função nesse dia (undefined = nenhum)
export const findHoliday = (holidays: Holiday[], role: string, dateIso: string) =>
  holidays.find((item) => item.date === dateIso && item.roles.includes(role));

// No feriado, quem tem a função selecionada e trabalharia (D, N, D/N) folga
export const applyHolidays = (
  code: string,
  role: string,
  dateIso: string,
  holidays: Holiday[]
) =>
  shiftParts(code).length > 0 && findHoliday(holidays, role, dateIso) ? "F" : code;

// Texto do feriado para o balão ao passar o mouse
export const getHolidayNotes = (role: string, dateIso: string, holidays: Holiday[]) => {
  const item = findHoliday(holidays, role, dateIso);

  return item
    ? [`★ Feriado — ${item.name}\nA escala desta função folga neste dia.`]
    : [];
};

// Quantos feriados chegam nos próximos dias (para o número no título da aba)
export const countUpcomingHolidays = (holidays: Holiday[], today: string) =>
  holidays.filter((item) => {
    const days = daysUntil(item.date, today);

    return days >= 0 && days <= UPCOMING_DAYS;
  }).length;

// Páscoa (algoritmo de Meeus/Jones/Butcher)
const easter = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);

  return {
    month: Math.floor((h + l - 7 * m + 114) / 31),
    day: ((h + l - 7 * m + 114) % 31) + 1,
  };
};

// Sugestão: feriados nacionais do ano (você pode editar a lista antes de lançar)
export const suggestNationalHolidays = (year: number) => {
  const fixed: [string, string][] = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["11-20", "Consciência Negra"],
    ["12-25", "Natal"],
  ];

  const { month, day } = easter(year);

  const goodFriday = new Date(Date.UTC(year, month - 1, day - 2))
    .toISOString()
    .slice(0, 10);

  return [
    ...fixed.map(([monthDay, name]) => ({ date: `${year}-${monthDay}`, name })),
    { date: goodFriday, name: "Sexta-feira Santa" },
  ].sort((a, b) => a.date.localeCompare(b.date));
};