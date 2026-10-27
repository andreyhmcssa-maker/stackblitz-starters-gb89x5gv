import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export type Row = Record<string, unknown>;

type Options<T extends { id: number }> = {
  table: string;
  enabled: boolean; // só carrega e grava depois de entrar no sistema
  fromRow: (row: Row) => T;
  toRow: (item: T) => Row;
  idColumn?: string; // coluna do identificador no banco (padrão: "id")
};

// o Supabase devolve no máximo 1000 linhas por pedido
const PAGE_SIZE = 1000;

// Lista guardada no Supabase que se comporta como um useState:
// a tela muda na hora e as diferenças (novos, alterados, removidos) vão para o banco.
export function useSyncedList<T extends { id: number }>({
  table,
  enabled,
  fromRow,
  toRow,
  idColumn = "id",
}: Options<T>) {
  const [items, setItemsState] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  const itemsRef = useRef<T[]>([]);
  const savedRef = useRef<Map<number, string>>(new Map()); // id → linha já salva (em texto)
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const epochRef = useRef(0);

  const enabledRef = useRef(enabled);
  const fromRowRef = useRef(fromRow);
  const toRowRef = useRef(toRow);

  useEffect(() => {
    enabledRef.current = enabled;
    fromRowRef.current = fromRow;
    toRowRef.current = toRow;
  });

  // lê tudo do banco (force = mesmo com gravações na fila)
  const load = useCallback(
    async (force = false) => {
      if (!force && pendingRef.current > 0) return;

      const rows: Row[] = [];

      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order(idColumn)
          .range(from, from + PAGE_SIZE - 1);

        if (error) {
          console.error(`Erro ao ler ${table}:`, error.message);
          return;
        }

        const page = (data ?? []) as Row[];

        rows.push(...page);

        if (page.length < PAGE_SIZE) break;
      }

      if (!force && pendingRef.current > 0) return;

      const list = rows.map((row) => fromRowRef.current(row));

      itemsRef.current = list;
      savedRef.current = new Map(
        list.map((item) => [item.id, JSON.stringify(toRowRef.current(item))])
      );

      setItemsState(list);
      setLoaded(true);
    },
    [table, idColumn]
  );

  useEffect(() => {
    if (!enabled) {
      itemsRef.current = [];
      savedRef.current = new Map();
      setItemsState([]);
      setLoaded(false);
      return;
    }

    load();

    // ao voltar para a aba, atualiza com o que outras pessoas fizeram
    const refresh = () => {
      if (document.visibilityState === "visible") {
        queueRef.current = queueRef.current.then(() => load());
      }
    };

    document.addEventListener("visibilitychange", refresh);

    return () => document.removeEventListener("visibilitychange", refresh);
  }, [enabled, load]);

  // grava no banco só o que mudou
  const sync = useCallback(
    async (next: T[]) => {
      if (!enabledRef.current) return;

      const saved = savedRef.current;
      const nextIds = new Set(next.map((item) => item.id));

      const removed = Array.from(saved.keys()).filter((id) => !nextIds.has(id));
      const added: { id: number; row: Row; json: string }[] = [];
      const changed: { id: number; row: Row; json: string }[] = [];

      next.forEach((item) => {
        const row = toRowRef.current(item);
        const json = JSON.stringify(row);
        const before = saved.get(item.id);

        if (before === undefined) added.push({ id: item.id, row, json });
        else if (before !== json) changed.push({ id: item.id, row, json });
      });

      if (removed.length > 0) {
        const { error } = await supabase.from(table).delete().in(idColumn, removed);

        if (error) throw error;

        removed.forEach((id) => saved.delete(id));
      }

      if (added.length > 0) {
        const { error } = await supabase
          .from(table)
          .insert(added.map((entry) => entry.row));

        if (error) throw error;

        added.forEach((entry) => saved.set(entry.id, entry.json));
      }

      for (const entry of changed) {
        const { error } = await supabase
          .from(table)
          .update(entry.row)
          .eq(idColumn, entry.id);

        if (error) throw error;

        saved.set(entry.id, entry.json);
      }
    },
    [table, idColumn]
  );

  // igual ao setState: aceita um valor novo ou uma função
  const setItems = useCallback(
    (value: T[] | ((current: T[]) => T[])) => {
      const next =
        typeof value === "function"
          ? (value as (current: T[]) => T[])(itemsRef.current)
          : value;

      itemsRef.current = next;
      setItemsState(next);

      const epoch = epochRef.current;

      pendingRef.current += 1;

      queueRef.current = queueRef.current
        .then(() => (epoch === epochRef.current ? sync(next) : undefined))
        .catch(async (error) => {
          console.error(`Erro ao gravar ${table}:`, error);

          // as gravações que estavam na fila atrás desta são descartadas
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
    [load, sync, table]
  );

  return [items, setItems, loaded] as const;
}