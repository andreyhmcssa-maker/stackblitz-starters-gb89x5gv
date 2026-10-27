import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Shifts = Record<string, string>;
type ShiftRow = { person_id: number; day: string; code: string };

const PAGE_SIZE = 1000;

// chave que as telas usam: pessoa-ano-mês(0 a 11)-dia
const rowKey = (personId: number, day: string) => {
  const [year, month, date] = day.split("-");

  return `${personId}-${Number(year)}-${Number(month) - 1}-${date}`;
};

// chave das telas → linha do banco
const keyToRow = (key: string, code: string): ShiftRow => {
  const [personId, year, month, date] = key.split("-");

  return {
    person_id: Number(personId),
    day: `${year}-${String(Number(month) + 1).padStart(2, "0")}-${date.padStart(2, "0")}`,
    code,
  };
};

// Plantões lançados à mão, guardados no Supabase, com cara de useState
export function useSyncedShifts(enabled: boolean) {
  const [shifts, setShiftsState] = useState<Shifts>({});
  const [loaded, setLoaded] = useState(false);

  const shiftsRef = useRef<Shifts>({});
  const savedRef = useRef<Shifts>({});
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const epochRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  });

  const load = useCallback(async (force = false) => {
    if (!force && pendingRef.current > 0) return;

    const rows: ShiftRow[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("shifts")
        .select("person_id, day, code")
        .order("person_id")
        .order("day")
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error("Erro ao ler os plantões:", error.message);
        return;
      }

      const page = (data ?? []) as ShiftRow[];

      rows.push(...page);

      if (page.length < PAGE_SIZE) break;
    }

    if (!force && pendingRef.current > 0) return;

    const map: Shifts = {};

    rows.forEach((row) => {
      map[rowKey(Number(row.person_id), String(row.day))] = String(row.code);
    });

    shiftsRef.current = map;
    savedRef.current = { ...map };
    setShiftsState(map);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      shiftsRef.current = {};
      savedRef.current = {};
      setShiftsState({});
      setLoaded(false);
      return;
    }

    load();

    const refresh = () => {
      if (document.visibilityState === "visible") {
        queueRef.current = queueRef.current.then(() => load());
      }
    };

    document.addEventListener("visibilitychange", refresh);

    return () => document.removeEventListener("visibilitychange", refresh);
  }, [enabled, load]);

  // grava só o que mudou
  const sync = useCallback(async (next: Shifts) => {
    if (!enabledRef.current) return;

    const saved = savedRef.current;

    const changed = Object.entries(next).filter(([key, code]) => saved[key] !== code);
    const removed = Object.keys(saved).filter((key) => !(key in next));

    if (changed.length > 0) {
      const { error } = await supabase
        .from("shifts")
        .upsert(
          changed.map(([key, code]) => keyToRow(key, code)),
          { onConflict: "person_id,day" }
        );

      if (error) throw error;

      changed.forEach(([key, code]) => {
        saved[key] = code;
      });
    }

    for (const key of removed) {
      const row = keyToRow(key, "");

      const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("person_id", row.person_id)
        .eq("day", row.day);

      if (error) throw error;

      delete saved[key];
    }
  }, []);

  const setShifts = useCallback(
    (value: Shifts | ((current: Shifts) => Shifts)) => {
      const next =
        typeof value === "function"
          ? (value as (current: Shifts) => Shifts)(shiftsRef.current)
          : value;

      shiftsRef.current = next;
      setShiftsState(next);

      const epoch = epochRef.current;

      pendingRef.current += 1;

      queueRef.current = queueRef.current
        .then(() => (epoch === epochRef.current ? sync(next) : undefined))
        .catch(async (error) => {
          console.error("Erro ao gravar os plantões:", error);

          epochRef.current += 1;

          window.alert(
            "Não foi possível salvar essa alteração. Pode ser falta de permissão. A tela vai mostrar de novo o que está salvo."
          );

          await load(true);
        })
        .finally(() => {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
        });
    },
    [load, sync]
  );

  return [shifts, setShifts, loaded] as const;
}