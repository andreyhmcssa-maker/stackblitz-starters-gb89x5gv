// Ajudas para levar, uma única vez, o que estava salvo no navegador para o banco

// lê uma lista salva no navegador (vazia se não houver ou se estiver estragada)
export const readLocalArray = (key: string): unknown[] => {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return [];

    const data = JSON.parse(raw);

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const isMigrated = (flag: string) => localStorage.getItem(flag) === "1";

export const markMigrated = (flag: string) => localStorage.setItem(flag, "1");