import { useState } from "react";
import { useSyncedShifts } from "./useSyncedShifts";
import type {
  Collaborator,
  Holiday,
  Journey,
  Occurrence,
  Relocation,
  Swap,
} from "../lib/types";
import { getAutoShift, getJourneyNotice } from "../lib/utils";
import { applySwaps, countShifts } from "../lib/swaps";
import { applyRelocations } from "../lib/relocations";
import { applyOccurrences } from "../lib/occurrences";
import { applyHolidays } from "../lib/holidays";

type UseShiftsParams = {
  year: number;
  month: number;
  days: string[];
  getDateIso: (day: string) => string;
  journeys: Journey[];
  collaborators: Collaborator[];
  swaps: Swap[];
  relocations: Relocation[];
  occurrences: Occurrence[];
  holidays: Holiday[];
  enabled: boolean; // já entrou no sistema
};

export function useShifts({
  year,
  month,
  days,
  getDateIso,
  journeys,
  collaborators,
  swaps,
  relocations,
  occurrences,
  holidays,
  enabled,
}: UseShiftsParams) {
  const [shifts, setShifts] = useSyncedShifts(enabled);

  const getCellKey = (personId: number, day: string) => {
    return `${personId}-${year}-${month}-${day}`;
  };

  // Plantão que a jornada define, já com os feriados das funções selecionadas
  const autoShift = (person: Collaborator, dateIso: string) =>
    applyHolidays(
      getAutoShift(person, dateIso, journeys),
      person.role,
      dateIso,
      holidays
    );

  // Código final do dia: lançado/jornada → trocas → remanejos → lançamentos de Conflitos
  const finalShift = (code: string, personId: number, dateIso: string) =>
    applyOccurrences(
      applyRelocations(
        applySwaps(code, personId, dateIso, swaps),
        personId,
        dateIso,
        relocations
      ),
      personId,
      dateIso,
      occurrences
    );

  // PLANTÃO DE CADA DIA (manual ou automático pela jornada)
  const getShiftFor = (person: Collaborator, day: string) => {
    const dateIso = getDateIso(day);

    if (person.terminationDate && dateIso > person.terminationDate) return "";

    const code =
      shifts[getCellKey(person.id, day)] ?? autoShift(person, dateIso);

    return finalShift(code, person.id, dateIso);
  };

  // Plantão de qualquer data (não só do mês exibido) — usado pelo rodízio
  const getShiftOn = (person: Collaborator, dateIso: string) => {
    if (person.terminationDate && dateIso > person.terminationDate) return "";

    const [y, m, d] = dateIso.split("-");
    const key = `${person.id}-${Number(y)}-${Number(m) - 1}-${d}`;

    const code = shifts[key] ?? autoShift(person, dateIso);

    return finalShift(code, person.id, dateIso);
  };

  // Plantão que a jornada define, com feriados e trocas (ignora o que foi lançado à mão, os remanejos e os lançamentos)
  const getBaseShiftOn = (person: Collaborator, dateIso: string) => {
    if (person.terminationDate && dateIso > person.terminationDate) return "";

    return applySwaps(autoShift(person, dateIso), person.id, dateIso, swaps);
  };

  const monthlyShifts = collaborators.reduce(
    (total, person) =>
      total +
      days.reduce((sum, day) => sum + countShifts(getShiftFor(person, day)), 0),
    0
  );

  // JANELA DO DIA (clicar na célula)
  const [selectedCell, setSelectedCell] = useState<{
    personId: number;
    personName: string;
    day: string;
  } | null>(null);

  const selectCell = (person: Collaborator, day: string) => {
    setSelectedCell({
      personId: person.id,
      personName: person.name,
      day,
    });
  };

  const closeCell = () => setSelectedCell(null);

  const selectedPerson = selectedCell
    ? collaborators.find((person) => person.id === selectedCell.personId)
    : undefined;

  const selectedNotice =
    selectedCell && selectedPerson
      ? getJourneyNotice(selectedPerson, getDateIso(selectedCell.day))
      : null;

  const hasManualShift = selectedCell
    ? Boolean(shifts[getCellKey(selectedCell.personId, selectedCell.day)])
    : false;

  const changeShift = (shift: string) => {
    if (!selectedCell) return;

    const key = getCellKey(selectedCell.personId, selectedCell.day);

    setShifts((current) => ({
      ...current,
      [key]: shift,
    }));

    setSelectedCell(null);
  };

  const clearShift = () => {
    if (!selectedCell) return;

    const key = getCellKey(selectedCell.personId, selectedCell.day);

    setShifts((current) => {
      const updated = { ...current };
      delete updated[key];
      return updated;
    });

    setSelectedCell(null);
  };

  // NOVO PLANTÃO
  const [showShiftModal, setShowShiftModal] = useState(false);

  const [newShift, setNewShift] = useState({
    personId: 0,
    day: "01",
    shift: "D",
  });

  const openNewShift = () => setShowShiftModal(true);
  const closeNewShift = () => setShowShiftModal(false);

  const addShift = () => {
    if (!newShift.personId) return;

    const key = getCellKey(newShift.personId, newShift.day);

    setShifts((current) => ({
      ...current,
      [key]: newShift.shift,
    }));

    setShowShiftModal(false);
    setNewShift({ personId: 0, day: "01", shift: "D" });
  };

  return {
    getShiftFor,
    getShiftOn,
    getBaseShiftOn,
    monthlyShifts,
    selectedCell,
    selectedNotice,
    hasManualShift,
    selectCell,
    closeCell,
    changeShift,
    clearShift,
    showShiftModal,
    newShift,
    setNewShift,
    openNewShift,
    closeNewShift,
    addShift,
  };
}