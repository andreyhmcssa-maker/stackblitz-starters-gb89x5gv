import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { Swap, SwapInput } from "../lib/types";

const fromRow = (row: Row): Swap => ({
  id: Number(row.id),
  firstId: Number(row.first_id),
  secondId: Number(row.second_id),
  firstDate: String(row.first_date),
  firstShift: String(row.first_shift),
  secondDate: String(row.second_date),
  secondShift: String(row.second_shift),
  createdAt: String(row.created_at ?? "").slice(0, 10),
});

const toRow = (swap: Swap): Row => ({
  id: swap.id,
  first_id: swap.firstId,
  second_id: swap.secondId,
  first_date: swap.firstDate,
  first_shift: swap.firstShift,
  second_date: swap.secondDate,
  second_shift: swap.secondShift,
});

export function useSwaps(enabled: boolean) {
  const [swaps, setSwaps] = useSyncedList<Swap>({
    table: "swaps",
    enabled,
    fromRow,
    toRow,
  });

  const addSwap = (data: SwapInput) => {
    setSwaps((current) => [
      ...current,
      {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const removeSwap = (id: number) => {
    setSwaps((current) => current.filter((swap) => swap.id !== id));
  };

  return { swaps, addSwap, removeSwap };
}