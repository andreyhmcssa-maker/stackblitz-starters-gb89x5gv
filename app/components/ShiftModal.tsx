"use client";

import { shiftBadge, shiftLabel } from "../lib/shiftCodes";

type Props = {
  cell: { personId: number; personName: string; day: string } | null;
  notice: string | null;
  hasManualShift: boolean;
  onChange: (shift: string) => void;
  onClear: () => void;
  onClose: () => void;
};

const workCodes = ["D", "N", "F"];
const absenceCodes = ["FA", "ATE", "FE"];

export default function ShiftModal({
  cell,
  notice,
  hasManualShift,
  onChange,
  onClear,
  onClose,
}: Props) {
  if (!cell) return null;

  const option = (code: string) => (
    <button
      key={code}
      onClick={() => onChange(code)}
      className={`flex flex-col items-center rounded-xl px-3 py-3 text-sm font-bold transition hover:opacity-80 ${shiftBadge[code]}`}
    >
      {code}
      <span className="mt-0.5 text-[11px] font-medium">{shiftLabel[code]}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-lg font-bold">{cell.personName}</h3>
        <p className="mt-1 text-sm text-slate-500">Dia {cell.day}</p>

        {notice && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {notice}
          </p>
        )}

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Plantão
        </p>
        <div className="grid grid-cols-3 gap-2">{workCodes.map(option)}</div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ausência
        </p>
        <div className="grid grid-cols-3 gap-2">{absenceCodes.map(option)}</div>

        {hasManualShift && (
          <button
            onClick={onClear}
            className="mt-5 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Limpar (volta ao automático)
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>

      </div>

    </div>
  );
}