import type { Collaborator, Relocation } from "./types";
import { formatSwapDate, shiftParts, swapShiftName } from "./swaps";

export type RelocationKind = Relocation["kind"];

type Reader = (person: Collaborator, dateIso: string) => string;

type Op = { date: string; shift: string; op: "add" | "remove"; paying: boolean };

// Turno do pagamento (remanejos antigos, sem turno próprio, usam o turno do remanejo)
export const getPayShift = (relocation: Relocation) =>
  relocation.payShift || relocation.shift;

// O que o remanejo faz na escala: no dia do remanejo e (se já tiver) no dia do pagamento
//   casa pediu:        remanejo = trabalha · pagamento = folga
//   colaborador pediu: remanejo = folga    · pagamento = trabalha
export const getRelocationOps = (relocation: Relocation): Op[] => {
  const casa = relocation.kind === "casa";

  const ops: Op[] = [
    {
      date: relocation.date,
      shift: relocation.shift,
      op: casa ? "add" : "remove",
      paying: false,
    },
  ];

  if (relocation.payDate) {
    ops.push({
      date: relocation.payDate,
      shift: getPayShift(relocation),
      op: casa ? "remove" : "add",
      paying: true,
    });
  }

  return ops;
};

// Aplica os remanejos sobre o código do dia (D, N, D/N, F...) e devolve o código final
export const applyRelocations = (
  code: string,
  personId: number,
  dateIso: string,
  relocations: Relocation[]
) => {
  let parts = shiftParts(code);
  let changed = false;

  relocations.forEach((relocation) => {
    if (relocation.personId !== personId) return;

    getRelocationOps(relocation).forEach((item) => {
      if (item.date !== dateIso) return;

      if (item.op === "add" && !parts.includes(item.shift)) {
        parts = [...parts, item.shift];
        changed = true;
      }

      if (item.op === "remove" && parts.includes(item.shift)) {
        parts = parts.filter((part) => part !== item.shift);
        changed = true;
      }
    });
  });

  if (!changed) return code;

  // ficou sem nenhum plantão: folga
  if (parts.length === 0) return "F";

  return ["D", "N"].filter((part) => parts.includes(part)).join("/");
};

// Textos do remanejo para o balão ao passar o mouse
export const getRelocationNotes = (
  personId: number,
  dateIso: string,
  relocations: Relocation[]
) => {
  const notes: string[] = [];

  relocations.forEach((relocation) => {
    if (relocation.personId !== personId) return;

    const casa = relocation.kind === "casa";
    const turno = swapShiftName[relocation.shift];
    const payTurno = swapShiftName[getPayShift(relocation)];

    getRelocationOps(relocation).forEach((item) => {
      if (item.date !== dateIso) return;

      const lines = [`↻ Remanejo — ${casa ? "a casa pediu" : "o colaborador pediu"}`];

      if (!item.paying) {
        lines.push(
          casa
            ? `Neste dia: veio trabalhar o plantão ${turno}, a pedido da casa.`
            : `Neste dia: folgou do plantão ${turno}, a pedido do colaborador.`
        );

        lines.push(
          relocation.payDate
            ? casa
              ? `Pagamento: folga do plantão ${payTurno} em ${formatSwapDate(relocation.payDate)}.`
              : `Pagamento: trabalha o plantão ${payTurno} em ${formatSwapDate(relocation.payDate)}.`
            : "Pagamento: ainda sem data."
        );
      } else {
        lines.push(
          casa
            ? `Neste dia: folga do plantão ${payTurno}, pagando o remanejo de ${formatSwapDate(relocation.date)} (plantão ${turno}).`
            : `Neste dia: trabalha o plantão ${payTurno}, pagando a folga de ${formatSwapDate(relocation.date)} (plantão ${turno}).`
        );
      }

      notes.push(lines.join("\n"));
    });
  });

  return notes;
};

// ───────────── VALIDAÇÕES ─────────────

const BLOCKED = ["FA", "ATE", "FE"];

// A pessoa vai TRABALHAR o plantão nessa data: pode?
const workProblem = (
  person: Collaborator,
  date: string,
  shift: string,
  getShiftOn: Reader
) => {
  if (person.terminationDate && date > person.terminationDate) {
    return `${person.name} já estava desligado(a) em ${formatSwapDate(date)}.`;
  }

  const code = getShiftOn(person, date);

  if (BLOCKED.includes(code)) {
    return `${person.name} está com ${code} em ${formatSwapDate(date)} e não pode trabalhar nesse dia.`;
  }

  if (shiftParts(code).includes(shift)) {
    return `${person.name} já trabalha o plantão ${swapShiftName[shift]} de ${formatSwapDate(date)}.`;
  }

  return "";
};

// A pessoa vai FOLGAR do plantão nessa data: ela trabalha nele?
const offProblem = (
  person: Collaborator,
  date: string,
  shift: string,
  getShiftOn: Reader
) =>
  shiftParts(getShiftOn(person, date)).includes(shift)
    ? ""
    : `${person.name} não trabalha o plantão ${swapShiftName[shift]} em ${formatSwapDate(date)}, então não há o que folgar.`;

// Valida só o pagamento ("" = sem data, sempre pode)
export const checkPayment = (
  person: Collaborator,
  kind: RelocationKind,
  date: string,
  payDate: string,
  payShift: string,
  getShiftOn: Reader
) => {
  if (!payDate) return "";

  if (payDate === date) {
    return "A data do pagamento não pode ser o mesmo dia do remanejo.";
  }

  return kind === "casa"
    ? offProblem(person, payDate, payShift, getShiftOn)
    : workProblem(person, payDate, payShift, getShiftOn);
};

// Valida o remanejo inteiro ("" = tudo certo)
export const checkRelocation = (
  person: Collaborator | undefined,
  kind: RelocationKind,
  date: string,
  shift: string,
  payDate: string,
  payShift: string,
  getShiftOn: Reader
) => {
  if (!person) return "Escolha o colaborador.";
  if (!date) return "Informe a data do remanejo.";

  const main =
    kind === "casa"
      ? workProblem(person, date, shift, getShiftOn)
      : offProblem(person, date, shift, getShiftOn);

  return main || checkPayment(person, kind, date, payDate, payShift, getShiftOn);
};

// ───────────── CAMINHO PARA A ABA CONFLITOS ─────────────
// "Eu devo": a casa pediu e deve uma folga · "Me deve": o colaborador pediu e deve um plantão
export const getDebts = (relocations: Relocation[]) => ({
  iOwe: relocations.filter((relocation) => relocation.kind === "casa"),
  owedToMe: relocations.filter((relocation) => relocation.kind === "colaborador"),
});

// ───────────── SITUAÇÃO DO PAGAMENTO ─────────────

// Hoje no formato AAAA-MM-DD (pelo relógio do computador)
export const todayIso = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export type DebtStatus = "sem-data" | "agendado" | "quitado";

// Sem data, agendado (data no futuro) ou quitado (a data de pagamento chegou)
export const getDebtStatus = (relocation: Relocation, today: string): DebtStatus => {
  if (!relocation.payDate) return "sem-data";

  return relocation.payDate <= today ? "quitado" : "agendado";
};

export const debtStatusLabel: Record<DebtStatus, string> = {
  "sem-data": "Sem data",
  agendado: "Agendado",
  quitado: "Quitado",
};

export const debtStatusStyle: Record<DebtStatus, string> = {
  "sem-data": "bg-amber-100 text-amber-800",
  agendado: "bg-sky-100 text-sky-800",
  quitado: "bg-emerald-100 text-emerald-700",
};