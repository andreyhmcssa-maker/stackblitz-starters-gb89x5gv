"use client";

import type { Collaborator } from "../lib/types";
import { formatDate } from "../lib/utils";

type Props = {
  target: Collaborator | null;
  newNote: string;
  onNewNoteChange: (value: string) => void;
  onClose: () => void;
  onAdd: () => void;
};

export default function NotesModal({
  target,
  newNote,
  onNewNoteChange,
  onClose,
  onAdd,
}: Props) {
  if (!target) return null;

  const notes = target.terminationNotes ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-4 shrink-0">
          <h3 className="text-xl font-bold">
            Observações
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {target.name} · desligado em{" "}
            {formatDate(target.terminationDate ?? "")}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">

          {notes.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
              Nenhuma observação ainda.
            </p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-xl border p-3">

                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {note.author}
                  </span>
                  <span>
                    {new Date(note.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {note.text}
                </p>

              </div>
            ))
          )}

        </div>

        <div className="mt-4 shrink-0">
          <label className="mb-1 block text-sm font-medium">
            Nova observação
          </label>
          <textarea
            rows={3}
            value={newNote}
            onChange={(event) => onNewNoteChange(event.target.value)}
            placeholder="Ex.: pediu demissão, foi demitido..."
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-50"
          >
            Fechar
          </button>
          <button
            onClick={onAdd}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>

      </div>

    </div>
  );
}