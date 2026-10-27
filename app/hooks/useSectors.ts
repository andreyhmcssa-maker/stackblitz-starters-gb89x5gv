import { useEffect } from "react";
import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import { isMigrated, markMigrated, readLocalArray } from "../lib/localMigration";
import type { Sector } from "../lib/types";

type Params = {
  enabled: boolean; // já entrou no sistema
  canSeed: boolean; // administrador: pode fazer a carga inicial
};

const fromRow = (row: Row): Sector => ({
  id: Number(row.id),
  name: String(row.name),
  active: Boolean(row.active),
});

const toRow = (sector: Sector): Row => ({
  id: sector.id,
  name: sector.name,
  active: sector.active,
});

const isSector = (item: unknown): item is Sector =>
  typeof item === "object" &&
  item !== null &&
  typeof (item as Sector).id === "number" &&
  typeof (item as Sector).name === "string" &&
  typeof (item as Sector).active === "boolean";

// tira acentos e maiúsculas para comparar nomes
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function useSectors({ enabled, canSeed }: Params) {
  const [sectorList, setSectors, loaded] = useSyncedList<Sector>({
    table: "sectors",
    enabled,
    fromRow,
    toRow,
  });

  // Primeira vez (banco vazio): leva os setores que estavam no navegador, com os mesmos identificadores
  useEffect(() => {
    if (!loaded || !canSeed || sectorList.length > 0) return;
    if (isMigrated("escala-setores-migrado")) return;

    const saved = readLocalArray("escala-setores").filter(isSector);

    markMigrated("escala-setores-migrado");

    if (saved.length > 0) setSectors(saved);
  }, [loaded, canSeed, sectorList.length, setSectors]);

  // nomes dos setores ativos, para as listas de escolha
  const sectorOptions = sectorList
    .filter((item) => item.active)
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  // "" = nome válido
  const checkName = (name: string, ignoreId?: number) => {
    const trimmed = name.trim();

    if (!trimmed) return "Informe o nome do setor.";

    const repeated = sectorList.some(
      (item) => item.id !== ignoreId && normalize(item.name) === normalize(trimmed)
    );

    return repeated ? "Já existe um setor com esse nome." : "";
  };

  // As funções abaixo devolvem "" quando deu certo, ou a mensagem do problema

  const addSector = (name: string) => {
    const problem = checkName(name);

    if (problem) return problem;

    setSectors((current) => [
      ...current,
      { id: Date.now(), name: name.trim(), active: true },
    ]);

    return "";
  };

  // os colaboradores guardam o identificador do setor, então não precisam ser mexidos
  const renameSector = (id: number, name: string) => {
    const problem = checkName(name, id);

    if (problem) return problem;

    setSectors((current) =>
      current.map((sector) => (sector.id === id ? { ...sector, name: name.trim() } : sector))
    );

    return "";
  };

  // activeCount = quantos colaboradores ativos o setor tem
  const toggleSector = (id: number, activeCount: number) => {
    const item = sectorList.find((sector) => sector.id === id);

    if (!item) return "Setor não encontrado.";

    if (item.active && activeCount > 0) {
      return `Este setor tem ${activeCount} colaborador(es) ativo(s). Mova-os para outro setor antes de desativar.`;
    }

    setSectors((current) =>
      current.map((sector) =>
        sector.id === id ? { ...sector, active: !sector.active } : sector
      )
    );

    return "";
  };

  // totalCount = quantos colaboradores (ativos ou desligados) o setor tem
  const deleteSector = (id: number, totalCount: number) => {
    if (!sectorList.some((sector) => sector.id === id)) return "Setor não encontrado.";

    if (totalCount > 0) {
      return "Este setor tem colaboradores (ativos ou desligados). Mova-os para outro setor ou, se não for mais usado, desative o setor em vez de excluir.";
    }

    setSectors((current) => current.filter((sector) => sector.id !== id));

    return "";
  };

  return {
    sectorList,
    sectorOptions,
    addSector,
    renameSector,
    toggleSector,
    deleteSector,
  };
}