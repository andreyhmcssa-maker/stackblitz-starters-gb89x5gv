"use client";

import { useState } from "react";
import type { Access, AccessInput, Permission, ProfileKey, Sector } from "../lib/types";
import {
  PERMISSIONS,
  PROFILES,
  isLockedPermission,
  profileLabel,
  profileStyle,
  togglePermission,
} from "../lib/permissions";
import AccessModal from "./AccessModal";

type Props = {
  sectors: Sector[];
  accesses: Access[];
  profilePermissions: Record<ProfileKey, Permission[]>;
  onAdd: (input: AccessInput, password: string) => Promise<string>;
  onUpdate: (id: string, input: AccessInput, password: string) => Promise<string>;
  onToggle: (id: string) => Promise<string>;
  onDelete: (id: string) => Promise<string>;
  onSaveProfile: (profile: ProfileKey, permissions: Permission[]) => void;
};

const filterClass = "rounded-lg border bg-white px-3 py-2 text-sm";

// tira acentos e maiúsculas para a busca achar "joao" em "João"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function AccessesPanel({
  sectors,
  accesses,
  profilePermissions,
  onAdd,
  onUpdate,
  onToggle,
  onDelete,
  onSaveProfile,
}: Props) {
  const [view, setView] = useState<"pessoas" | "perfis">("pessoas");
  const [search, setSearch] = useState("");
  // null = fechado · { access: null } = novo acesso · { access } = editar
  const [modal, setModal] = useState<{ access: Access | null } | null>(null);

  const sectorName = (id: number) =>
    sectors.find((item) => item.id === id)?.name ?? "Setor removido";

  const list = accesses
    .filter((item) => normalize(item.name).includes(normalize(search.trim())))
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "pt-BR")
    );

    const handleToggle = async (access: Access) => {
      const problem = await onToggle(access.id);
  
      if (problem) window.alert(problem);
    };
  
    const handleDelete = async (access: Access) => {
      if (!window.confirm(`Excluir o acesso de ${access.name}? A pessoa não poderá mais entrar.`)) {
        return;
      }
  
      const problem = await onDelete(access.id);
  
      if (problem) window.alert(problem);
    };

  return (
    <>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-slate-50 p-4">

        <div className="flex rounded-xl border bg-white p-1">
          <button
            onClick={() => setView("pessoas")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              view === "pessoas"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pessoas com acesso
          </button>

          <button
            onClick={() => setView("perfis")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              view === "perfis"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Perfis e permissões
          </button>
        </div>

        {view === "pessoas" && (
          <>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome..."
              className={`${filterClass} w-64`}
            />

            <button
              onClick={() => setModal({ access: null })}
              className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Novo acesso
            </button>
          </>
        )}

      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">

        {/* PESSOAS COM ACESSO */}

        {view === "pessoas" && (
          <>

            {accesses.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum acesso cadastrado. Use + Novo acesso para começar.
              </p>
            )}

            {accesses.length > 0 && list.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum acesso encontrado.
              </p>
            )}

            {list.map((access) => (
              <div
                key={access.id}
                className={`flex flex-col gap-3 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
                  access.active ? "" : "bg-slate-50"
                }`}
              >

                <div className="space-y-1.5">

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-semibold ${
                        access.active ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      {access.name}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${profileStyle[access.profile]}`}
                    >
                      {profileLabel[access.profile]}
                    </span>

                    {!access.active && (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">{access.email}</div>

                  <div className="text-xs text-slate-600">
                    {access.profile === "admin"
                      ? "Todos os setores"
                      : access.sectorIds.map(sectorName).join(", ")}
                    {" · "}
                    {access.permissions.length} de {PERMISSIONS.length} permissões
                  </div>

                </div>

                <div className="flex shrink-0 flex-wrap gap-2">

                  <button
                    onClick={() => setModal({ access })}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleToggle(access)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {access.active ? "Desativar" : "Reativar"}
                  </button>

                  <button
                    onClick={() => handleDelete(access)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>

                </div>

              </div>
            ))}

          </>
        )}

        {/* PERFIS E PERMISSÕES */}

        {view === "perfis" && (
          <>

            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Aqui você define o padrão de cada perfil. A mudança vale para os próximos
              acessos que você criar. Quem já tem acesso mantém as permissões que tem:
              para ajustar, edite o acesso da pessoa.
            </p>

            {PROFILES.map((profile) => (
              <div key={profile.key} className="rounded-xl border">

                <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${profileStyle[profile.key]}`}
                  >
                    {profile.label}
                  </span>

                  <span className="text-xs text-slate-500">{profile.description}</span>
                </div>

                <div className="grid gap-2 p-4 md:grid-cols-2">

                  {PERMISSIONS.map((item) => {
                    const locked = isLockedPermission(profile.key, item.key);
                    const checked = profilePermissions[profile.key].includes(item.key);

                    return (
                      <label
                        key={item.key}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                          locked
                            ? "bg-slate-50 text-slate-400"
                            : "cursor-pointer hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() =>
                            onSaveProfile(
                              profile.key,
                              togglePermission(
                                profile.key,
                                profilePermissions[profile.key],
                                item.key
                              )
                            )
                          }
                          className="mt-1"
                        />

                        <span>
                          <span className="font-medium">{item.label}</span>
                          <span className="block text-xs text-slate-500">
                            {item.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}

                </div>

              </div>
            ))}

          </>
        )}

      </div>

      {modal && (
        <AccessModal
          access={modal.access}
          sectors={sectors}
          profilePermissions={profilePermissions}
          onSave={(input, password) =>
            modal.access
              ? onUpdate(modal.access.id, input, password)
              : onAdd(input, password)
          }
          onClose={() => setModal(null)}
        />
      )}

    </>
  );
}