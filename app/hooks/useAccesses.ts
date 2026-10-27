import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Access, AccessInput, Permission, ProfileKey } from "../lib/types";
import {
  DEFAULT_PROFILE_PERMISSIONS,
  normalizePermissions,
} from "../lib/permissions";

const PROFILE_KEYS = Object.keys(DEFAULT_PROFILE_PERMISSIONS) as ProfileKey[];

type Row = Record<string, unknown>;

const toAccess = (row: Row): Access => ({
  id: String(row.id),
  name: String(row.name),
  email: String(row.email),
  profile: row.profile as ProfileKey,
  sectorIds: ((row.sector_ids as number[] | null) ?? []).map(Number),
  permissions: (row.permissions as Permission[] | null) ?? [],
  active: Boolean(row.active),
  createdAt: String(row.created_at ?? ""),
});

// Só o administrador carrega e mexe nos acessos (as regras do banco também exigem isso)
export function useAccesses(enabled: boolean) {
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [stored, setStored] = useState<Partial<Record<ProfileKey, Permission[]>>>({});

  const reload = useCallback(async () => {
    const [list, profiles] = await Promise.all([
      supabase.from("accesses").select("*").order("name"),
      supabase.from("profile_permissions").select("*"),
    ]);

    if (list.error) {
      console.error("Erro ao ler os acessos:", list.error.message);
      return;
    }

    setAccesses((list.data as Row[]).map(toAccess));

    if (!profiles.error) {
      const map: Partial<Record<ProfileKey, Permission[]>> = {};

      (profiles.data as Row[]).forEach((row) => {
        map[row.profile as ProfileKey] = row.permissions as Permission[];
      });

      setStored(map);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setAccesses([]);
      return;
    }

    reload();
  }, [enabled, reload]);

  // padrão de cada perfil: o que você salvou vale mais que o padrão de fábrica
  const profilePermissions = PROFILE_KEYS.reduce(
    (result, key) => {
      result[key] = normalizePermissions(
        key,
        stored[key] ?? DEFAULT_PROFILE_PERMISSIONS[key]
      );

      return result;
    },
    {} as Record<ProfileKey, Permission[]>
  );

  // "" = tudo certo
  const checkAccess = (input: AccessInput, ignoreId?: string) => {
    if (!input.name.trim()) return "Informe o nome.";

    const email = input.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail válido.";

    if (accesses.some((item) => item.id !== ignoreId && item.email.toLowerCase() === email)) {
      return "Já existe um acesso com esse e-mail.";
    }

    if (input.profile === "diretoria" && input.sectorIds.length === 0) {
      return "Escolha pelo menos um setor para a Diretoria.";
    }

    if (
      (input.profile === "gerencia" ||
        input.profile === "horizontal" ||
        input.profile === "rh") &&
      input.sectorIds.length !== 1
    ) {
      return "Escolha o setor pelo qual essa pessoa é responsável.";
    }

    return "";
  };

  // chama a função admin-users do Supabase; devolve "" se deu certo ou a mensagem do problema
  const callAdmin = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });

    if (error) {
      return "Não foi possível falar com o servidor. Confira se a função admin-users foi publicada no Supabase.";
    }

    const result = data as { ok?: boolean; error?: string } | null;

    if (!result || result.error) return result?.error ?? "Resposta inesperada do servidor.";

    await reload();

    return "";
  };

  const fieldsOf = (input: AccessInput) => ({
    name: input.name,
    email: input.email,
    profile: input.profile,
    sectorIds: input.sectorIds,
    permissions: input.permissions,
  });

  // As funções abaixo devolvem "" quando deu certo, ou a mensagem do problema

  const addAccess = async (input: AccessInput, password: string) => {
    const problem = checkAccess(input);

    if (problem) return problem;

    if (password.length < 8) {
      return "A senha provisória precisa ter pelo menos 8 caracteres.";
    }

    return callAdmin({ action: "create", ...fieldsOf(input), password });
  };

  // password vazio = não muda a senha
  const updateAccess = async (id: string, input: AccessInput, password: string) => {
    const problem = checkAccess(input, id);

    if (problem) return problem;

    if (password && password.length < 8) {
      return "A senha provisória precisa ter pelo menos 8 caracteres.";
    }

    const current = accesses.find((item) => item.id === id);

    return callAdmin({
      action: "update",
      id,
      ...fieldsOf(input),
      active: current ? current.active : true,
      password,
    });
  };

  const toggleAccess = async (id: string) => {
    const current = accesses.find((item) => item.id === id);

    if (!current) return "Acesso não encontrado.";

    return callAdmin({
      action: "update",
      id,
      ...fieldsOf(current),
      active: !current.active,
      password: "",
    });
  };

  const deleteAccess = async (id: string) => callAdmin({ action: "delete", id });

  // salva o padrão de um perfil (vale para os próximos acessos)
  const saveProfilePermissions = async (profile: ProfileKey, permissions: Permission[]) => {
    const next = normalizePermissions(profile, permissions);

    setStored((current) => ({ ...current, [profile]: next }));

    const { error } = await supabase
      .from("profile_permissions")
      .upsert({ profile, permissions: next });

    if (error) {
      window.alert("Não foi possível salvar as permissões do perfil.");
      await reload();
    }
  };

  return {
    accesses,
    profilePermissions,
    addAccess,
    updateAccess,
    toggleAccess,
    deleteAccess,
    saveProfilePermissions,
  };
}