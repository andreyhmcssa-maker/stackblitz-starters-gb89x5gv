import { useEffect, useRef } from "react";
import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { LayoutRole, Sector, SectorLayout } from "../lib/types";
import { isProntoSocorro, makePsTemplate, newId } from "../lib/sectorLayout";

// no banco a chave do layout é o setor, então o "id" aqui é o identificador do setor
type LayoutItem = SectorLayout & { id: number };

const fromRow = (row: Row): LayoutItem => ({
  id: Number(row.sector_id),
  sectorId: Number(row.sector_id),
  rotationStart: String(row.rotation_start),
  roles: (row.roles as LayoutRole[] | null) ?? [],
});

const toRow = (item: LayoutItem): Row => ({
  sector_id: item.id,
  rotation_start: item.rotationStart,
  roles: item.roles,
});

// Cópia independente de um layout para outro setor (com identificadores novos)
const cloneFor = (layout: SectorLayout, sectorId: number): SectorLayout => ({
  sectorId,
  rotationStart: layout.rotationStart,
  roles: layout.roles.map((role) => ({
    ...role,
    posts: role.posts.map((post) => ({ ...post, id: newId() })),
    homes: role.homes.map((home) => ({ ...home })),
  })),
});

export function useLayouts(sectors: Sector[], enabled: boolean, canSeed: boolean) {
  const [layouts, setLayouts, loaded] = useSyncedList<LayoutItem>({
    table: "layouts",
    enabled,
    fromRow,
    toRow,
    idColumn: "sector_id",
  });

  const triedRef = useRef<Set<number>>(new Set());

  // O administrador cria o modelo do Pronto Socorro para o setor com esse nome (uma vez por setor)
  useEffect(() => {
    if (!loaded || !canSeed) return;

    const missing = sectors.filter(
      (sector) =>
        isProntoSocorro(sector.name) &&
        !triedRef.current.has(sector.id) &&
        !layouts.some((layout) => layout.sectorId === sector.id)
    );

    if (missing.length === 0) return;

    missing.forEach((sector) => triedRef.current.add(sector.id));

    setLayouts((current) => [
      ...current,
      ...missing.map((sector) => ({
        id: sector.id,
        sectorId: sector.id,
        ...makePsTemplate(),
      })),
    ]);
  }, [loaded, canSeed, sectors, layouts, setLayouts]);

  const getLayout = (sectorId: number) =>
    layouts.find((layout) => layout.sectorId === sectorId);

  const saveLayout = (layout: SectorLayout) => {
    const item: LayoutItem = { ...layout, id: layout.sectorId };

    setLayouts((current) =>
      current.some((entry) => entry.sectorId === layout.sectorId)
        ? current.map((entry) => (entry.sectorId === layout.sectorId ? item : entry))
        : [...current, item]
    );
  };

  const applyPsTemplate = (sectorId: number) => {
    saveLayout({ sectorId, ...makePsTemplate() });
  };

  // devolve "" se deu certo, ou a mensagem do problema
  const copyLayout = (fromSectorId: number, toSectorId: number) => {
    const source = layouts.find((layout) => layout.sectorId === fromSectorId);

    if (!source) return "O setor de origem não tem layout.";

    saveLayout(cloneFor(source, toSectorId));

    return "";
  };

  return { layouts, getLayout, saveLayout, applyPsTemplate, copyLayout };
}