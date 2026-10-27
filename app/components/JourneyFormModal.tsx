"use client";

import type { JourneyForm } from "../lib/types";
import { weekDays } from "../lib/constants";

type Props = {
  open: boolean;
  editing: boolean;
  value: JourneyForm;
  error: string;
  onChange: (value: JourneyForm) => void;
  onToggleDay: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const selectClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500";

export default function JourneyFormModal({
  open,
  editing,
  value,
  error,
  onChange,
  onToggleDay,
  onSave,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6">
          <h3 className="text-xl font-bold">
            {editing ? "Editar jornada" : "Nova jornada"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Defina o nome, o turno e os dias de trabalho e folga.
          </p>
        </div>

        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome da jornada
            </label>
            <input
              type="text"
              value={value.name}
              onChange={(event) =>
                onChange({ ...value, name: event.target.value })
              }
              placeholder="Ex.: Diarista"
              className={inputClass}
            />
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
              className={selectClass}
            >
              <option>Diurno</option>
              <option>Noturno</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Tipo de escala
            </label>
            <select
              value={value.type}
              onChange={(event) =>
                onChange({ ...value, type: event.target.value })
              }
              className={selectClass}
            >
              <option value="ciclo">Rodízio (trabalha X dias, folga Y dias)</option>
              <option value="semanal">Semanal (dias fixos, ex.: seg a sex)</option>
            </select>
          </div>

          {value.type === "ciclo" ? (
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Dias trabalhando
                </label>
                <input
                  type="number"
                  min={1}
                  value={value.workDays}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      workDays: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Dias de folga
                </label>
                <input
                  type="number"
                  min={1}
                  value={value.offDays}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      offDays: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className={inputClass}
                />
              </div>

              <p className="col-span-2 text-xs text-slate-500">
                Ex.: 12x36 = 1 dia trabalhando e 1 de folga. A contagem começa na data base de cada colaborador.
              </p>

            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Dias da semana
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Clique em cada dia para alternar entre Trabalho, Folga e não definido.
              </p>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayValue = value.days[index];

                  return (
                    <button
                      key={day}
                      onClick={() => onToggleDay(index)}
                      className={`rounded-xl border p-2 text-center transition ${
                        dayValue === "T"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : dayValue === "F"
                          ? "border-slate-300 bg-slate-100 text-slate-600"
                          : "border-dashed text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs font-semibold">
                        {day}
                      </div>
                      <div className="mt-1 text-[10px]">
                        {dayValue === "T"
                          ? "Trab."
                          : dayValue === "F"
                          ? "Folga"
                          : "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">
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
            onClick={onSave}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {editing ? "Salvar alterações" : "Criar jornada"}
          </button>
        </div>

      </div>

    </div>
  );
}