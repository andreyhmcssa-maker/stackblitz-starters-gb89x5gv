"use client";

import { useState } from "react";
import type { SectorLayout } from "../lib/types";
import LayoutsPanel from "../components/LayoutsPanel";
import type { Access, AccessInput, Permission, ProfileKey, Sector } from "../lib/types";
import SectorModal from "../components/SectorModal";
import AccessesPanel from "../components/AccessesPanel";

type Props = {
  sectors: Sector[];
  countBySector: (name: string) => { active: number; terminated: number };
  onAddSector: (name: string) => string;
  onRenameSector: (id: number, name: string) => string;
  onToggleSector: (id: number) => string;
  onDeleteSector: (id: number) => string;
  accesses: Access[];
  profilePermissions: Record<ProfileKey, Permission[]>;
  onAddAccess: (input: AccessInput, password: string) => Promise<string>;
  onUpdateAccess: (id: string, input: AccessInput, password: string) => Promise<string>;
  onToggleAccess: (id: string) => Promise<string>;
  onDeleteAccess: (id: string) => Promise<string>;
  onSaveProfile: (profile: ProfileKey, permissions: Permission[]) => void;
  layouts: SectorLayout[];
  rolesFor: (sectorId: number) => string[];
  onSaveLayout: (layout: SectorLayout) => void;
  onApplyPsTemplate: (sectorId: number) => void;
  onCopyLayout: (fromSectorId: number, toSectorId: number) => string;
};

const tabs = ["Setores", "Acessos", "Layouts da escala"];

export default function Settings({
  sectors,
  countBySector,
  onAddSector,
  onRenameSector,
  onToggleSector,
  onDeleteSector,
  accesses,
  profilePermissions,
  onAddAccess,
  onUpdateAccess,
  onToggleAccess,
  onDeleteAccess,
  onSaveProfile,
  layouts,
  rolesFor,
  onSaveLayout,
  onApplyPsTemplate,
  onCopyLayout,
}: Props) {
  const [tab, setTab] = useState("Setores");
  // null = fechado · { sector: null } = novo setor · { sector } = renomear
  const [modal, setModal] = useState<{ sector: Sector | null } | null>(null);

  // ativos primeiro, em ordem alfabética
  const list = [...sectors].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "pt-BR")
  );

  // quantos acessos são responsáveis por esse setor
  const accessesIn = (sector: Sector) =>
    accesses.filter((item) => item.sectorIds.includes(sector.id)).length;

  const handleToggle = (sector: Sector) => {
    const used = accessesIn(sector);

    if (sector.active && used > 0) {
      window.alert(
        `Este setor tem ${used} acesso(s) responsável(is) por ele. Mude o setor desses acessos antes de desativar.`
      );
      return;
    }

    const problem = onToggleSector(sector.id);

    if (problem) window.alert(problem);
  };

  const handleDelete = (sector: Sector) => {
    const used = accessesIn(sector);

    if (used > 0) {
      window.alert(
        `Este setor tem ${used} acesso(s) responsável(is) por ele. Mude o setor desses acessos antes de excluir.`
      );
      return;
    }

    if (!window.confirm(`Excluir o setor "${sector.name}"?`)) return;

    const problem = onDeleteSector(sector.id);

    if (problem) window.alert(problem);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

      <div className="flex shrink-0 flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex flex-wrap items-center gap-4">

          <div>
            <h2 className="text-xl font-bold">Configurações</h2>

            <p className="mt-1 text-sm text-slate-500">Administração do sistema</p>
          </div>

          <div className="flex flex-wrap rounded-xl border bg-white p-1">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === item
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

        </div>

        {tab === "Setores" && (
          <button
            onClick={() => setModal({ sector: null })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo setor
          </button>
        )}

      </div>

      {tab === "Layouts da escala" && (
        <LayoutsPanel
          sectors={sectors}
          layouts={layouts}
          rolesFor={rolesFor}
          onSave={onSaveLayout}
          onApplyPsTemplate={onApplyPsTemplate}
          onCopy={onCopyLayout}
        />
      )}

      {tab === "Acessos" && (
        <AccessesPanel
          sectors={sectors}
          accesses={accesses}
          profilePermissions={profilePermissions}
          onAdd={onAddAccess}
          onUpdate={onUpdateAccess}
          onToggle={onToggleAccess}
          onDelete={onDeleteAccess}
          onSaveProfile={onSaveProfile}
        />
      )}

      {tab === "Setores" && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">

          {list.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              Nenhum setor cadastrado. Use + Novo setor para começar.
            </p>
          )}

          {list.map((sector) => {
            const counts = countBySector(sector.name);
            const used = accessesIn(sector);

            return (
              <div
                key={sector.id}
                className={`flex flex-col gap-3 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
                  sector.active ? "" : "bg-slate-50"
                }`}
              >

                <div className="space-y-1">

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-semibold ${
                        sector.active ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      {sector.name}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        sector.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {sector.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {counts.active} {counts.active === 1 ? "colaborador" : "colaboradores"}
                    {counts.terminated > 0 &&
                      ` · ${counts.terminated} ${counts.terminated === 1 ? "desligado" : "desligados"}`}
                    {used > 0 && ` · ${used} ${used === 1 ? "acesso" : "acessos"}`}
                  </div>

                </div>

                <div className="flex shrink-0 flex-wrap gap-2">

                  <button
                    onClick={() => setModal({ sector })}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Renomear
                  </button>

                  <button
                    onClick={() => handleToggle(sector)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {sector.active ? "Desativar" : "Reativar"}
                  </button>

                  <button
                    onClick={() => handleDelete(sector)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {modal && (
        <SectorModal
          sector={modal.sector}
          onSave={(name) =>
            modal.sector ? onRenameSector(modal.sector.id, name) : onAddSector(name)
          }
          onClose={() => setModal(null)}
        />
      )}

    </section>
  );
}