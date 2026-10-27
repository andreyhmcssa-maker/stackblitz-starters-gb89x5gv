import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { Occurrence, OccurrenceInput } from "../lib/types";

const fromRow = (row: Row): Occurrence => ({
  id: Number(row.id),
  personId: Number(row.person_id),
  kind: row.kind as Occurrence["kind"],
  dates: ((row.days as string[] | null) ?? []).map(String).sort(),
  note: String(row.note ?? ""),
  creditId:
    row.credit_id === null || row.credit_id === undefined
      ? undefined
      : Number(row.credit_id),
  createdAt: String(row.created_at ?? "").slice(0, 10),
});

const toRow = (item: Occurrence): Row => ({
  id: item.id,
  person_id: item.personId,
  kind: item.kind,
  days: item.dates,
  note: item.note,
  credit_id: item.creditId ?? null,
});

export function useOccurrences(enabled: boolean) {
  const [occurrences, setOccurrences] = useSyncedList<Occurrence>({
    table: "occurrences",
    enabled,
    fromRow,
    toRow,
  });

  const addOccurrence = (data: OccurrenceInput) => {
    setOccurrences((current) => [
      ...current,
      {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const removeOccurrence = (id: number) => {
    setOccurrences((current) => current.filter((item) => item.id !== id));
  };

  return { occurrences, addOccurrence, removeOccurrence };
}