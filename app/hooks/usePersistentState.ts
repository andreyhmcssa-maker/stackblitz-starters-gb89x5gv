import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);

      if (saved) {
        setValue(JSON.parse(saved));
      }
    } catch {
      // se der algum problema ao ler, segue com os dados iniciais
    }

    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}