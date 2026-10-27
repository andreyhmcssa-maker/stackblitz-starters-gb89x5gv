"use client";

import { useState } from "react";
import type {
  Access,
  AccessInput,
  Permission,
  ProfileKey,
  Sector,
} from "../lib/types";
import {
  PERMISSIONS,
  PROFILES,
  isLockedPermission,
  togglePermission,
} from "../lib/permissions";

type Props = {
  access: Access | null; // null = novo acesso
  sectors: Sector[];
  profilePermissions: Record<ProfileKey, Permission[]>;
  // devolve "" se deu certo, ou a mensagem do problema
  onSave: (input: AccessInput, password: string) => Promise<string>;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// senha provisória: 10 caracteres, sem letras que se confundem (0/O, 1/l/I)
const generatePassword = () => {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(10);

  crypto.getRandomValues(values);

  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
};

export default function AccessModal({
  access,
  sectors,
  profilePermissions,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState(access?.name ?? "");
  const [email, setEmail] = useState(access?.email ?? "");
  const [profile, setProfile] = useState<ProfileKey>(access?.profile ?? "gerencia");
  const [sectorIds, setSectorIds] = useState<number[]>(access?.sectorIds ?? []);
  const [permissions, setPermissions] = useState<Permission[]>(
    access?.permissions ?? profilePermissions.gerencia
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // depois de salvar com senha, mostra os dados para passar para a pessoa
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // setores ativos (e os que a pessoa já tem, mesmo que tenham sido desativados)
  const available = sectors.filter((item) => item.active || sectorIds.includes(item.id));

  // ao trocar o perfil, as permissões voltam ao padrão dele
  const changeProfile = (next: ProfileKey) => {
    setProfile(next);
    setPermissions(profilePermissions[next]);

    if (next === "admin") setSectorIds([]);
    else if (next !== "diretoria") setSectorIds(sectorIds.slice(0, 1));
  };

  const toggleSector = (id: number) => {
    setSectorIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const problem = await onSave({ name, email, profile, sectorIds, permissions }, password);

    setSaving(false);

    if (problem) {
      setError(problem);
      return;
    }

    if (password) {
      setResult({ email: email.trim().toLowerCase(), password });
      return;
    }

    onClose();
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(
        `E-mail: ${result.email}\nSenha provisória: ${result.password}`
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // ───────────── TELA FINAL: dados para passar para a pessoa ─────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

          <h3 className="text-xl font-bold">Acesso salvo</h3>

          <p className="mt-1 text-sm text-slate-500">
            Passe estes dados para a pessoa. A senha provisória não fica guardada em
            lugar nenhum: anote agora. No primeiro acesso ela vai escolher uma senha só dela.
          </p>

          <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div>
              <span className="text-slate-500">E-mail: </span>
              <strong>{result.email}</strong>
            </div>
            <div>
              <span className="text-slate-500">Senha provisória: </span>
              <strong className="font-mono">{result.password}</strong>
            </div>
          </div>

          <div className="mt-6 flex gap-3">

            <button
              onClick={handleCopy}
              className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>

            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Fechar
            </button>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">{access ? "Editar acesso" : "Novo acesso"}</h3>

        <p className="mt-1 text-sm text-slate-500">
          Defina quem é a pessoa, o perfil, o setor e o que ela pode fazer.
        </p>

        <div className="mt-5 space-y-5">

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
              />
            </div>

          </div>

          {/* SENHA PROVISÓRIA */}
          <div>

            <label className="mb-1 block text-sm font-medium">
              {access ? "Nova senha provisória" : "Senha provisória"}
              {access && (
                <span className="ml-1 font-normal text-slate-400">
                  (deixe em branco para não mudar)
                </span>
              )}
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Pelo menos 8 caracteres"
                className={`${fieldClass} font-mono`}
              />

              <button
                onClick={() => setPassword(generatePassword())}
                className="shrink-0 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Gerar
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              A pessoa será obrigada a trocar essa senha no primeiro acesso.
            </p>

          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Perfil</label>
            <select
              value={profile}
              onChange={(event) => changeProfile(event.target.value as ProfileKey)}
              className={fieldClass}
            >
              {PROFILES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {PROFILES.find((item) => item.key === profile)?.description}
            </p>
          </div>

          {/* SETOR */}
          <div>

            <label className="mb-1 block text-sm font-medium">
              {profile === "diretoria" ? "Setores" : "Setor"}
            </label>

            {profile === "admin" && (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                O administrador geral acessa todos os setores.
              </p>
            )}

            {profile === "diretoria" && (
              <div className="flex flex-wrap gap-2">
                {available.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Cadastre os setores na aba Setores primeiro.
                  </p>
                )}

                {available.map((item) => {
                  const active = sectorIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSector(item.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-sky-400 bg-sky-100 text-sky-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {active && "✓ "}
                      {item.name}
                      {!item.active && " (inativo)"}
                    </button>
                  );
                })}
              </div>
            )}

            {profile !== "admin" && profile !== "diretoria" && (
              <select
                value={sectorIds[0] ?? 0}
                onChange={(event) => {
                  const id = Number(event.target.value);

                  setSectorIds(id ? [id] : []);
                }}
                className={fieldClass}
              >
                <option value={0}>Selecione...</option>
                {available.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {!item.active && " (inativo)"}
                  </option>
                ))}
              </select>
            )}

          </div>

          {/* PERMISSÕES */}
          <div>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Permissões</label>

              <button
                onClick={() => setPermissions(profilePermissions[profile])}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Restaurar as do perfil
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {PERMISSIONS.map((item) => {
                const locked = isLockedPermission(profile, item.key);
                const checked = profile === "admin" || permissions.includes(item.key);

                return (
                  <label
                    key={item.key}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      locked ? "bg-slate-50 text-slate-400" : "cursor-pointer hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() =>
                        setPermissions(togglePermission(profile, permissions, item.key))
                      }
                      className="mt-1"
                    />

                    <span>
                      <span className="font-medium">{item.label}</span>
                      <span className="block text-xs text-slate-500">{item.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {profile === "diretoria" && (
              <p className="mt-2 text-xs text-slate-500">
                A Diretoria só visualiza, então as permissões de editar ficam travadas.
              </p>
            )}

          </div>

        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">

          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>

        </div>

      </div>

    </div>
  );
}