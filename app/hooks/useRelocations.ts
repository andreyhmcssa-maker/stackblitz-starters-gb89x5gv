import { useSyncedList } from "./useSyncedList";
import type { Row } from "./useSyncedList";
import type { Relocation, RelocationInput } from "../lib/types";

const fromRow = (row: Row): Relocation => ({
  id: Number(row.id),
  personId: Number(row.person_id),
  kind: row.kind as Relocation["kind"],
  date: String(row.day),
  shift: String(row.shift),
  payDate: row.pay_day ? String(row.pay_day) : "",
  payShift: row.pay_shift ? String(row.pay_shift) : "",
  createdAt: String(row.created_at ?? "").slice(0, 10),
});

const toRow = (item: Relocation): Row => ({
  id: item.id,
  person_id: item.personId,
  kind: item.kind,
  day: item.date,
  shift: item.shift,
  pay_day: item.payDate || null,
  pay_shift: item.payShift || null,
});

export function useRelocations(enabled: boolean) {
  const [relocations, setRelocations] = useSyncedList<Relocation>({
    table: "relocations",
    enabled,
    fromRow,
    toRow,
  });

  const addRelocation = (data: RelocationInput) => {
    setRelocations((current) => [
      ...current,
      {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  // preencher, alterar ou apagar ("") a data e o turno do pagamento
  const setRelocationPayDate = (id: number, payDate: string, payShift: string) => {
    setRelocations((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, payDate, payShift: payDate ? payShift : "" }
          : item
      )
    );
  };

  const removeRelocation = (id: number) => {
    setRelocations((current) => current.filter((item) => item.id !== id));
  };

  return { relocations, addRelocation, setRelocationPayDate, removeRelocation };
}