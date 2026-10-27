"use client";

import type { Collaborator } from "../lib/types";

type Props = {
  target: Collaborator | null;
  date: string;
  error: string;
  onDateChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function TerminateModal({
  target,
  date,
  error,
  onDateChange,
  onCancel,
  onConfirm,
}: Props) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6">
          <h3 className="text-xl font-bold">
            Desligar colaborador
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {target.name}
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium">
          Data de desligamento
        </label>

        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <p className="mt-2 text-xs text-slate-500">
          A escala dele continua aparecendo até essa data (inclusive) e não é gerada depois dela.
        </p>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Desligar
          </button>
        </div>

      </div>

    </div>
  );
}