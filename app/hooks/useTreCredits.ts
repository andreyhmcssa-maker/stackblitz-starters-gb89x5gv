import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { TreCredit, TreCreditInput } from "../lib/types";

const fromRow = (row: Row): TreCredit => ({
  id: Number(row.id),
  personId: Number(row.person_id),
  election: String(row.election),
  granted: Number(row.granted),
  createdAt: String(row.created_at ?? "").slice(0, 10),
});

const toRow = (item: TreCredit): Row => ({
  id: item.id,
  person_id: item.personId,
  election: item.election,
  granted: item.granted,
});

export function useTreCredits(enabled: boolean) {
  const [credits, setCredits] = useSyncedList<TreCredit>({
    table: "tre_credits",
    enabled,
    fromRow,
    toRow,
  });

  const addCredit = (data: TreCreditInput) => {
    setCredits((current) => [
      ...current,
      {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const updateCredit = (id: number, granted: number) => {
    setCredits((current) =>
      current.map((item) => (item.id === id ? { ...item, granted } : item))
    );
  };

  const removeCredit = (id: number) => {
    setCredits((current) => current.filter((item) => item.id !== id));
  };

  return { credits, addCredit, updateCredit, removeCredit };
}