"use client";

import { useState } from "react";
import ExportScheduleModal from "../components/ExportScheduleModal";
import type { Adjustment, Collaborator, Fixation, Holiday, Journey, Occurrence, Relocation, Swap } from "../lib/types";
import { getHolidayNotes } from "../lib/holidays";
import type { LayoutBlock } from "../lib/sectorLayout";
import { getOccurrenceNotes, isJustifiedOff } from "../lib/occurrences";
import { getRelocationNotes } from "../lib/relocations";
import { getSwapNotes } from "../lib/swaps";
import { getJourneyNotice, getWeekdayShort } from "../lib/utils";
import SectorSchedule from "../components/SectorSchedule";
import { shiftBadge, shiftLabel } from "../lib/shiftCodes";

type Props = {
  monthLabel: string;
  view: string;
  onViewChange: (value: string) => void;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  onNewShift: () => void;
  sectors: string[];
  roles: string[];
  journeys: Journey[];
  filterSector: string;
  onFilterSector: (value: string) => void;
  filterRole: string;
  onFilterRole: (value: string) => void;
  filterJourney: string;
  onFilterJourney: (value: string) => void;
  days: string[];
  collaborators: Collaborator[];
  allCollaborators: Collaborator[];
  fixations: Fixation[];
  onFixPerson: (person: Collaborator, sector: string, dateIso: string) => void;
  onEditFixation: (fixation: Fixation, person: Collaborator) => void;
  adjustments: Adjustment[];
  swaps: Swap[];
  relocations: Relocation[];
  occurrences: Occurrence[];
  holidays: Holiday[];
  canEdit: boolean;
  blocks: LayoutBlock[];
  onAdjust: (personId: number, dateIso: string, sector: string) => void;
  onSwap: (
    first: { personId: number; sector: string },
    second: { personId: number; sector: string },
    dateIso: string
  ) => void;
  onUndoAdjust: (personId: number, dateIso: string) => void;
  getDateIso: (day: string) => string;
  getShift: (person: Collaborator, day: string) => string;
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  getBaseShiftOn: (person: Collaborator, dateIso: string) => string;
  onSelectCell: (person: Collaborator, day: string) => void;
};

const badgeClass = shiftBadge;

const filterClass = "rounded-lg border bg-white px-3 py-2 text-sm";

const navButton = "rounded-lg border px-4 py-2 text-sm hover:bg-slate-50";

const viewButton = (active: boolean) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
    active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Schedule({
  blocks,
  canEdit,
  holidays,
  occurrences,
  relocations,
  swaps,
  monthLabel,
  view,
  onViewChange,
  onPrevious,
  onToday,
  onNext,
  onNewShift,
  sectors,
  roles,
  journeys,
  filterSector,
  onFilterSector,
  filterRole,
  onFilterRole,
  filterJourney,
  onFilterJourney,
  days,
  collaborators,
  allCollaborators,
  fixations,
  onFixPerson,
  onEditFixation,
  adjustments,
  onAdjust,
  onSwap,
  onUndoAdjust,
  getDateIso,
  getShift,
  getShiftOn,
  getBaseShiftOn,
  onSelectCell,
}: Props) {
    // janela "Enviar escala" (PDF da escala setorial)
    const [exportOpen, setExportOpen] = useState(false);

      // pesquisa por nome (só na Escala padrão)
  const [search, setSearch] = useState("");

  // tira acentos e maiúsculas para a busca achar "joao" em "João"
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const visibleCollaborators = collaborators.filter((person) =>
    normalize(person.name).includes(normalize(search.trim()))
  );

    // nomes por id (para o balão das trocas)
    const nameById = new Map(allCollaborators.map((person) => [person.id, person.name]));

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

      <div className="flex shrink-0 flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex flex-wrap items-center gap-4">

          <div>
            <h2 className="text-xl font-bold">
              Escala de Plantões
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {monthLabel}
            </p>
          </div>

          {/* PADRÃO / SETORIAL */}
          <div className="flex rounded-xl border bg-white p-1">

            <button
              onClick={() => onViewChange("padrao")}
              className={viewButton(view === "padrao")}
            >
              Escala padrão
            </button>

            <button
              onClick={() => onViewChange("setorial")}
              className={viewButton(view === "setorial")}
            >
              Escala setorial
            </button>

          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          <button onClick={onPrevious} className={navButton}>
            ← Anterior
          </button>

          <button onClick={onToday} className={navButton}>
            Atual
          </button>

          <button onClick={onNext} className={navButton}>
            Próximo →
          </button>

          {view === "setorial" && (
            <button
              onClick={() => setExportOpen(true)}
              className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Enviar escala
            </button>
          )}

          <button
            onClick={onNewShift}
            className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${canEdit ? "" : "hidden"}`}
          >
            + Novo plantão
          </button>

        </div>

      </div>

      {view === "padrao" ? (
        <>

          <div className="flex shrink-0 flex-wrap gap-3 border-b bg-slate-50 p-4">

            <select
              value={filterSector}
              onChange={(event) => onFilterSector(event.target.value)}
              className={filterClass}
            >
              <option>Todos os setores</option>
              {sectors.map((sector) => (
                <option key={sector}>{sector}</option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(event) => onFilterRole(event.target.value)}
              className={filterClass}
            >
              <option>Todas as funções</option>
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>

            <select
              value={filterJourney}
              onChange={(event) => onFilterJourney(event.target.value)}
              className={filterClass}
            >
              <option>Todas as escalas</option>
              {journeys.map((journey) => (
                <option key={journey.id}>{journey.name}</option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome..."
              className={`${filterClass} w-64`}
            />

          </div>

          <div className="min-h-0 flex-1 overflow-auto">

            <table className="w-full min-w-[1000px] border-separate border-spacing-0">

              <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">

                <tr className="bg-slate-50">

                  <th className="sticky left-0 z-10 border-b border-r bg-slate-50 px-5 py-4 text-left text-sm font-semibold">
                    Colaborador
                  </th>

                  {days.map((day) => {
                    const weekday = getWeekdayShort(getDateIso(day));
                    const weekend = weekday === "sáb" || weekday === "dom";

                    return (
                      <th
                        key={day}
                        className={`min-w-[65px] border-b border-r px-3 py-3 text-center text-xs font-semibold last:border-r-0 ${
                          weekend ? "bg-slate-100" : ""
                        }`}
                      >
                        <div>{day}</div>
                        <div
                          className={`mt-0.5 text-[10px] font-medium ${
                            weekend ? "text-rose-500" : "text-slate-400"
                          }`}
                        >
                          ({weekday})
                        </div>
                      </th>
                    );
                  })}

                </tr>

              </thead>

              <tbody>

              {visibleCollaborators.length === 0 && (
                  <tr>
                    <td
                      colSpan={days.length + 1}
                      className="px-5 py-8 text-center text-sm text-slate-500"
                    >
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                )}

              {visibleCollaborators.map((person) => (

                  <tr
                    key={person.id}
                    className="group hover:bg-slate-50"
                  >

                    <td className="sticky left-0 z-10 border-b border-r bg-white px-5 py-4 group-hover:bg-slate-50">

                      <div className="font-semibold text-slate-800">
                        {person.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {person.role}
                      </div>

                    </td>

                    {days.map((day) => {
                      const dateIso = getDateIso(day);
                      const shift = getShift(person, day);
                      const notice = getJourneyNotice(person, dateIso);
                      const swapNotes = getSwapNotes(
                        person.id,
                        dateIso,
                        swaps,
                        (id) => nameById.get(id) ?? "colaborador"
                      );
                      const relocationNotes = getRelocationNotes(person.id, dateIso, relocations);
                      const occurrenceNotes = getOccurrenceNotes(person.id, dateIso, occurrences);
                      const justifiedOff = isJustifiedOff(person.id, dateIso, occurrences);
                      const holidayNotes = getHolidayNotes(person.role, dateIso, holidays);
                      const holidayOff = shift === "F" && holidayNotes.length > 0;
                      const tooltip = [notice, ...swapNotes, ...relocationNotes, ...occurrenceNotes, ...holidayNotes]
                        .filter(Boolean)
                        .join("\n\n");
                      const terminated = Boolean(
                        person.terminationDate && dateIso > person.terminationDate
                      );

                      return (
                        <td
                          key={day}
                          className={`border-b border-r px-2 py-3 text-center last:border-r-0 ${
                            terminated ? "bg-slate-50" : ""
                          }`}
                        >

                          <button
                            onClick={() => canEdit && onSelectCell(person, day)}
                            title={tooltip || undefined}
                            disabled={terminated}
                            className={`relative flex h-10 w-full items-center justify-center rounded-lg transition ${canEdit ? "hover:bg-slate-100" : "cursor-default"}`}
                          >

                            {swapNotes.length > 0 && (
                              <span className="absolute left-1 top-0.5 text-[10px] font-bold text-violet-600">
                                ⇄
                              </span>
                            )}

                            {relocationNotes.length > 0 && (
                              <span className="absolute bottom-0.5 left-1 text-[10px] font-bold text-emerald-600">
                                ↻
                              </span>
                            )}

                            {justifiedOff && (
                              <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-amber-600">
                                ✎
                              </span>
                            )}

                            {holidayNotes.length > 0 && (
                              <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[10px] font-bold text-rose-500">
                                ★
                              </span>
                            )}

                            {notice && (
                              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" />
                            )}

                            {badgeClass[shift] && (
                              <span
                                className={`inline-flex h-8 min-w-[2rem] px-1 items-center justify-center rounded-lg text-sm font-bold ${justifiedOff ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400" : holidayOff ? "bg-rose-100 text-rose-700 ring-2 ring-rose-300" : badgeClass[shift]}`}
                              >
                                {shift}
                              </span>
                            )}

                            {!shift && (
                              <span className="text-slate-300">
                                {terminated ? "–" : "+"}
                              </span>
                            )}

                          </button>

                        </td>
                      );
                    })}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-5 border-t px-5 py-4 text-xs text-slate-500">

          {["D", "N", "D/N", "F", "FA", "ATE", "FE"].map((code) => (
              <div key={code} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded ${shiftBadge[code].split(" ")[0]}`} />
                {shiftLabel[code]}
              </div>
            ))}

          </div>

        </>
      ) : (
        <SectorSchedule
        swaps={swaps}
        canEdit={canEdit}
        blocks={blocks}
        relocations={relocations}
        days={days}
        getDateIso={getDateIso}
        collaborators={allCollaborators}
        getShiftOn={getShiftOn}
        getBaseShiftOn={getBaseShiftOn}
        fixations={fixations}
        onFixPerson={onFixPerson}
        onEditFixation={onEditFixation}
        adjustments={adjustments}
        onAdjust={onAdjust}
        onSwap={onSwap}
        onUndoAdjust={onUndoAdjust}
      />
      )}

{exportOpen && (
        <ExportScheduleModal
          days={days}
          getDateIso={getDateIso}
          collaborators={allCollaborators}
          fixations={fixations}
          adjustments={adjustments}
          getShiftOn={getShiftOn}
          onClose={() => setExportOpen(false)}
          blocks={blocks}
        />
      )}

    </section>
  );
}