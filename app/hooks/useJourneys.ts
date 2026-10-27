import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { emptyJourney } from "../lib/constants";
import type { Collaborator, Journey } from "../lib/types";
import { getHistory, normalize } from "../lib/utils";
import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";

// jornada de um setor (cada setor tem as suas)
type SectorJourney = Journey & { sectorId: number };

type Params = {
  collaborators: Collaborator[];
  setCollaborators: Dispatch<SetStateAction<Collaborator[]>>;
  filterJourney: string;
  setFilterJourney: (value: string) => void;
  enabled: boolean; // já entrou no sistema
  sectorId: number | null; // setor escolhido
  sectorName: string; // nome do setor escolhido
  canSeed?: boolean; // não é mais usado: setor novo já ganha as jornadas pelo banco
};

const fromRow = (row: Row): SectorJourney => ({
  id: Number(row.id),
  sectorId: Number(row.sector_id),
  name: String(row.name),
  shift: String(row.shift),
  type: String(row.type),
  workDays: Number(row.work_days),
  offDays: Number(row.off_days),
  days: (row.days as string[] | null) ?? [],
  active: Boolean(row.active),
});

const toRow = (journey: SectorJourney): Row => ({
  id: journey.id,
  sector_id: journey.sectorId,
  name: journey.name,
  shift: journey.shift,
  type: journey.type,
  work_days: journey.workDays,
  off_days: journey.offDays,
  days: journey.days,
  active: journey.active,
});

export function useJourneys({
  collaborators,
  setCollaborators,
  filterJourney,
  setFilterJourney,
  enabled,
  sectorId,
  sectorName,
}: Params) {
  const [rows, setRows] = useSyncedList<SectorJourney>({
    table: "sector_journeys",
    enabled,
    fromRow,
    toRow,
  });

  // jornadas do setor escolhido
  const journeys = rows
    .filter((item) => item.sectorId === sectorId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const activeJourneys = journeys.filter((journey) => journey.active);

  const [showJourneysModal, setShowJourneysModal] = useState(false);
  const [showJourneyForm, setShowJourneyForm] = useState(false);
  const [editingJourneyId, setEditingJourneyId] = useState<number | null>(null);
  const [journeyForm, setJourneyForm] = useState(emptyJourney);
  const [journeyError, setJourneyError] = useState("");
  const [journeysListError, setJourneysListError] = useState("");

  const openJourneys = () => {
    setJourneysListError("");
    setShowJourneysModal(true);
  };

  const closeJourneys = () => setShowJourneysModal(false);

  const closeJourneyForm = () => setShowJourneyForm(false);

  const openNewJourney = () => {
    setEditingJourneyId(null);
    setJourneyForm(emptyJourney);
    setJourneyError("");
    setShowJourneyForm(true);
  };

  const openEditJourney = (journey: Journey) => {
    setEditingJourneyId(journey.id);
    setJourneyForm({
      name: journey.name,
      shift: journey.shift,
      type: journey.type,
      workDays: journey.workDays,
      offDays: journey.offDays,
      days: [...journey.days],
    });
    setJourneyError("");
    setShowJourneyForm(true);
  };

  const toggleJourneyDay = (index: number) => {
    const order = ["", "T", "F"];

    setJourneyForm((current) => {
      const days = [...current.days];
      days[index] = order[(order.indexOf(days[index]) + 1) % order.length];
      return { ...current, days };
    });
  };

  const saveJourney = () => {
    const name = journeyForm.name.trim();

    if (!name) {
      setJourneyError("Digite o nome da jornada.");
      return;
    }

    if (sectorId === null || sectorId <= 0) {
      setJourneyError("Escolha um setor antes de criar jornadas.");
      return;
    }

    if (journeyForm.type === "semanal" && !journeyForm.days.includes("T")) {
      setJourneyError("Marque pelo menos um dia de trabalho na semana.");
      return;
    }

    const alreadyExists = journeys.some(
      (journey) =>
        journey.id !== editingJourneyId &&
        normalize(journey.name) === normalize(name)
    );

    if (alreadyExists) {
      setJourneyError("Já existe uma jornada com esse nome.");
      return;
    }

    const data = {
      name,
      shift: journeyForm.shift,
      type: journeyForm.type,
      workDays: journeyForm.workDays,
      offDays: journeyForm.offDays,
      days: journeyForm.days,
    };

    if (editingJourneyId !== null) {
      const oldJourney = journeys.find(
        (journey) => journey.id === editingJourneyId
      );

      setRows((current) =>
        current.map((journey) =>
          journey.id === editingJourneyId ? { ...journey, ...data } : journey
        )
      );

      // só os colaboradores deste setor acompanham o novo nome
      if (oldJourney && oldJourney.name !== name) {
        setCollaborators((current) =>
          current.map((person) =>
            person.sector === sectorName
              ? {
                  ...person,
                  journey: person.journey === oldJourney.name ? name : person.journey,
                  journeyHistory: person.journeyHistory?.map((item) =>
                    item.journey === oldJourney.name
                      ? { ...item, journey: name }
                      : item
                  ),
                }
              : person
          )
        );

        if (filterJourney === oldJourney.name) {
          setFilterJourney(name);
        }
      }
    } else {
      setRows((current) => [
        ...current,
        { id: Date.now(), sectorId, ...data, active: true },
      ]);
    }

    setShowJourneyForm(false);
    setJourneyError("");
  };

  const toggleJourneyActive = (id: number) => {
    setRows((current) =>
      current.map((journey) =>
        journey.id === id ? { ...journey, active: !journey.active } : journey
      )
    );
    setJourneysListError("");
  };

  const deleteJourney = (journey: Journey) => {
    const inUse = collaborators.filter(
      (person) =>
        person.sector === sectorName &&
        getHistory(person).some((item) => item.journey === journey.name)
    ).length;

    if (inUse > 0) {
      setJourneysListError(
        `A jornada "${journey.name}" é usada (ou já foi usada) por ${inUse} colaborador(es) deste setor. Para ela deixar de aparecer nas opções, desative-a.`
      );
      return;
    }

    if (!window.confirm(`Excluir a jornada "${journey.name}" deste setor?`)) return;

    setRows((current) => current.filter((item) => item.id !== journey.id));

    if (filterJourney === journey.name) {
      setFilterJourney("Todas as escalas");
    }

    setJourneysListError("");
  };

  return {
    journeys,
    activeJourneys,
    showJourneysModal,
    showJourneyForm,
    editingJourneyId,
    journeyForm,
    journeyError,
    journeysListError,
    setJourneyForm,
    openJourneys,
    closeJourneys,
    closeJourneyForm,
    openNewJourney,
    openEditJourney,
    toggleJourneyDay,
    saveJourney,
    toggleJourneyActive,
    deleteJourney,
  };
}