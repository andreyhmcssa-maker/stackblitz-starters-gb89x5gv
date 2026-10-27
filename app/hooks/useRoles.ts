import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Collaborator } from "../lib/types";
import { normalize } from "../lib/utils";
import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";

// função de um setor (cada setor tem as suas)
type SectorRole = { id: number; sectorId: number; name: string };

type Params = {
  collaborators: Collaborator[];
  setCollaborators: Dispatch<SetStateAction<Collaborator[]>>;
  filterRole: string;
  setFilterRole: (value: string) => void;
  enabled: boolean; // já entrou no sistema
  sectorId: number | null; // setor escolhido
  sectorName: string; // nome do setor escolhido
  canSeed?: boolean; // não é mais usado: setor novo já ganha as funções pelo banco
};

const fromRow = (row: Row): SectorRole => ({
  id: Number(row.id),
  sectorId: Number(row.sector_id),
  name: String(row.name),
});

const toRow = (item: SectorRole): Row => ({
  id: item.id,
  sector_id: item.sectorId,
  name: item.name,
});

export function useRoles({
  collaborators,
  setCollaborators,
  filterRole,
  setFilterRole,
  enabled,
  sectorId,
  sectorName,
}: Params) {
  const [rows, setRows] = useSyncedList<SectorRole>({
    table: "sector_roles",
    enabled,
    fromRow,
    toRow,
  });

  // funções de qualquer setor, em ordem alfabética (o administrador enxerga todos)
  const rolesFor = (id: number) =>
    rows
      .filter((item) => item.sectorId === id)
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

  // funções do setor escolhido
  const roles = sectorId === null ? [] : rolesFor(sectorId);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [roleError, setRoleError] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");

  const cancelEditRole = () => {
    setEditingRole(null);
    setEditingRoleName("");
    setRoleError("");
  };

  const openRoles = () => {
    setNewRole("");
    cancelEditRole();
    setShowRoleModal(true);
  };

  const closeRoles = () => setShowRoleModal(false);

  const addRole = () => {
    const name = newRole.trim();

    if (!name) {
      setRoleError("Digite o nome da função.");
      return;
    }

    if (sectorId === null || sectorId <= 0) {
      setRoleError("Escolha um setor antes de criar funções.");
      return;
    }

    const alreadyExists = roles.some(
      (role) => normalize(role) === normalize(name)
    );

    if (alreadyExists) {
      setRoleError("Essa função já existe.");
      return;
    }

    setRows((current) => [
      ...current,
      { id: Date.now(), sectorId, name },
    ]);

    setNewRole("");
    setRoleError("");
  };

  const startEditRole = (role: string) => {
    setEditingRole(role);
    setEditingRoleName(role);
    setRoleError("");
  };

  const saveEditedRole = () => {
    if (editingRole === null || sectorId === null) return;

    const name = editingRoleName.trim();

    if (!name) {
      setRoleError("Digite o nome da função.");
      return;
    }

    const alreadyExists = roles.some(
      (role) => role !== editingRole && normalize(role) === normalize(name)
    );

    if (alreadyExists) {
      setRoleError("Essa função já existe.");
      return;
    }

    setRows((current) =>
      current.map((item) =>
        item.sectorId === sectorId && item.name === editingRole
          ? { ...item, name }
          : item
      )
    );

    // só os colaboradores deste setor acompanham o novo nome
    setCollaborators((current) =>
      current.map((person) =>
        person.sector === sectorName && person.role === editingRole
          ? { ...person, role: name }
          : person
      )
    );

    if (filterRole === editingRole) {
      setFilterRole(name);
    }

    cancelEditRole();
  };

  const deleteRole = (role: string) => {
    if (sectorId === null) return;

    if (roles.length === 1) {
      setRoleError("É preciso manter pelo menos uma função no setor.");
      return;
    }

    const inUse = collaborators.filter(
      (person) => person.sector === sectorName && person.role === role
    ).length;

    if (inUse > 0) {
      setRoleError(
        `A função "${role}" está em uso por ${inUse} colaborador(es) deste setor. Troque a função deles antes de excluir.`
      );
      return;
    }

    if (!window.confirm(`Excluir a função "${role}" deste setor?`)) return;

    setRows((current) =>
      current.filter((item) => !(item.sectorId === sectorId && item.name === role))
    );

    if (filterRole === role) {
      setFilterRole("Todas as funções");
    }

    setRoleError("");
  };

  return {
    roles,
    rolesFor,
    showRoleModal,
    newRole,
    roleError,
    editingRole,
    editingRoleName,
    setNewRole,
    setEditingRoleName,
    openRoles,
    closeRoles,
    addRole,
    startEditRole,
    cancelEditRole,
    saveEditedRole,
    deleteRole,
  };
}