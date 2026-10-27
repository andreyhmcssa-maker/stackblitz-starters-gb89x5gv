"use client";

import { useState } from "react";
import type { Sector } from "../lib/types";


const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Frame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-800">

      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-2xl">
            🏥
          </div>

          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {children}

      </div>

    </div>
  );
}

// ───────────── FALTAM AS CHAVES DO SUPABASE ─────────────

export function SetupMissingScreen() {
  return (
    <Frame title="Falta configurar" subtitle="O sistema ainda não achou as chaves do Supabase.">

      <p className="text-sm text-slate-600">
        Crie o arquivo <strong>.env.local</strong> na raiz do projeto com
        NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY e reinicie o site.
        Na Vercel, cadastre as mesmas duas variáveis em Settings &gt; Environment
        Variables.
      </p>

    </Frame>
  );
}

// ───────────── LOGIN ─────────────

type LoginProps = {
  authError: string;
  onSignIn: (email: string, password: string) => Promise<string>;
};

export function LoginScreen({ authError, onSignIn }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Informe o e-mail e a senha.");
      return;
    }

    setError("");
    setLoading(true);

    const problem = await onSignIn(email, password);

    if (problem) setError(problem);

    setLoading(false);
  };

  return (
    <Frame title="Entrar no sistema" subtitle="Use o e-mail e a senha do seu acesso.">

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input
            type="email"
            value={email}
            autoComplete="username"
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        {(error || authError) && (
          <p className="text-sm font-medium text-red-600">{error || authError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

      </form>

    </Frame>
  );
}

// ───────────── TROCAR A SENHA PROVISÓRIA ─────────────

type ChangePasswordProps = {
  name: string;
  onChange: (password: string) => Promise<string>;
  onLogout: () => void;
};

export function ChangePasswordScreen({ name, onChange, onLogout }: ChangePasswordProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As duas senhas não são iguais.");
      return;
    }

    setError("");
    setLoading(true);

    const problem = await onChange(password);

    if (problem) setError(problem);

    setLoading(false);
  };

  return (
    <Frame title={`Olá, ${name}`} subtitle="Defina uma senha nova para continuar.">

      <form onSubmit={handleSubmit} className="space-y-4">

        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Você entrou com uma senha provisória. Escolha uma senha só sua, com pelo
          menos 8 caracteres.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">Nova senha</label>
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Repita a nova senha</label>
          <input
            type="password"
            value={confirm}
            autoComplete="new-password"
            onChange={(event) => setConfirm(event.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={onLogout}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Sair
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar senha"}
          </button>

        </div>

      </form>

    </Frame>
  );
}

// ───────────── ESCOLHER O SETOR (administrador e Diretoria) ─────────────

type PickerProps = {
  name: string;
  choices: Sector[];
  isAdmin: boolean;
  countActive: (sectorName: string) => number;
  onChoose: (sectorId: number) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
};

export function SectorPickerScreen({
  name,
  choices,
  isAdmin,
  countActive,
  onChoose,
  onOpenSettings,
  onLogout,
}: PickerProps) {
  const list = [...choices].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <Frame title={`Olá, ${name}`} subtitle="Qual setor você quer ver?">

      <div className="max-h-80 space-y-2 overflow-y-auto">

        {list.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">
            {isAdmin
              ? "Nenhum setor ativo. Cadastre os setores em Configurações."
              : "Nenhum setor ativo para o seu acesso. Fale com o administrador."}
          </p>
        )}

        {list.map((sector) => {
          const count = countActive(sector.name);

          return (
            <button
              key={sector.id}
              onClick={() => onChoose(sector.id)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition hover:bg-slate-50"
            >
              <span className="text-sm font-semibold">{sector.name}</span>

              <span className="shrink-0 text-xs text-slate-500">
                {count} {count === 1 ? "colaborador" : "colaboradores"}
              </span>
            </button>
          );
        })}

      </div>

      <div className="mt-4 flex gap-3">

        {isAdmin && list.length === 0 && (
          <button
            onClick={onOpenSettings}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Abrir Configurações
          </button>
        )}

        <button
          onClick={onLogout}
          className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Sair
        </button>

      </div>

    </Frame>
  );
}

// ───────────── ACESSO SEM SETOR VÁLIDO ─────────────

export function NoSectorScreen({ name, onLogout }: { name: string; onLogout: () => void }) {
  return (
    <Frame title={`Olá, ${name}`} subtitle="Seu acesso ainda não tem um setor válido.">

      <p className="text-sm text-slate-600">
        O setor ligado ao seu acesso não existe mais. Fale com o administrador para
        ajustar o seu acesso.
      </p>

      <button
        onClick={onLogout}
        className="mt-5 w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Sair
      </button>

    </Frame>
  );
}