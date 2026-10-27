import type { Adjustment, Collaborator, Fixation } from "./types";
import type { SectorRow } from "./sectorLayout";
import { ROTATION_START } from "./sectorLayout";

// Posto que recebe só a sobra, se o layout não disser outro
const DEFAULT_SPILL = "APOIO";

export type Slot = {
  person: Collaborator;
  fixed: boolean;
  adjusted: boolean;
};

export type DayAssignment = {
  byRow: (Slot | null)[]; // quem está em cada linha (null = vazio)
  extras: Record<string, Slot[]>; // além das vagas do setor (viram linhas EXTRA)
  overflow: Collaborator[]; // não couberam no rodízio (EXCEDENTE)
  total: number; // quantos trabalham no dia
};

// Memória do rodízio de cada pessoa: por onde já passou no ciclo atual e o último setor
type RotationMemory = Map<
  number,
  { visited: Set<string>; last: string | null; apoio: number }
>;

// Fixação que vale para a pessoa nessa data (endDate "" = indeterminada)
export const getActiveFixation = (
  fixations: Fixation[],
  personId: number,
  dateIso: string
) =>
  fixations.find(
    (fixation) =>
      fixation.personId === personId &&
      fixation.startDate <= dateIso &&
      (!fixation.endDate || fixation.endDate >= dateIso)
  );

const nextDay = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
};

// Setores do ciclo do rodízio, sem repetir, na ordem da lista
const getRotationCycle = (rows: SectorRow[]) =>
  Array.from(
    new Set(
      rows
        .filter((row) => row.kind === "posto" && row.rotation)
        .map((row) => row.label)
    )
  );

// Distribui um dia: ajustes do dia → fixados → rodízio
const assignDay = (
  rows: SectorRow[],
  workers: Collaborator[],
  dateIso: string,
  fixations: Fixation[],
  dayAdjustments: Adjustment[],
  homeSectors: Record<string, string>,
  cycle: string[],
  spillSector: string,
  memory: RotationMemory
): DayAssignment => {
  const byRow: (Slot | null)[] = rows.map(() => null);
  const extras: Record<string, Slot[]> = {};
  const overflow: Collaborator[] = [];
  const free: Collaborator[] = [];

  const memoryOf = (person: Collaborator) => {
    let entry = memory.get(person.id);

    if (!entry) {
      entry = { visited: new Set<string>(), last: null, apoio: 0 };
      memory.set(person.id, entry);
    }

    return entry;
  };

  const registerVisit = (person: Collaborator, sector: string) => {
    if (!cycle.includes(sector)) return;

    const entry = memoryOf(person);

    entry.visited.add(sector);
    entry.last = sector;

    // passou por todos os setores: começa um ciclo novo
    if (entry.visited.size >= cycle.length) {
      entry.visited = new Set<string>();
    }
  };

  // Coloca a pessoa numa vaga livre do setor; se lotou, numa vaga EXTRA
  const placeInSector = (
    person: Collaborator,
    sector: string,
    kind: "fixed" | "adjusted" | "home"
  ) => {
    const slot: Slot = {
      person,
      fixed: kind === "fixed",
      adjusted: kind === "adjusted",
    };

    const rowIndex = rows.findIndex(
      (row, index) =>
        row.kind === "posto" && row.label === sector && byRow[index] === null
    );

    if (rowIndex !== -1) {
      byRow[rowIndex] = slot;
      registerVisit(person, sector);
      return true;
    }

    const sectorExists = rows.some(
      (row) => row.kind === "posto" && row.label === sector
    );

    if (!sectorExists) return false;

    extras[sector] = [...(extras[sector] ?? []), slot];
    registerVisit(person, sector);
    return true;
  };

  // 1) AJUSTES DO DIA
  const pending: Collaborator[] = [];

  workers.forEach((person) => {
    const adjustment = dayAdjustments.find((item) => item.personId === person.id);

    if (adjustment && placeInSector(person, adjustment.sector, "adjusted")) return;

    pending.push(person);
  });

  // 2) FIXADOS
  const homePeople: Collaborator[] = [];

  pending.forEach((person) => {
    const fixation = getActiveFixation(fixations, person.id, dateIso);

    if (!fixation) {
      // função com setor próprio (ex.: Assistente Administrativo) não entra no rodízio
      if (homeSectors[person.role]) {
        homePeople.push(person);
        return;
      }

      free.push(person);
      return;
    }

    if (!placeInSector(person, fixation.sector, "fixed")) {
      overflow.push(person);
    }
  });

  // 2b) SETOR PRÓPRIO DA FUNÇÃO (ex.: Assistente Administrativo → APOIO ADMINISTRATIVO)
  homePeople
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((person) => {
      if (!placeInSector(person, homeSectors[person.role], "home")) {
        overflow.push(person);
      }
    });

  // 3) Vagas livres do rodízio, agrupadas por setor
  const freeRows: Record<string, number[]> = {};

  rows.forEach((row, index) => {
    if (row.kind === "posto" && row.rotation && byRow[index] === null) {
      if (!freeRows[row.label]) freeRows[row.label] = [];
      freeRows[row.label].push(index);
    }
  });

  // Ordem de preferência da pessoa: setores do ciclo que ainda faltam, a partir
  // do último em que esteve; depois os que já passou; o último setor só em último caso
  const preferences = (person: Collaborator) => {
    const { visited, last } = memoryOf(person);
    const startAt = last ? cycle.indexOf(last) + 1 : 0;
    const ordered = cycle.map((_, i) => cycle[(startAt + i) % cycle.length]);

    const missing = ordered.filter((sector) => !visited.has(sector) && sector !== last);
    const done = ordered.filter((sector) => visited.has(sector) && sector !== last);

    return [...missing, ...done, ...(last ? [last] : [])];
  };

  const missingCount = (person: Collaborator) => {
    const { visited, last } = memoryOf(person);

    return cycle.filter((sector) => !visited.has(sector) && sector !== last).length;
  };

  // 4) APOIO: só recebe a sobra, depois de preencher os setores do rodízio
  const apoioRows = rows
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row, index }) =>
        row.kind === "posto" && row.label === spillSector && byRow[index] === null
    )
    .map(({ index }) => index);

  const essentialFree = Object.values(freeRows).reduce(
    (total, list) => total + list.length,
    0
  );

  // quantas pessoas passam do número de vagas dos setores do rodízio
  const surplus = Math.max(0, free.length - essentialFree);

  // quem vai para o APOIO é quem foi menos vezes lá (alterna entre as pessoas)
  const apoioList = [...free]
    .sort(
      (a, b) =>
        memoryOf(a).apoio - memoryOf(b).apoio ||
        a.name.localeCompare(b.name, "pt-BR") ||
        a.id - b.id
    )
    .slice(0, surplus);

  const apoioIds = new Set(apoioList.map((person) => person.id));

  apoioList.forEach((person) => {
    const rowIndex = apoioRows.shift();

    if (rowIndex === undefined) {
      overflow.push(person);
      return;
    }

    byRow[rowIndex] = { person, fixed: false, adjusted: false };
    memoryOf(person).apoio += 1;
  });

  // 5) RODÍZIO dos demais: quem tem menos setores faltando escolhe primeiro
  const queue = free
    .filter((person) => !apoioIds.has(person.id))
    .sort(
      (a, b) =>
        missingCount(a) - missingCount(b) ||
        a.name.localeCompare(b.name, "pt-BR") ||
        a.id - b.id
    );

  queue.forEach((person) => {
    const choice = preferences(person).find(
      (sector) => (freeRows[sector]?.length ?? 0) > 0
    );

    if (!choice) {
      overflow.push(person);
      return;
    }

    const rowIndex = freeRows[choice].shift() as number;

    byRow[rowIndex] = { person, fixed: false, adjusted: false };
    registerVisit(person, choice);
  });

  return { byRow, extras, overflow, total: workers.length };
};

type MonthInput = {
  rows: SectorRow[];
  people: Collaborator[]; // profissionais da função da planilha
  shift: string; // "D" ou "N"
  dates: string[]; // datas do mês exibido (AAAA-MM-DD)
  fixations: Fixation[];
  adjustments: Adjustment[];
  homeSectors?: Record<string, string>; // função → setor próprio (fora do rodízio)
  rotationStart?: string; // início do rodízio (padrão: o do modelo)
  spillSector?: string; // posto que recebe a sobra (padrão: APOIO)
  getShiftOn: (person: Collaborator, dateIso: string) => string;
};

// Calcula o mês exibido, "rodando" o rodízio desde o início para saber onde cada um parou
export const buildMonthAssignments = ({
  rows,
  people,
  shift,
  dates,
  fixations,
  adjustments,
  homeSectors,
  rotationStart,
  spillSector,
  getShiftOn,
}: MonthInput): DayAssignment[] => {
  if (dates.length === 0) return [];

  const cycle = getRotationCycle(rows);
  const memory: RotationMemory = new Map();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const start = rotationStart || ROTATION_START;
  const spill = spillSector ?? DEFAULT_SPILL;
  const result: DayAssignment[] = [];

  for (
    let date = start < firstDate ? start : firstDate;
    date <= lastDate;
    date = nextDay(date)
  ) {
    const current = date;
    const workers = people.filter((person) =>
      getShiftOn(person, current).split("/").includes(shift)
    );
    const dayAdjustments = adjustments.filter((item) => item.dateIso === current);

    const assignment = assignDay(
      rows,
      workers,
      current,
      fixations,
      dayAdjustments,
      homeSectors ?? {},
      cycle,
      spill,
      memory
    );

    if (current >= firstDate) result.push(assignment);
  }

  return result;
};

// ───────────── AUSÊNCIAS ─────────────

export type AbsenceCode = "FA" | "ATE" | "FE" | "FO";

type ShiftReader = (person: Collaborator, dateIso: string) => string;

const previousDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
};

// Código de ausência da pessoa nesse dia (null = não está ausente).
// Só conta em dia que ela trabalharia pela jornada (D ou N).
export const getAbsenceCode = (
  person: Collaborator,
  dateIso: string,
  getShiftOn: ShiftReader,
  getBaseShiftOn: ShiftReader
): AbsenceCode | null => {
  const base = getBaseShiftOn(person, dateIso);

  if (base !== "D" && base !== "N") return null;

  const actual = getShiftOn(person, dateIso);

  if (actual === "FA" || actual === "ATE" || actual === "FE") return actual;
  if (actual === "F") return "FO"; // folga lançada num dia de trabalho

  return null;
};

// Ausentes de uma planilha (função + turno) num dia
export const getAbsences = (
  people: Collaborator[],
  dateIso: string,
  shift: string,
  getShiftOn: ShiftReader,
  getBaseShiftOn: ShiftReader
) =>
  people
    .flatMap((person) => {
      if (getBaseShiftOn(person, dateIso) !== shift) return [];

      const code = getAbsenceCode(person, dateIso, getShiftOn, getBaseShiftOn);

      return code ? [{ person, code }] : [];
    })
    .sort((a, b) => a.person.name.localeCompare(b.person.name, "pt-BR"));

// Período seguido da ausência que contém essa data.
// Folgas da jornada no meio não interrompem o período.
export const getAbsencePeriod = (
  person: Collaborator,
  code: AbsenceCode,
  dateIso: string,
  getShiftOn: ShiftReader,
  getBaseShiftOn: ShiftReader
) => {
  let start = dateIso;
  let end = dateIso;
  let shifts = 1;

  const walk = (step: (iso: string) => string, edge: "start" | "end") => {
    let current = dateIso;

    for (let i = 0; i < 370; i++) {
      current = step(current);

      if (getAbsenceCode(person, current, getShiftOn, getBaseShiftOn) === code) {
        if (edge === "start") start = current;
        else end = current;
        shifts++;
        continue;
      }

      const base = getBaseShiftOn(person, current);

      if (base !== "D" && base !== "N") {
        // folga da jornada: se o código lançado (FE, ATE, FA) continua valendo nesse dia, ele faz parte do período
        if (code !== "FO" && getShiftOn(person, current) === code) {
          if (edge === "start") start = current;
          else end = current;
        }

        continue; // segue procurando
      }

      break;
    }
  };

  walk(previousDate, "start");
  walk(nextDay, "end");

  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;

  return { start, end, days, shifts };
};