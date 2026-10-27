"use client";

import { useState } from "react";
import type { Adjustment, Collaborator, Fixation } from "../lib/types";
import type { LayoutBlock } from "../lib/sectorLayout";
import {
  MAX_EXPORT_DAYS,
  exportSchedulePdf,
  listDates,
} from "../lib/exportSchedulePdf";

type Props = {
  days: string[];
  getDateIso: (day: string) => string;
  collaborators: Collaborator[];
  fixations: Fixation[];
  adjustments: Adjustment[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  blocks: LayoutBlock[];
  onClose: () => void;
};

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

export default function ExportScheduleModal({
  days,
  getDateIso,
  collaborators,
  fixations,
  adjustments,
  getShiftOn,
  blocks,
  onClose,
}: Props) {
  // começa com o mês que está na tela
  const [from, setFrom] = useState(days.length ? getDateIso(days[0]) : "");
  const [to, setTo] = useState(
    days.length ? getDateIso(days[days.length - 1]) : ""
  );
  const [role, setRole] = useState("todas");
  const [shift, setShift] = useState("todos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // funções que têm planilha neste setor
  const roleOptions = Array.from(
    new Map(blocks.map((block) => [block.role, block.roleTitle])).entries()
  );

  const handleExport = async () => {
    if (!from || !to) {
      setError("Escolha a data inicial e a data final.");
      return;
    }

    if (from > to) {
      setError("A data inicial não pode ser depois da data final.");
      return;
    }

    if (listDates(from, to).length > MAX_EXPORT_DAYS) {
      setError(`O período pode ter no máximo ${MAX_EXPORT_DAYS} dias.`);
      return;
    }

    const selected = blocks.filter(
      (block) =>
        (role === "todas" || block.role === role) &&
        (shift === "todos" || block.shift === shift)
    );

    if (selected.length === 0) {
      setError("Este setor não tem planilha para essa escolha.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await exportSchedulePdf({
        blocks: selected,
        collaborators,
        fixations,
        adjustments,
        getShiftOn,
        from,
        to,
      });

      onClose();
    } catch {
      setError("Não consegui gerar o PDF. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">Enviar escala</h3>

        <p className="mt-1 text-sm text-slate-500">
          Gera um PDF da escala setorial com o período escolhido.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">

          <div>
            <label className="mb-1 block text-sm font-medium">De</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Até</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Função</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={fieldClass}
            >
              <option value="todas">Todas</option>
              {roleOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Turno</label>
            <select
              value={shift}
              onChange={(event) => setShift(event.target.value)}
              className={fieldClass}
            >
              <option value="todos">Diurno e noturno</option>
              <option value="D">Diurno</option>
              <option value="N">Noturno</option>
            </select>
          </div>

        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">

          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Gerando..." : "Baixar PDF"}
          </button>

        </div>

      </div>

    </div>
  );
}