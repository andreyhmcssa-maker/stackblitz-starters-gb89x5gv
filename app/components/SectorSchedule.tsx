"use client";

import { useRef, useState } from "react";
import type { Adjustment, Collaborator, Fixation, Relocation, Swap } from "../lib/types";
import { getRelocationNotes } from "../lib/relocations";
import { getSwapNotes } from "../lib/swaps";
import { getWeekdayShort, shortName } from "../lib/utils";
import type { LayoutBlock } from "../lib/sectorLayout";
import type { SectorRow, SectorRowKind } from "../lib/sectorLayout";
import {
  buildMonthAssignments,
  getAbsencePeriod,
  getAbsences,
  getActiveFixation,
} from "../lib/sectorAssignment";
import AbsenceListModal from "./AbsenceListModal";
import type { AbsenceList } from "./AbsenceListModal";
import type { DayAssignment, Slot } from "../lib/sectorAssignment";
import DayActionModal from "./DayActionModal";
import type { DayAction, DayPeer, DayStatus } from "./DayActionModal";

type SwapSide = { personId: number; sector: string };

type Props = {
  days: string[];
  getDateIso: (day: string) => string;
  collaborators: Collaborator[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  getBaseShiftOn: (person: Collaborator, dateIso: string) => string;
  fixations: Fixation[];
  adjustments: Adjustment[];
  swaps: Swap[];
  relocations: Relocation[];
  canEdit: boolean;
  blocks: LayoutBlock[];
  onFixPerson: (person: Collaborator, sector: string, dateIso: string) => void;
  onEditFixation: (fixation: Fixation, person: Collaborator) => void;
  onAdjust: (personId: number, dateIso: string, sector: string) => void;
  onSwap: (first: SwapSide, second: SwapSide, dateIso: string) => void;
  onUndoAdjust: (personId: number, dateIso: string) => void;
};

// Linha que aparece na tela: setor da lista, vaga EXTRA de um setor ou EXCEDENTE
type DisplayRow =
  | { type: "row"; row: SectorRow; rowIndex: number }
  | { type: "extra"; sector: string; position: number }
  | { type: "excedente"; position: number };

const SECTOR_WIDTH = 220;
const DAY_WIDTH = 100;


// Visual de cada tipo de linha (coluna do setor e células dos dias)
const rowStyle: Record<SectorRowKind, { label: string; cell: string }> = {
  posto: {
    label: "bg-white font-medium text-slate-700",
    cell: "",
  },
  quantidade: {
    label: "bg-slate-100 font-bold text-slate-800",
    cell: "bg-slate-100",
  },
  ausencias: {
    label: "bg-rose-50 font-bold text-rose-700",
    cell: "bg-rose-50",
  },
  "quantidade-ausencias": {
    label: "bg-rose-50 font-bold text-rose-700",
    cell: "bg-rose-50",
  },
};

// Visual do nome na célula, conforme a situação
const chipStyle: Record<DayStatus, string> = {
  rodizio: "hover:bg-slate-100",
  fixado: "bg-amber-100 font-semibold text-amber-800 hover:bg-amber-200",
  ajustado: "bg-sky-100 font-semibold text-sky-800 hover:bg-sky-200",
  excedente: "bg-red-100 font-semibold text-red-700 hover:bg-red-200",
};

const chipIcon: Record<DayStatus, string> = {
  rodizio: "",
  fixado: "📌 ",
  ajustado: "✋ ",
  excedente: "⚠ ",
};

const statusOf = (slot: Slot): DayStatus =>
  slot.adjusted ? "ajustado" : slot.fixed ? "fixado" : "rodizio";

// Todo mundo que está em algum setor no dia (para a opção "Trocar com...")
const peersOf = (
  assignment: DayAssignment,
  rows: SectorRow[],
  personId: number
): DayPeer[] => {
  const peers: DayPeer[] = [];

  assignment.byRow.forEach((slot, index) => {
    if (slot && slot.person.id !== personId) {
      peers.push({ person: slot.person, sector: rows[index].label });
    }
  });

  Object.entries(assignment.extras).forEach(([sector, slots]) => {
    slots.forEach((slot) => {
      if (slot.person.id !== personId) {
        peers.push({ person: slot.person, sector });
      }
    });
  });

  return peers;
};

export default function SectorSchedule({
  blocks,
  canEdit,
  relocations,
  swaps,
  days,
  getDateIso,
  collaborators,
  getShiftOn,
  getBaseShiftOn,
  fixations,
  adjustments,
  onFixPerson,
  onEditFixation,
  onAdjust,
  onSwap,
  onUndoAdjust,
}: Props) {
  // largura exata da grade: setor + todos os dias
  const tableWidth = SECTOR_WIDTH + days.length * DAY_WIDTH;

  // menu aberto ao clicar num nome (null = fechado)
  const [action, setAction] = useState<DayAction | null>(null);

    // lista de ausentes aberta ao clicar no número (null = fechada)
    const [absenceList, setAbsenceList] = useState<AbsenceList | null>(null);

      // nomes por id (para o balão das trocas)
  const nameById = new Map(collaborators.map((person) => [person.id, person.name]));

  const swapNotesOf = (personId: number, dateIso: string) =>
    getSwapNotes(personId, dateIso, swaps, (id) => nameById.get(id) ?? "colaborador");

      // sem permissão de editar, clicar no nome não abre o menu do dia
  const openAction = (value: DayAction) => {
    if (canEdit) setAction(value);
  };

  // rolagem lateral de cada bloco, para manter os 4 sincronizados
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);

  const syncScroll = (index: number) => {
    const source = scrollRefs.current[index];

    if (!source) return;

    scrollRefs.current.forEach((element, position) => {
      if (
        element &&
        position !== index &&
        element.scrollLeft !== source.scrollLeft
      ) {
        element.scrollLeft = source.scrollLeft;
      }
    });
  };

  // Nome na célula: clicar abre o menu de opções do dia
  const renderPerson = (
    person: Collaborator,
    sector: string,
    dateIso: string,
    status: DayStatus,
    assignment: DayAssignment,
    rows: SectorRow[]
  ) => (
    <button
      onClick={() =>
        openAction({
          person,
          sector,
          dateIso,
          status,
          fixation: getActiveFixation(fixations, person.id, dateIso),
          peers: status === "excedente" ? [] : peersOf(assignment, rows, person.id),
          sectorOptions: Array.from(
            new Set(rows.filter((row) => row.kind === "posto").map((row) => row.label))
          ),
        })
      }
      title={[
        `${person.name}${canEdit ? " · clique para ver as opções" : ""}`,
        ...swapNotesOf(person.id, dateIso),
        ...getRelocationNotes(person.id, dateIso, relocations),
      ].join("\n\n")}
      className={`block w-full truncate rounded-md px-1 py-1 transition ${chipStyle[status]}`}
    >
      {chipIcon[status]}
      {getRelocationNotes(person.id, dateIso, relocations).length > 0 && (
        <span className="mr-0.5 text-emerald-600">↻</span>
      )}
      {swapNotesOf(person.id, dateIso).length > 0 && (
        <span className="mr-0.5 text-violet-600">⇄</span>
      )}
      {shortName(person.name)}
    </button>
  );

  return (
    <>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">

      {blocks.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Este setor ainda não tem layout da escala setorial. O administrador
            configura em Configurações &gt; Layouts da escala.
          </div>
        )}

        {/* LEGENDA */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="rounded-md border bg-white px-2 py-1">Rodízio</span>
          <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">
            📌 Fixado
          </span>
          <span className="rounded-md bg-sky-100 px-2 py-1 font-semibold text-sky-800">
            ✋ Ajuste do dia
          </span>
          <span className="rounded-md bg-red-100 px-2 py-1 font-semibold text-red-700">
            ⚠ Excedente
          </span>
          <span className="text-slate-400">{canEdit && "Clique num nome para ver as opções."}</span>
        </div>

        {blocks.map((block, blockIndex) => {
                    // quem pertence a esta planilha: a função dela + as funções com setor próprio
                    const blockPeople = collaborators.filter(
                      (person) =>
                        person.role === block.role || Boolean(block.homeSectors?.[person.role])
                    );
          
                    // quem trabalha em cada dia neste bloco, já distribuído nos setores
                    const assignments = buildMonthAssignments({
                      rows: block.rows,
                      people: blockPeople,
                      shift: block.shift,
                      dates: days.map((day) => getDateIso(day)),
                      fixations,
                      adjustments,
                      homeSectors: block.homeSectors,
                      rotationStart: block.rotationStart,
                      spillSector: block.spill,
                      getShiftOn,
                    });

          // quantas vagas EXTRA cada setor precisa no mês (maior número entre os dias)
          const maxExtras: Record<string, number> = {};

          assignments.forEach((assignment) => {
            Object.entries(assignment.extras).forEach(([sector, slots]) => {
              maxExtras[sector] = Math.max(maxExtras[sector] ?? 0, slots.length);
            });
          });

          // quantas linhas de EXCEDENTE este bloco precisa no mês
          const maxOverflow = Math.max(
            0,
            ...assignments.map((assignment) => assignment.overflow.length)
          );

          // ordem na tela: setores (com as vagas EXTRA logo abaixo de cada um)
          // → excedentes → resumo (quantidade/ausências)
          const firstSummary = block.rows.findIndex((row) => row.kind !== "posto");
          const postoRows = block.rows.slice(0, firstSummary);
          const postoLabels = postoRows.map((row) => row.label);

          const displayRows: DisplayRow[] = [];

          postoRows.forEach((row, rowIndex) => {
            displayRows.push({ type: "row", row, rowIndex });

            // depois da última linha deste setor, entram as vagas EXTRA dele
            if (postoLabels.lastIndexOf(row.label) === rowIndex) {
              for (let position = 0; position < (maxExtras[row.label] ?? 0); position++) {
                displayRows.push({ type: "extra", sector: row.label, position });
              }
            }
          });

          for (let position = 0; position < maxOverflow; position++) {
            displayRows.push({ type: "excedente", position });
          }

          block.rows.slice(firstSummary).forEach((row, offset) => {
            displayRows.push({ type: "row", row, rowIndex: firstSummary + offset });
          });

          return (
            <div
              key={block.id}
              className="w-fit max-w-full overflow-hidden rounded-xl border bg-white will-change-transform"
            >

              {/* ROLAGEM LATERAL (só o conteúdo anda, a moldura fica parada) */}
              <div
                ref={(element) => {
                  scrollRefs.current[blockIndex] = element;
                }}
                onScroll={() => syncScroll(blockIndex)}
                className="overflow-x-auto"
              >

                <div style={{ width: tableWidth }}>

                  {/* TÍTULO DO BLOCO */}
                  <div
                    className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wide ${block.header}`}
                  >
                    <span className="sticky left-4 inline-block">
                      {block.title}
                    </span>
                  </div>

                  <table
                    className="table-fixed border-separate border-spacing-0"
                    style={{ width: tableWidth }}
                  >

                    <colgroup>
                      <col style={{ width: SECTOR_WIDTH }} />
                      {days.map((day) => (
                        <col key={day} style={{ width: DAY_WIDTH }} />
                      ))}
                    </colgroup>

                    {/* SETOR + DATAS E DIAS DA SEMANA */}
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 border-b border-r bg-slate-50 px-3 py-2 text-left text-xs font-semibold">
                          SETOR
                        </th>

                        {days.map((day) => {
                          const weekday = getWeekdayShort(getDateIso(day));
                          const weekend = weekday === "sáb" || weekday === "dom";

                          return (
                            <th
                              key={day}
                              className={`border-b border-r px-1 py-2 text-center text-xs font-semibold last:border-r-0 ${
                                weekend ? "bg-slate-100" : "bg-slate-50"
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

                    {/* LINHAS */}
                    <tbody>
                      {displayRows.map((item, displayIndex) => {
                        const isLast = displayIndex === displayRows.length - 1;
                        const bottomBorder = isLast ? "" : "border-b";
                        const cellBase = `h-9 border-r px-1.5 text-center text-[11px] leading-4 text-slate-700 last:border-r-0 ${bottomBorder}`;

                        // VAGA EXTRA DE UM SETOR
                        if (item.type === "extra") {
                          return (
                            <tr key={`${block.id}-extra-${item.sector}-${item.position}`}>

                              <td
                                title={`${item.sector} (vaga extra)`}
                                className={`sticky left-0 z-10 h-9 truncate border-r bg-amber-50 px-3 py-2 text-xs font-medium leading-4 text-amber-900 ${bottomBorder}`}
                              >
                                {item.sector}
                                <span className="ml-1.5 inline-block rounded bg-amber-200 px-1 align-middle text-[9px] font-bold leading-4">
                                  EXTRA
                                </span>
                              </td>

                              {days.map((day, dayIndex) => {
                                const assignment = assignments[dayIndex];
                                const slot = assignment.extras[item.sector]?.[item.position];

                                return (
                                  <td key={day} className={cellBase}>
                                    {slot &&
                                      renderPerson(
                                        slot.person,
                                        item.sector,
                                        getDateIso(day),
                                        statusOf(slot),
                                        assignment,
                                        block.rows
                                      )}
                                  </td>
                                );
                              })}

                            </tr>
                          );
                        }

                        // EXCEDENTE
                        if (item.type === "excedente") {
                          return (
                            <tr key={`${block.id}-excedente-${item.position}`}>

                              <td
                                className={`sticky left-0 z-10 h-9 truncate border-r bg-red-50 px-3 py-2 text-xs font-bold leading-4 text-red-700 ${bottomBorder}`}
                              >
                                ⚠ EXCEDENTE
                              </td>

                              {days.map((day, dayIndex) => {
                                const assignment = assignments[dayIndex];
                                const person = assignment.overflow[item.position];

                                return (
                                  <td key={day} className={cellBase}>
                                    {person &&
                                      renderPerson(
                                        person,
                                        "",
                                        getDateIso(day),
                                        "excedente",
                                        assignment,
                                        block.rows
                                      )}
                                  </td>
                                );
                              })}

                            </tr>
                          );
                        }

                        // LINHA DE SETOR OU DE RESUMO
                        const { row, rowIndex } = item;
                        const style = rowStyle[row.kind];

                        return (
                          <tr key={`${block.id}-${rowIndex}`}>

                            <td
                              title={row.label}
                              className={`sticky left-0 z-10 h-9 truncate border-r px-3 py-2 text-xs leading-4 ${bottomBorder} ${style.label}`}
                            >
                              {row.label}
                            </td>

                            {days.map((day, dayIndex) => {
                              const assignment = assignments[dayIndex];
                              const dateIso = getDateIso(day);
                              let content = null;

                              if (row.kind === "posto") {
                                const slot = assignment.byRow[rowIndex];

                                if (slot) {
                                  content = renderPerson(
                                    slot.person,
                                    row.label,
                                    dateIso,
                                    statusOf(slot),
                                    assignment,
                                    block.rows
                                  );
                                }
                              }

                              if (row.kind === "quantidade") {
                                const hasOverflow = assignment.overflow.length > 0;

                                content = (
                                  <span
                                    title={
                                      hasOverflow
                                        ? `${assignment.overflow.length} sem setor`
                                        : undefined
                                    }
                                    className={`block font-bold ${
                                      hasOverflow ? "text-red-600" : "text-slate-800"
                                    }`}
                                  >
                                    {assignment.total}
                                    {hasOverflow && " ⚠"}
                                  </span>
                                );
                              }

                              if (row.kind === "ausencias") {
                                const absences = getAbsences(
                                  blockPeople,
                                  dateIso,
                                  block.shift,
                                  getShiftOn,
                                  getBaseShiftOn
                                );

                                if (absences.length > 0) {
                                  content = (
                                    <button
                                      onClick={() =>
                                        setAbsenceList({
                                          title: block.title,
                                          dateIso,
                                          items: absences.map((absence) => ({
                                            ...absence,
                                            ...getAbsencePeriod(
                                              absence.person,
                                              absence.code,
                                              dateIso,
                                              getShiftOn,
                                              getBaseShiftOn
                                            ),
                                          })),
                                        })
                                      }
                                      title="Clique para ver quem está ausente"
                                      className="mx-auto block min-w-[2rem] rounded-md bg-rose-200 px-2 py-1 font-bold text-rose-800 transition hover:bg-rose-300"
                                    >
                                      {absences.length}
                                    </button>
                                  );
                                }
                              }

                              return (
                                <td key={day} className={`${cellBase} ${style.cell}`}>
                                  {content}
                                </td>
                              );
                            })}

                          </tr>
                        );
                      })}
                    </tbody>

                  </table>

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* MENU DO DIA (ao clicar num nome) */}
      <DayActionModal
        key={action ? `${action.person.id}-${action.dateIso}` : "fechado"}
        action={action}
        onClose={() => setAction(null)}
        onMove={(sector) => {
          if (!action) return;
          onAdjust(action.person.id, action.dateIso, sector);
          setAction(null);
        }}
        onSwap={(peer) => {
          if (!action) return;
          onSwap(
            { personId: action.person.id, sector: action.sector },
            { personId: peer.person.id, sector: peer.sector },
            action.dateIso
          );
          setAction(null);
        }}
        onUndo={() => {
          if (!action) return;
          onUndoAdjust(action.person.id, action.dateIso);
          setAction(null);
        }}
        onFix={() => {
          if (!action) return;
          onFixPerson(action.person, action.sector, action.dateIso);
          setAction(null);
        }}
        onEditFixation={() => {
          if (!action || !action.fixation) return;
          onEditFixation(action.fixation, action.person);
          setAction(null);
        }}
      />

            {/* LISTA DE AUSENTES (ao clicar no número da linha AUSÊNCIAS) */}
            <AbsenceListModal list={absenceList} onClose={() => setAbsenceList(null)} />

    </>
  );
}