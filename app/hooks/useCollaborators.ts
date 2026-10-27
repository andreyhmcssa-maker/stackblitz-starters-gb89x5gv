import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type {
  Collaborator,
  JourneyAssignment,
  Sector,
  TerminationNote,
} from "../lib/types";
import { emptyCollaborator } from "../lib/constants";
import { formatDate, normalize, getHistory } from "../lib/utils";

type Params = {
  sectors: Sector[]; // setores que a pessoa enxerga
  enabled: boolean; // já entrou no sistema
  authorName: string; // quem assina as observações
};

// Como o colaborador é guardado no banco: o setor vai pelo identificador
type CollaboratorRecord = Omit<Collaborator, "sector"> & { sectorId: number | null };

const fromRow = (row: Row): CollaboratorRecord => ({
  id: Number(row.id),
  registration: String(row.registration ?? ""),
  name: String(row.name),
  role: String(row.role),
  contract: (row.contract as string | null) ?? undefined,
  sectorId:
    row.sector_id === null || row.sector_id === undefined ? null : Number(row.sector_id),
  journey: String(row.journey ?? ""),
  corenNumber: String(row.coren_number ?? ""),
  corenExpiry: String(row.coren_expiry ?? ""),
  birthDate: String(row.birth_date ?? ""),
  admissionDate: String(row.admission_date ?? ""),
  terminationDate: (row.termination_date as string | null) ?? undefined,
  terminationNotes: (row.termination_notes as TerminationNote[] | null) ?? [],
  journeyHistory: (row.journey_history as JourneyAssignment[] | null) ?? [],
});

const toRow = (record: CollaboratorRecord): Row => ({
  id: record.id,
  registration: record.registration ?? "",
  name: record.name,
  role: record.role,
  contract: record.contract || null,
  sector_id: record.sectorId,
  journey: record.journey ?? "",
  coren_number: record.corenNumber ?? "",
  coren_expiry: record.corenExpiry || null,
  birth_date: record.birthDate || null,
  admission_date: record.admissionDate || null,
  termination_date: record.terminationDate || null,
  termination_notes: record.terminationNotes ?? [],
  journey_history: record.journeyHistory ?? [],
});

// registro do banco → colaborador da tela (com o nome do setor)
const toCollaborator = (record: CollaboratorRecord, sectors: Sector[]): Collaborator => {
  const { sectorId, ...rest } = record;

  return {
    ...rest,
    sector: sectors.find((item) => item.id === sectorId)?.name ?? "",
  };
};

// colaborador da tela → registro do banco (se o nome do setor não for achado, mantém o anterior)
const toRecord = (
  person: Collaborator,
  sectors: Sector[],
  previous?: CollaboratorRecord
): CollaboratorRecord => {
  const { sector, ...rest } = person;
  const found = sectors.find((item) => item.name === sector);

  return { ...rest, sectorId: found ? found.id : (previous?.sectorId ?? null) };
};

export function useCollaborators({ sectors, enabled, authorName }: Params) {
  const [records, setRecords] = useSyncedList<CollaboratorRecord>({
    table: "collaborators",
    enabled,
    fromRow,
    toRow,
  });

  const sectorsRef = useRef(sectors);

  useEffect(() => {
    sectorsRef.current = sectors;
  });

  // lista da tela: o nome do setor vem sempre do cadastro de setores (renomear funciona na hora)
  const collaboratorsList = useMemo(
    () => records.map((record) => toCollaborator(record, sectors)),
    [records, sectors]
  );

  // igual ao setState de antes: aceita um valor novo ou uma função
  const setCollaboratorsList: Dispatch<SetStateAction<Collaborator[]>> = useCallback(
    (value) => {
      setRecords((current) => {
        const currentList = current.map((record) =>
          toCollaborator(record, sectorsRef.current)
        );

        const next =
          typeof value === "function"
            ? (value as (list: Collaborator[]) => Collaborator[])(currentList)
            : value;

        const byId = new Map(current.map((record) => [record.id, record]));

        return next.map((person) =>
          toRecord(person, sectorsRef.current, byId.get(person.id))
        );
      });
    },
    [setRecords]
  );

  // LISTA, BUSCA E ATIVOS/DESLIGADOS
  const sortedCollaborators = [...collaboratorsList].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  );

  const activeCollaborators = sortedCollaborators.filter(
    (person) => !person.terminationDate
  );

  const terminatedCollaborators = sortedCollaborators.filter(
    (person) => person.terminationDate
  );

  const effectiveCount = activeCollaborators.filter(
    (person) => person.contract === "Efetivo"
  ).length;

  const cltCount = activeCollaborators.filter(
    (person) => person.contract === "Celetista"
  ).length;

  const [teamView, setTeamView] = useState("ativos");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamContract, setTeamContract] = useState("Todos");
  const [teamRole, setTeamRole] = useState("Todas");

  const searchedCollaborators = (
    teamView === "ativos" ? activeCollaborators : terminatedCollaborators
  ).filter((person) => {
    if (teamContract !== "Todos" && person.contract !== teamContract) {
      return false;
    }

    if (teamRole !== "Todas" && person.role !== teamRole) {
      return false;
    }

    const term = normalize(teamSearch.trim());

    if (!term) return true;

    return normalize(
      `${person.name} ${person.registration ?? ""} ${person.role} ${person.contract ?? ""} ${person.sector ?? ""}`
    ).includes(term);
  });

  // CADASTRO E EDIÇÃO
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState(emptyCollaborator);
  const [collaboratorError, setCollaboratorError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const saveCollaborator = () => {
    const name = newCollaborator.name.trim();
    const registration = newCollaborator.registration.trim();

    if (!name || !registration) {
      setCollaboratorError("Preencha o nome e a matrícula.");
      return;
    }

    if (!newCollaborator.sector) {
      setCollaboratorError("Selecione o setor.");
      return;
    }

    if (!newCollaborator.journeyStart) {
      setCollaboratorError("Informe a data base da jornada.");
      return;
    }

    if (!newCollaborator.contract) {
      setCollaboratorError("Selecione o tipo de contrato.");
      return;
    }

    const alreadyExists = collaboratorsList.some(
      (person) => person.registration === registration && person.id !== editingId
    );

    if (alreadyExists) {
      setCollaboratorError("Já existe um colaborador com essa matrícula.");
      return;
    }

    const { journeyStart, ...data } = newCollaborator;

    if (editingId !== null) {
      const original = collaboratorsList.find((person) => person.id === editingId);

      if (!original) return;

      const history = [...getHistory(original)];
      const last = history[history.length - 1];

      const changedJourney = data.journey !== last.journey;
      const movedForward = Boolean(
        last.startDate && journeyStart > last.startDate
      );

      if (changedJourney || movedForward) {
        if (last.startDate && journeyStart <= last.startDate) {
          setCollaboratorError(
            `A data base da nova jornada precisa ser depois de ${formatDate(last.startDate)}.`
          );
          return;
        }

        history.push({ journey: data.journey, startDate: journeyStart });
      } else {
        const previous = history[history.length - 2];

        if (previous && previous.startDate && journeyStart <= previous.startDate) {
          setCollaboratorError(
            `A data base precisa ser depois de ${formatDate(previous.startDate)}, quando começou a jornada anterior.`
          );
          return;
        }

        history[history.length - 1] = { ...last, startDate: journeyStart };
      }

      setCollaboratorsList((current) =>
        current.map((person) =>
          person.id === editingId
            ? { ...person, ...data, name, registration, journeyHistory: history }
            : person
        )
      );
    } else {
      setCollaboratorsList((current) => [
        ...current,
        {
          id: Date.now(),
          ...data,
          name,
          registration,
          journeyHistory: [{ journey: data.journey, startDate: journeyStart }],
        },
      ]);
    }

    setNewCollaborator(emptyCollaborator);
    setEditingId(null);
    setCollaboratorError("");
    setShowCollaboratorModal(false);
  };

  // defaultSector = o setor em que a pessoa está (já vem preenchido)
  const openNewCollaborator = (defaultJourney: string, defaultSector = "") => {
    setEditingId(null);
    setNewCollaborator({
      ...emptyCollaborator,
      journey: defaultJourney,
      sector: defaultSector,
    });
    setCollaboratorError("");
    setShowCollaboratorModal(true);
  };

  const openEditCollaborator = (person: Collaborator) => {
    const history = getHistory(person);
    const current = history[history.length - 1];

    setEditingId(person.id);
    setNewCollaborator({
      registration: person.registration ?? "",
      name: person.name,
      role: person.role,
      contract: person.contract ?? "",
      sector: person.sector ?? "",
      journey: current.journey,
      journeyStart: current.startDate,
      corenNumber: person.corenNumber ?? "",
      corenExpiry: person.corenExpiry ?? "",
      birthDate: person.birthDate ?? "",
      admissionDate: person.admissionDate ?? "",
    });
    setCollaboratorError("");
    setShowCollaboratorModal(true);
  };

  const closeCollaboratorModal = () => setShowCollaboratorModal(false);

  // PERFIL
  const [profileId, setProfileId] = useState<number | null>(null);

  const profile =
    collaboratorsList.find((person) => person.id === profileId) ?? null;

  const openProfile = (id: number) => setProfileId(id);
  const closeProfile = () => setProfileId(null);

  // DESLIGAMENTO E REATIVAÇÃO
  const [terminateTarget, setTerminateTarget] = useState<Collaborator | null>(null);
  const [terminationDate, setTerminationDate] = useState("");
  const [terminationError, setTerminationError] = useState("");

  const openTerminate = (person: Collaborator) => {
    setTerminateTarget(person);
    setTerminationDate("");
    setTerminationError("");
  };

  const closeTerminate = () => setTerminateTarget(null);

  const confirmTerminate = () => {
    if (!terminateTarget) return;

    if (!terminationDate) {
      setTerminationError("Informe a data de desligamento.");
      return;
    }

    setCollaboratorsList((current) =>
      current.map((person) =>
        person.id === terminateTarget.id
          ? { ...person, terminationDate }
          : person
      )
    );

    setTerminateTarget(null);
  };

  const reactivateCollaborator = (person: Collaborator) => {
    if (!window.confirm(`Reativar ${person.name}?`)) return;

    setCollaboratorsList((current) =>
      current.map((item) =>
        item.id === person.id ? { ...item, terminationDate: undefined } : item
      )
    );
  };

  // HISTÓRICO DE JORNADAS
  const deleteJourneyPeriod = (personId: number, index: number) => {
    const person = collaboratorsList.find((item) => item.id === personId);

    if (!person) return;

    const history = getHistory(person);

    if (history.length <= 1) return;

    const period = history[index];

    if (!period) return;

    const consequence =
      index === 0
        ? "Os dias até o início do próximo período ficarão sem escala automática."
        : `Esses dias passarão a seguir a jornada anterior (${history[index - 1].journey}).`;

    if (
      !window.confirm(
        `Excluir o período "${period.journey}" iniciado em ${formatDate(period.startDate)}?\n\n${consequence}`
      )
    ) {
      return;
    }

    const updated = history.filter((_, position) => position !== index);
    const current = updated[updated.length - 1];

    setCollaboratorsList((list) =>
      list.map((item) =>
        item.id === personId
          ? { ...item, journey: current.journey, journeyHistory: updated }
          : item
      )
    );
  };

  // OBSERVAÇÕES DOS DESLIGADOS
  const [notesTargetId, setNotesTargetId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");

  const notesTarget =
    collaboratorsList.find((person) => person.id === notesTargetId) ?? null;

  const openNotes = (person: Collaborator) => {
    setNewNote("");
    setNotesTargetId(person.id);
  };

  const closeNotes = () => {
    setNotesTargetId(null);
    setNewNote("");
  };

  const addNote = () => {
    const text = newNote.trim();

    if (!text || notesTargetId === null) return;

    setCollaboratorsList((current) =>
      current.map((person) =>
        person.id === notesTargetId
          ? {
              ...person,
              terminationNotes: [
                ...(person.terminationNotes ?? []),
                {
                  id: Date.now(),
                  text,
                  author: authorName,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : person
      )
    );

    setNewNote("");
  };

  return {
    collaboratorsList,
    setCollaboratorsList,
    sortedCollaborators,
    activeCollaborators,
    terminatedCollaborators,
    teamView,
    setTeamView,
    teamSearch,
    setTeamSearch,
    searchedCollaborators,
    effectiveCount,
    cltCount,
    teamContract,
    setTeamContract,
    teamRole,
    setTeamRole,
    showCollaboratorModal,
    newCollaborator,
    setNewCollaborator,
    collaboratorError,
    editingId,
    saveCollaborator,
    openNewCollaborator,
    openEditCollaborator,
    closeCollaboratorModal,
    profile,
    openProfile,
    closeProfile,
    terminateTarget,
    terminationDate,
    setTerminationDate,
    terminationError,
    openTerminate,
    closeTerminate,
    confirmTerminate,
    reactivateCollaborator,
    deleteJourneyPeriod,
    notesTarget,
    newNote,
    setNewNote,
    openNotes,
    closeNotes,
    addNote,
  };
}