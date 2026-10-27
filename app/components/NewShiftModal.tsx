"use client";

import type { Collaborator } from "../lib/types";

type NewShift = {
  personId: number;
  day: string;
  shift: string;
};

type Props = {
  open: boolean;
  monthLabel: string;
  collaborators: Collaborator[];
  days: string[];
  value: NewShift;
  onChange: (value: NewShift) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function NewShiftModal({
  open,
  monthLabel,
  collaborators,
  days,
  value,
  onChange,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6">
          <h3 className="text-xl font-bold">
            Novo plantão
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {monthLabel}
          </p>
        </div>

        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Colaborador
            </label>
            <select
              value={value.personId}
              onChange={(event) =>
                onChange({ ...value, personId: Number(event.target.value) })
              }
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value={0}>Selecione...</option>
              {collaborators.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Dia
            </label>
            <select
              value={value.day}
              onChange={(event) =>
                onChange({ ...value, day: event.target.value })
              }
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {days.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Turno
            </label>
            <select
              value={value.shift}
              onChange={(event) =>
                onChange({ ...value, shift: event.target.value })
              }
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="D">D - Diurno</option>
              <option value="N">N - Noturno</option>
              <option value="F">F - Folga</option>
            </select>
          </div>

        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Lançar
          </button>
        </div>

      </div>

    </div>
  );
}