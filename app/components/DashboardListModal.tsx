"use client";

export type ListRow = {
  id: number;
  name: string;
  role: string;
  detail: string;
  badge: string;
  badgeClass: string;
};

type Props = {
  title: string;
  rows: ListRow[];
  emptyText: string;
  onClose: () => void;
};

export default function DashboardListModal({ title, rows, emptyText, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">

        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">

          <div>
            <h3 className="text-lg font-bold">{title}</h3>

            <p className="text-xs text-slate-500">
              {rows.length} {rows.length === 1 ? "colaborador" : "colaboradores"}
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

          {rows.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-500">{emptyText}</p>
          )}

          <ul className="divide-y">

            {rows.map((row) => (
              <li key={row.id} className="px-6 py-3 text-sm">

                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800">{row.name}</span>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.badgeClass}`}
                  >
                    {row.badge}
                  </span>
                </div>

                <div className="mt-0.5 text-xs text-slate-500">{row.role}</div>

                <div className="mt-1 text-slate-700">{row.detail}</div>

              </li>
            ))}

          </ul>

        </div>

      </div>

    </div>
  );
}