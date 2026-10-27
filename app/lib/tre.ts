import type { Occurrence, TreCredit } from "./types";

// Atalhos de quantidade ao cadastrar o saldo
export const TRE_PRESETS = [
  { value: 4, label: "4 · 1 turno" },
  { value: 6, label: "6 · 2 turnos" },
  { value: 8, label: "8 · presidente" },
];

// Folgas já usadas desse saldo: soma dos dias dos lançamentos ligados a ele
export const creditUsed = (credit: TreCredit, occurrences: Occurrence[]) =>
  occurrences
    .filter((item) => item.creditId === credit.id)
    .reduce((total, item) => total + item.dates.length, 0);

// Folgas que ainda restam
export const creditBalance = (credit: TreCredit, occurrences: Occurrence[]) =>
  credit.granted - creditUsed(credit, occurrences);