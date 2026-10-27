import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseReady } from "../lib/supabase";
import type { Access, Permission, ProfileKey } from "../lib/types";

// Quem entrou de verdade: o cadastro de acesso mais o aviso de troca de senha
export type AuthAccess = Access & { mustChangePassword: boolean };

type AccessRow = {
  id: string;
  name: string;
  email: string;
  profile: ProfileKey;
  sector_ids: number[] | null;
  permissions: Permission[] | null;
  active: boolean;
  created_at: string;
};

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AuthAccess | null>(null);
  const [authError, setAuthError] = useState("");

  // Busca o acesso de quem entrou (a regra do banco só deixa ler o próprio)
  const loadAccess = useCallback(async (session: Session | null) => {
    if (!session) {
      setAccess(null);
      return;
    }

    const { data, error } = await supabase
      .from("accesses")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !data || !data.active) {
      setAuthError(
        error
          ? "Não foi possível carregar o seu acesso. Tente de novo."
          : "Seu acesso não existe ou está inativo. Fale com o administrador."
      );

      await supabase.auth.signOut();
      setAccess(null);
      return;
    }

    const row = data as AccessRow;

    setAuthError("");

    setAccess({
      id: row.id,
      name: row.name,
      email: row.email,
      profile: row.profile,
      sectorIds: (row.sector_ids ?? []).map(Number),
      permissions: row.permissions ?? [],
      active: row.active,
      createdAt: row.created_at,
      mustChangePassword: session.user.user_metadata?.must_change_password === true,
    });
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      await loadAccess(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;

      // não chama o banco dentro do próprio aviso de login
      setTimeout(() => {
        loadAccess(session);
      }, 0);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadAccess]);

  // devolve "" se deu certo, ou a mensagem do problema
  const signIn = async (email: string, password: string) => {
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return error ? "E-mail ou senha incorretos." : "";
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccess(null);
  };

  // troca a senha e tira o aviso de "senha provisória"
  const changePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });

    if (error) {
      return "Não foi possível trocar a senha. Escolha uma senha diferente da atual e tente de novo.";
    }

    setAccess((current) => (current ? { ...current, mustChangePassword: false } : current));

    return "";
  };

  return {
    ready: supabaseReady,
    loading,
    access,
    authError,
    signIn,
    signOut,
    changePassword,
  };
}