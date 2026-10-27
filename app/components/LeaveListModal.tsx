"use client";

import type { LeaveItem } from "../lib/leaves";
import { formatSwapDate } from "../lib/swaps";

type Props = {
  title: string;
  items: LeaveItem[];
  hint: (item: LeaveItem) => string;
  onClose: () => void;
};

export default function LeaveListModal({ title, items, hint, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">

        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">

          <div>
            <h3 className="text-lg font-bold">{title}</h3>

            <p className="text-xs text-slate-500">
              {items.length} {items.length === 1 ? "colaborador" : "colaboradores"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-lg font-bold text-slate-500 hover:bg-slate-100"
            title="Fechar"
          >
            ×
          </button>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">

          {items.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Ninguém por enquanto.
            </p>
          )}

          <ul className="divide-y">

            {items.map((item) => (
              <li key={item.person.id} className="px-6 py-3 text-sm">

                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800">{item.person.name}</span>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {hint(item)}
                  </span>
                </div>

                <div className="mt-0.5 text-xs text-slate-500">{item.person.role}</div>

                <div className="mt-1 text-slate-700">
                  {item.start === item.end
                    ? formatSwapDate(item.start)
                    : `${formatSwapDate(item.start)} a ${formatSwapDate(item.end)}`}{" "}
                  · {item.days} {item.days === 1 ? "dia" : "dias"}
                </div>

              </li>
            ))}

          </ul>

        </div>

      </div>

    </div>
  );
}