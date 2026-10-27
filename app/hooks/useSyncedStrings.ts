import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Options = {
  table: string; // tabela com uma coluna "name"
  enabled: boolean; // só carrega e grava depois de entrar no sistema
};

// Lista de nomes guardada no Supabase que se comporta como um useState
export function useSyncedStrings({ table, enabled }: Options) {
  const [items, setItemsState] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const itemsRef = useRef<string[]>([]);
  const savedRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const epochRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  });

  const load = useCallback(
    async (force = false) => {
      if (!force && pendingRef.current > 0) return;

      const { data, error } = await supabase.from(table).select("name").order("name");

      if (error) {
        console.error(`Erro ao ler ${table}:`, error.message);
        return;
      }

      if (!force && pendingRef.current > 0) return;

      const list = (data as { name: string }[]).map((row) => row.name);

      itemsRef.current = list;
      savedRef.current = new Set(list);
      setItemsState(list);
      setLoaded(true);
    },
    [table]
  );

  useEffect(() => {
    if (!enabled) {
      itemsRef.current = [];
      savedRef.current = new Set();
      setItemsState([]);
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

  // grava no banco só o que mudou (renomear = apagar o nome antigo e criar o novo)
  const sync = useCallback(
    async (next: string[]) => {
      if (!enabledRef.current) return;

      const saved = savedRef.current;
      const nextSet = new Set(next);

      const removed = Array.from(saved).filter((name) => !nextSet.has(name));
      const added = next.filter((name) => !saved.has(name));

      if (removed.length > 0) {
        const { error } = await supabase.from(table).delete().in("name", removed);

        if (error) throw error;

        removed.forEach((name) => saved.delete(name));
      }

      if (added.length > 0) {
        const { error } = await supabase.from(table).insert(added.map((name) => ({ name })));

        if (error) throw error;

        added.forEach((name) => saved.add(name));
      }
    },
    [table]
  );

  const setItems = useCallback(
    (value: string[] | ((current: string[]) => string[])) => {
      const next =
        typeof value === "function"
          ? (value as (current: string[]) => string[])(itemsRef.current)
          : value;

      itemsRef.current = next;
      setItemsState(next);

      const epoch = epochRef.current;

      pendingRef.current += 1;

      queueRef.current = queueRef.current
        .then(() => (epoch === epochRef.current ? sync(next) : undefined))
        .catch(async (error) => {
          console.error(`Erro ao gravar ${table}:`, error);

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