import { useState } from "react";
import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { Collaborator, Fixation, FixationForm } from "../lib/types";
import { formatDate, todayIso } from "../lib/utils";

const fromRow = (row: Row): Fixation => ({
  id: Number(row.id),
  personId: Number(row.person_id),
  sector: String(row.post),
  startDate: String(row.start_date),
  endDate: row.end_date ? String(row.end_date) : "",
});

const toRow = (fixation: Fixation): Row => ({
  id: fixation.id,
  person_id: fixation.personId,
  post: fixation.sector,
  start_date: fixation.startDate,
  end_date: fixation.endDate || null,
});

// fixação indeterminada é tratada como "até o fim dos tempos" nas comparações
const endOf = (date: string) => date || "9999-12-31";

const describePeriod = (fixation: Fixation) =>
  fixation.endDate
    ? `de ${formatDate(fixation.startDate)} a ${formatDate(fixation.endDate)}`
    : `a partir de ${formatDate(fixation.startDate)}, por tempo indeterminado`;

export function useFixations(enabled: boolean) {
  const [fixations, setFixations] = useSyncedList<Fixation>({
    table: "fixations",
    enabled,
    fromRow,
    toRow,
  });

  const [fixationForm, setFixationForm] = useState<FixationForm | null>(null);
  const [fixationError, setFixationError] = useState("");

  const openFixation = (
    person: Collaborator,
    sector = "",
    dateIso = todayIso()
  ) => {
    setFixationForm({
      id: null,
      personId: person.id,
      personName: person.name,
      role: person.role,
      sector,
      startDate: dateIso,
      endDate: dateIso,
      indefinite: false,
    });
    setFixationError("");
  };

  const openEditFixation = (fixation: Fixation, person: Collaborator) => {
    setFixationForm({
      id: fixation.id,
      personId: person.id,
      personName: person.name,
      role: person.role,
      sector: fixation.sector,
      startDate: fixation.startDate,
      endDate: fixation.endDate,
      indefinite: !fixation.endDate,
    });
    setFixationError("");
  };

  const closeFixation = () => {
    setFixationForm(null);
    setFixationError("");
  };

  const saveFixation = () => {
    if (!fixationForm) return;

    const { id, personId, sector, startDate, indefinite } = fixationForm;
    const endDate = indefinite ? "" : fixationForm.endDate;

    if (!sector) {
      setFixationError("Escolha o setor.");
      return;
    }

    if (!startDate) {
      setFixationError("Informe a data inicial.");
      return;
    }

    if (!indefinite && !endDate) {
      setFixationError(
        'Informe a data final ou marque "Por tempo indeterminado".'
      );
      return;
    }

    if (!indefinite && endDate < startDate) {
      setFixationError("A data final precisa ser igual ou depois da inicial.");
      return;
    }

    const overlap = fixations.find(
      (fixation) =>
        fixation.id !== id &&
        fixation.personId === personId &&
        fixation.startDate <= endOf(endDate) &&
        endOf(fixation.endDate) >= startDate
    );

    if (overlap) {
      setFixationError(
        `Já existe uma fixação em ${overlap.sector} ${describePeriod(
          overlap
        )}. Exclua ou ajuste essa no Perfil antes.`
      );
      return;
    }

    if (id !== null) {
      setFixations((current) =>
        current.map((fixation) =>
          fixation.id === id
            ? { ...fixation, sector, startDate, endDate }
            : fixation
        )
      );
    } else {
      setFixations((current) => [
        ...current,
        { id: Date.now(), personId, sector, startDate, endDate },
      ]);
    }

    closeFixation();
  };

  const deleteFixation = (fixation: Fixation) => {
    if (
      !window.confirm(
        `Excluir a fixação em ${fixation.sector} (${describePeriod(fixation)})?`
      )
    ) {
      return;
    }

    setFixations((current) => current.filter((item) => item.id !== fixation.id));
  };

  return {
    fixations,
    fixationForm,
    fixationError,
    setFixationForm,
    openFixation,
    openEditFixation,
    closeFixation,
    saveFixation,
    deleteFixation,
  };
}