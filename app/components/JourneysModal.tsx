"use client";

import type { Journey } from "../lib/types";
import { weekDays } from "../lib/constants";

type Props = {
  open: boolean;
  journeys: Journey[];
  error: string;
  onNew: () => void;
  onEdit: (journey: Journey) => void;
  onToggleActive: (id: number) => void;
  onDelete: (journey: Journey) => void;
  onClose: () => void;
};

export default function JourneysModal({
  open,
  journeys,
  error,
  onNew,
  onEdit,
  onToggleActive,
  onDelete,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6 flex items-start justify-between gap-4">

          <div>
            <h3 className="text-xl font-bold">
              Jornadas
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Veja, edite, desative ou crie jornadas de trabalho.
            </p>
          </div>

          <button
            onClick={onNew}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nova jornada
          </button>

        </div>

        {error && (
          <p className="mb-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-3">

          {journeys.map((journey) => (
            <div
              key={journey.id}
              className={`rounded-xl border p-4 ${
                journey.active ? "" : "bg-slate-50 opacity-70"
              }`}
            >

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {journey.name}
                  </span>

                  <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {journey.shift}
                  </span>

                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                      journey.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {journey.active ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() => onEdit(journey)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={() => onToggleActive(journey.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                  >
                    {journey.active ? "⏸️ Desativar" : "▶️ Ativar"}
                  </button>

                  <button
                    onClick={() => onDelete(journey)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    🗑️ Excluir
                  </button>

                </div>

              </div>

              {journey.type === "semanal" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {weekDays.map((day, index) => (
                    <span
                      key={day}
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${
                        journey.days[index] === "T"
                          ? "bg-blue-100 text-blue-700"
                          : journey.days[index] === "F"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {day}:{" "}
                      {journey.days[index] === "T"
                        ? "Trabalho"
                        : journey.days[index] === "F"
                        ? "Folga"
                        : "—"}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Rodízio: trabalha {journey.workDays} dia(s) e folga{" "}
                  {journey.offDays} dia(s), repetindo.
                </p>
              )}

            </div>
          ))}

        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Fechar
        </button>

      </div>

    </div>
  );
}