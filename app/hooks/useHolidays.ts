import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { Holiday, HolidayInput } from "../lib/types";

const fromRow = (row: Row): Holiday => ({
  id: Number(row.id),
  name: String(row.name),
  date: String(row.day),
  roles: (row.roles as string[] | null) ?? [],
  sectorId: Number(row.sector_id),
  createdAt: String(row.created_at ?? "").slice(0, 10),
});

const toRow = (item: Holiday): Row => ({
  id: item.id,
  name: item.name,
  day: item.date,
  roles: item.roles,
  sector_id: item.sectorId,
});

export function useHolidays(enabled: boolean) {
  const [holidays, setHolidays] = useSyncedList<Holiday>({
    table: "holidays",
    enabled,
    fromRow,
    toRow,
  });

  // lança vários feriados de uma vez, todos no setor indicado
  const addHolidays = (items: HolidayInput[], sectorId: number) => {
    const now = Date.now();
    const createdAt = new Date().toISOString().slice(0, 10);

    setHolidays((current) => [
      ...current,
      ...items.map((item, index) => ({
        ...item,
        sectorId,
        id: now + index,
        createdAt,
      })),
    ]);
  };

  const removeHoliday = (id: number) => {
    setHolidays((current) => current.filter((item) => item.id !== id));
  };

  return { holidays, addHolidays, removeHoliday };
}