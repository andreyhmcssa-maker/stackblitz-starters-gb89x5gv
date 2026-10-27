import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// false = faltam as chaves no arquivo .env.local
export const supabaseReady = Boolean(url && key);

// Cliente do navegador: usa só a chave pública. A segurança de verdade
// fica nas regras do banco (RLS) que você criou no Supabase.
export const supabase = createClient(
  url ?? "https://exemplo.supabase.co",
  key ?? "chave-ausente"
);