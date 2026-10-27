import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { Adjustment } from "../lib/types";

type SwapSide = { personId: number; sector: string };

const fromRow = (row: Row): Adjustment => ({
  id: Number(row.id),
  personId: Number(row.person_id),
  dateIso: String(row.day),
  sector: String(row.post),
});

const toRow = (item: Adjustment): Row => ({
  id: item.id,
  person_id: item.personId,
  day: item.dateIso,
  post: item.sector,
});

// Coloca (ou substitui) o ajuste de uma pessoa num dia
const setAdjustment = (
  list: Adjustment[],
  personId: number,
  dateIso: string,
  sector: string
): Adjustment[] => [
  ...list.filter(
    (item) => !(item.personId === personId && item.dateIso === dateIso)
  ),
  { id: Date.now() + personId, personId, dateIso, sector },
];

export function useAdjustments(enabled: boolean) {
  const [adjustments, setAdjustments] = useSyncedList<Adjustment>({
    table: "adjustments",
    enabled,
    fromRow,
    toRow,
  });

  const adjustPerson = (personId: number, dateIso: string, sector: string) => {
    setAdjustments((current) => setAdjustment(current, personId, dateIso, sector));
  };

  const swapPeople = (first: SwapSide, second: SwapSide, dateIso: string) => {
    setAdjustments((current) =>
      setAdjustment(
        setAdjustment(current, first.personId, dateIso, second.sector),
        second.personId,
        dateIso,
        first.sector
      )
    );
  };

  const undoAdjustment = (personId: number, dateIso: string) => {
    setAdjustments((current) =>
      current.filter(
        (item) => !(item.personId === personId && item.dateIso === dateIso)
      )
    );
  };

  return { adjustments, adjustPerson, swapPeople, undoAdjustment };
}