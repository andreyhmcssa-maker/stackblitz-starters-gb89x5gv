"use client";

import { useState } from "react";
import type {
  Collaborator,
  Occurrence,
  TreCredit,
  TreCreditInput,
} from "../lib/types";
import { TRE_PRESETS, creditUsed } from "../lib/tre";

type Props = {
  people: Collaborator[];
  credits: TreCredit[];
  occurrences: Occurrence[];
  editing: TreCredit | null; // null = novo saldo
  nameOf: (id: number) => string;
  onCreate: (credit: TreCreditInput) => void;
  onUpdate: (id: number, granted: number) => void;
  onClose: () => void;
};

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

export default function TreCreditModal({
  people,
  credits,
  occurrences,
  editing,
  nameOf,
  onCreate,
  onUpdate,
  onClose,
}: Props) {
  const [personId, setPersonId] = useState(editing?.personId ?? 0);
  const [election, setElection] = useState(editing?.election ?? "");
  const [granted, setGranted] = useState(editing ? String(editing.granted) : "");
  const [error, setError] = useState("");

  // eleições já cadastradas, como sugestão ao digitar
  const elections = Array.from(new Set(credits.map((item) => item.election)));

  const handleSave = () => {
    const fail = (message: string) => setError(message);

    const amount = Number(granted);

    if (!Number.isInteger(amount) || amount < 1 || amount > 60) {
      return fail("Informe a quantidade de folgas (número inteiro, de 1 a 60).");
    }

    if (editing) {
      const used = creditUsed(editing, occurrences);

      if (amount < used) {
        return fail(
          `Já foram lançadas ${used} folga(s) dessa eleição. A quantidade não pode ser menor que isso.`
        );
      }

      onUpdate(editing.id, amount);
      onClose();
      return;
    }

    if (!personId) return fail("Escolha o colaborador.");

    const name = election.trim();

    if (!name) return fail("Informe a eleição (ex.: Eleição 2020).");

    const duplicate = credits.some(
      (item) =>
        item.personId === personId &&
        item.election.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return fail(
        "Esse colaborador já tem saldo cadastrado nessa eleição. Use Alterar quantidade."
      );
    }

    onCreate({ personId, election: name, granted: amount });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">
          {editing ? "Alterar quantidade" : "Novo saldo de folgas TRE"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {editing
            ? `${nameOf(editing.personId)} · ${editing.election}`
            : "Quantas folgas o colaborador ganhou em uma eleição."}
        </p>

        <div className="mt-5 space-y-4">

          {!editing && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Colaborador</label>
                <select
                  value={personId}
                  onChange={(event) => setPersonId(Number(event.target.value))}
                  className={fieldClass}
                >
                  <option value={0}>Selecione...</option>
                  {people.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Eleição</label>
                <input
                  type="text"
                  list="tre-elections"
                  value={election}
                  onChange={(event) => setElection(event.target.value)}
                  placeholder="Ex.: Eleição 2020"
                  className={fieldClass}
                />
                <datalist id="tre-elections">
                  {elections.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Folgas ganhas</label>

            <input
              type="number"
              min={1}
              max={60}
              value={granted}
              onChange={(event) => setGranted(event.target.value)}
              className={fieldClass}
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {TRE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setGranted(String(preset.value))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    granted === String(preset.value)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">

          <button
            onClick={onClose}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Salvar
          </button>

        </div>

      </div>

    </div>
  );
}