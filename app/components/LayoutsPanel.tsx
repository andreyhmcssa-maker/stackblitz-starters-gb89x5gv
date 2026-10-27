"use client";

import { useState } from "react";
import type { Sector, SectorLayout } from "../lib/types";
import LayoutEditorModal from "./LayoutEditorModal";

type Props = {
  sectors: Sector[];
  layouts: SectorLayout[];
  rolesFor: (sectorId: number) => string[];
  onSave: (layout: SectorLayout) => void;
  onApplyPsTemplate: (sectorId: number) => void;
  onCopy: (fromSectorId: number, toSectorId: number) => string;
};

// primeiro dia do mês atual (início padrão do rodízio de um layout novo)
const firstOfMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function LayoutsPanel({
  sectors,
  layouts,
  rolesFor,
  onSave,
  onApplyPsTemplate,
  onCopy,
}: Props) {
  const [editing, setEditing] = useState<{ sector: Sector; layout: SectorLayout } | null>(
    null
  );

  const list = sectors
    .filter((sector) => sector.active)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const layoutOf = (sectorId: number) =>
    layouts.find((layout) => layout.sectorId === sectorId);

  const openEditor = (sector: Sector) => {
    setEditing({
      sector,
      layout: layoutOf(sector.id) ?? {
        sectorId: sector.id,
        rotationStart: firstOfMonth(),
        roles: [],
      },
    });
  };

  const handleTemplate = (sector: Sector) => {
    const has = Boolean(layoutOf(sector.id));

    const ok =
      !has ||
      window.confirm(
        `Substituir o layout atual de "${sector.name}" pelo modelo do Pronto Socorro?`
      );

    if (ok) onApplyPsTemplate(sector.id);
  };

  const handleCopy = (sector: Sector, fromId: number) => {
    if (!fromId) return;

    const from = sectors.find((item) => item.id === fromId);

    const ok =
      !layoutOf(sector.id) ||
      window.confirm(
        `Substituir o layout atual de "${sector.name}" pelo layout de "${from?.name}"?`
      );

    if (!ok) return;

    const problem = onCopy(fromId, sector.id);

    if (problem) window.alert(problem);
  };

  return (
    <>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">

        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Cada setor tem o seu layout da escala setorial: as funções, os postos, as
          vagas e as regras do rodízio. Setor sem layout só usa a escala padrão.
        </p>

        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Nenhum setor ativo. Cadastre os setores na aba Setores.
          </p>
        )}

        {list.map((sector) => {
          const layout = layoutOf(sector.id);

          const postCount = layout
            ? layout.roles.reduce((sum, role) => sum + role.posts.length, 0)
            : 0;

          // setores que têm layout e podem servir de origem para copiar
          const sources = list.filter(
            (item) => item.id !== sector.id && layoutOf(item.id)
          );

          return (
            <div
              key={sector.id}
              className="flex flex-col gap-3 rounded-xl border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >

              <div className="space-y-1">

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{sector.name}</span>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      layout
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {layout ? "Layout configurado" : "Sem layout"}
                  </span>
                </div>

                {layout && (
                  <div className="text-xs text-slate-500">
                    {layout.roles.length} {layout.roles.length === 1 ? "função" : "funções"}
                    {" · "}
                    {postCount} {postCount === 1 ? "posto" : "postos"}
                  </div>
                )}

              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">

                <button
                  onClick={() => openEditor(sector)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {layout ? "Editar layout" : "Criar em branco"}
                </button>

                <button
                  onClick={() => handleTemplate(sector)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Modelo do Pronto Socorro
                </button>

                {sources.length > 0 && (
                  <select
                    value=""
                    onChange={(event) => handleCopy(sector, Number(event.target.value))}
                    className="rounded-lg border bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="">Copiar de...</option>
                    {sources.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}

              </div>

            </div>
          );
        })}

      </div>

      {editing && (
        <LayoutEditorModal
          sectorName={editing.sector.name}
          layout={editing.layout}
          roles={rolesFor(editing.sector.id)}
          onSave={onSave}
          onClose={() => setEditing(null)}
        />
      )}

    </>
  );
}