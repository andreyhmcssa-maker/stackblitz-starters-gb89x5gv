"use client";

import type { Collaborator } from "../lib/types";
import { formatDate } from "../lib/utils";
import { shiftBadge, shiftLabel } from "../lib/shiftCodes";

export type AbsenceItem = {
  person: Collaborator;
  code: string;
  start: string;
  end: string;
  days: number;
  shifts: number;
};

export type AbsenceList = {
  title: string;
  dateIso: string;
  items: AbsenceItem[];
};

type Props = {
  list: AbsenceList | null;
  onClose: () => void;
};

export default function AbsenceListModal({ list, onClose }: Props) {
  if (!list) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-lg font-bold">Ausências</h3>

        <p className="mt-1 text-sm text-slate-500">
          {list.title} · {formatDate(list.dateIso)}
        </p>

        <div className="mt-5 space-y-2">
          {list.items.map((item) => (
            <div key={item.person.id} className="rounded-xl border px-4 py-3">

              <div className="flex items-center justify-between gap-3">

                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {item.person.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${shiftBadge[item.code]}`}
                  >
                    {item.code}
                  </span>
                </div>

                <span className="shrink-0 text-sm font-semibold text-slate-600">
                  {item.days} {item.days === 1 ? "dia" : "dias"}
                </span>

              </div>

              <div className="mt-1 text-xs text-slate-500">
                {item.start === item.end
                  ? formatDate(item.start)
                  : `${formatDate(item.start)} a ${formatDate(item.end)}`}
                {" · "}
                {item.shifts} {item.shifts === 1 ? "plantão" : "plantões"}
                {" · "}
                {shiftLabel[item.code]}
              </div>

            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          FA Falta · ATE Atestado · FE Férias · FO Folga lançada
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Fechar
        </button>

      </div>

    </div>
  );
}