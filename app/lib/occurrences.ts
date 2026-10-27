import type { Occurrence } from "./types";
import { formatSwapDate } from "./swaps";

export type OccurrenceKind = Occurrence["kind"];

export const occurrenceLabel: Record<OccurrenceKind, string> = {
  ATE: "Atestado",
  FE: "Férias",
  FA: "Falta",
  FJ: "Folga com justificativa",
  FT: "Folga TRE",
};

// Código que a pessoa mostra na escala nos dias do lançamento
export const occurrenceCode: Record<OccurrenceKind, string> = {
  ATE: "ATE",
  FE: "FE",
  FA: "FA",
  FJ: "F",
  FT: "F",
};

export const occurrenceStyle: Record<OccurrenceKind, string> = {
  ATE: "bg-purple-100 text-purple-700",
  FE: "bg-emerald-100 text-emerald-700",
  FA: "bg-red-100 text-red-700",
  FJ: "bg-amber-100 text-amber-800",
  FT: "bg-teal-100 text-teal-800",
};

// Tipos que são folga com justificativa (F destacada na escala)
export const isOffKind = (kind: OccurrenceKind) => kind === "FJ" || kind === "FT";

export const MAX_OCCURRENCE_DAYS = 366;

// Lista as datas de from até to (inclusive)
export const listPeriod = (from: string, to: string) => {
  const [year, month, day] = from.split("-").map(Number);
  const dates: string[] = [];

  for (let i = 0; i <= MAX_OCCURRENCE_DAYS; i++) {
    const iso = new Date(Date.UTC(year, month - 1, day + i))
      .toISOString()
      .slice(0, 10);

    if (iso > to) break;
    dates.push(iso);
  }

  return dates;
};

const DAY = 86400000;

// Texto do período: seguido ("09/10/2026 a 15/10/2026 · 7 dias") ou dias soltos
export const describeDates = (dates: string[]) => {
  if (dates.length === 0) return "";

  const first = dates[0];
  const last = dates[dates.length - 1];
  const span = Math.round((Date.parse(last) - Date.parse(first)) / DAY) + 1;
  const count = `${dates.length} ${dates.length === 1 ? "dia" : "dias"}`;

  if (span === dates.length) {
    return dates.length === 1
      ? `${formatSwapDate(first)} · ${count}`
      : `${formatSwapDate(first)} a ${formatSwapDate(last)} · ${count}`;
  }

  return `${dates.map(formatSwapDate).join(", ")} · ${count}`;
};

// Lançamento da pessoa que cobre esse dia (undefined = nenhum)
export const findOccurrence = (
  occurrences: Occurrence[],
  personId: number,
  dateIso: string
) =>
  occurrences.find(
    (item) => item.personId === personId && item.dates.includes(dateIso)
  );

// O lançamento vale mais que o resto: nos dias dele a pessoa mostra o código do lançamento
export const applyOccurrences = (
  code: string,
  personId: number,
  dateIso: string,
  occurrences: Occurrence[]
) => {
  const item = findOccurrence(occurrences, personId, dateIso);

  return item ? occurrenceCode[item.kind] : code;
};

// Folga com justificativa ou folga TRE (para destacar o F na escala)
export const isJustifiedOff = (
  personId: number,
  dateIso: string,
  occurrences: Occurrence[]
) => {
  const item = findOccurrence(occurrences, personId, dateIso);

  return item ? isOffKind(item.kind) : false;
};

// Texto do lançamento para o balão ao passar o mouse
export const getOccurrenceNotes = (
  personId: number,
  dateIso: string,
  occurrences: Occurrence[]
) => {
  const item = findOccurrence(occurrences, personId, dateIso);

  if (!item) return [];

  const lines = [`✎ ${occurrenceLabel[item.kind]}`, describeDates(item.dates)];

  if (item.note) {
    lines.push(`${isOffKind(item.kind) ? "Justificativa" : "Observação"}: ${item.note}`);
  }

  return [lines.join("\n")];
};