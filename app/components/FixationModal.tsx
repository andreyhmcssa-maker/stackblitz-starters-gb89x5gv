"use client";

import type { FixationForm, SectorLayout } from "../lib/types";
import { getSectorOptions } from "../lib/sectorLayout";

type Props = {
  value: FixationForm | null;
  error: string;
  onChange: (value: FixationForm) => void;
  onSave: () => void;
  onClose: () => void;
  layout: SectorLayout | undefined;
};

const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export default function FixationModal({
  layout,
  value,
  error,
  onChange,
  onSave,
  onClose,
}: Props) {
  if (!value) return null;

  const sectors = getSectorOptions(value.role, layout);
  const editing = value.id !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-lg font-bold">
          {editing ? "✏️ Editar fixação" : "📌 Fixar no setor"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {value.personName} · {value.role}
        </p>

        <div className="mt-5 space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium">Setor</label>
            <select
              value={value.sector}
              onChange={(event) => onChange({ ...value, sector: event.target.value })}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          <div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="mb-1 block text-sm font-medium">De</label>
                <input
                  type="date"
                  value={value.startDate}
                  onChange={(event) => {
                    const startDate = event.target.value;

                    onChange({
                      ...value,
                      startDate,
                      endDate:
                        value.endDate && value.endDate < startDate
                          ? startDate
                          : value.endDate,
                    });
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Até</label>
                <input
                  type="date"
                  value={value.indefinite ? "" : value.endDate}
                  disabled={value.indefinite}
                  onChange={(event) => onChange({ ...value, endDate: event.target.value })}
                  className={inputClass}
                />
              </div>

            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value.indefinite}
                onChange={(event) =>
                  onChange({ ...value, indefinite: event.target.checked })
                }
                className="h-4 w-4 cursor-pointer accent-blue-600"
              />
              Por tempo indeterminado
            </label>

          </div>

          <p className="text-xs text-slate-500">
            {value.indefinite
              ? "A fixação vale até você desmarcar essa opção e informar a data final."
              : "Nos plantões dentro desse período, a pessoa fica sempre nesse setor. Para fixar só 1 plantão, use a mesma data nos dois campos."}
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {editing ? "Salvar" : "📌 Fixar"}
          </button>
        </div>

      </div>

    </div>
  );
}