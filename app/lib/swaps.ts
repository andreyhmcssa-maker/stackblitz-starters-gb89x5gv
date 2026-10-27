import type { Swap } from "./types";

export const swapShiftName: Record<string, string> = { D: "Dia", N: "Noite" };

// AAAA-MM-DD → DD/MM/AAAA
export const formatSwapDate = (iso: string) => iso.split("-").reverse().join("/");

// "D/N" → ["D","N"]; "D" → ["D"]; qualquer outro código → []
export const shiftParts = (code: string): string[] =>
  code === "D/N" ? ["D", "N"] : code === "D" || code === "N" ? [code] : [];

// Quantos plantões o código vale (D/N = 2)
export const countShifts = (code: string) => shiftParts(code).length;

// Mês (AAAA-MM) em que a pessoa trabalha por causa da troca: o do plantão que ela assume
export const swapMonthFor = (swap: Swap, personId: number) =>
  getSwapSide(swap, personId)?.takes.date.slice(0, 7) ?? "";

// A troca aparece no mês se alguma das duas pessoas assume plantão nele
export const swapInMonth = (swap: Swap, monthKey: string) =>
  swap.firstDate.slice(0, 7) === monthKey || swap.secondDate.slice(0, 7) === monthKey;

// O que a pessoa passa e o que ela assume nessa troca (null = ela não participa)
export const getSwapSide = (swap: Swap, personId: number) => {
  if (swap.firstId === personId) {
    return {
      gives: { date: swap.firstDate, shift: swap.firstShift },
      takes: { date: swap.secondDate, shift: swap.secondShift },
      otherId: swap.secondId,
    };
  }

  if (swap.secondId === personId) {
    return {
      gives: { date: swap.secondDate, shift: swap.secondShift },
      takes: { date: swap.firstDate, shift: swap.firstShift },
      otherId: swap.firstId,
    };
  }

  return null;
};

// Aplica as trocas sobre o código do dia (D, N, F...) e devolve o código final
export const applySwaps = (
  code: string,
  personId: number,
  dateIso: string,
  swaps: Swap[]
) => {
  const original = shiftParts(code);
  let parts = [...original];
  let changed = false;

  swaps.forEach((swap) => {
    const side = getSwapSide(swap, personId);

    if (!side) return;

    if (side.gives.date === dateIso) {
      parts = parts.filter((part) => part !== side.gives.shift);
      changed = true;
    }

    if (side.takes.date === dateIso && !parts.includes(side.takes.shift)) {
      parts.push(side.takes.shift);
      changed = true;
    }
  });

  if (!changed) return code;

  // passou o plantão e ficou sem nenhum: folga
  if (parts.length === 0) return original.length > 0 ? "F" : code;

  return ["D", "N"].filter((part) => parts.includes(part)).join("/");
};

// Textos da troca para o balão ao passar o mouse
export const getSwapNotes = (
  personId: number,
  dateIso: string,
  swaps: Swap[],
  nameOf: (id: number) => string
) => {
  const notes: string[] = [];

  swaps.forEach((swap) => {
    const side = getSwapSide(swap, personId);

    if (!side) return;
    if (side.gives.date !== dateIso && side.takes.date !== dateIso) return;

    const other = nameOf(side.otherId);

    const takesText = `assumiu o plantão ${swapShiftName[side.takes.shift]} de ${formatSwapDate(side.takes.date)}, que era de ${other}`;
    const givesText = `passou o plantão ${swapShiftName[side.gives.shift]} de ${formatSwapDate(side.gives.date)} para ${other}`;

    const thisDay = side.takes.date === dateIso ? takesText : givesText;
    const inReturn = side.takes.date === dateIso ? givesText : takesText;

    notes.push(`⇄ Troca com ${other}\nNeste dia: ${thisDay}.\nEm troca: ${inReturn}.`);
  });

  return notes;
};