"use client";

import { useState } from "react";
import type { Collaborator, SwapInput } from "../lib/types";
import { formatSwapDate, shiftParts, swapShiftName } from "../lib/swaps";

type Props = {
  people: Collaborator[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  onSave: (swap: SwapInput) => void;
  onClose: () => void;
};

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

// quem está nesses códigos não pode receber plantão
const BLOCKED = ["FA", "ATE", "FE"];

export default function SwapModal({ people, getShiftOn, onSave, onClose }: Props) {
  const [firstId, setFirstId] = useState(0);
  const [secondId, setSecondId] = useState(0);
  const [firstDate, setFirstDate] = useState("");
  const [firstShift, setFirstShift] = useState("D");
  const [secondDate, setSecondDate] = useState("");
  const [secondShift, setSecondShift] = useState("N");
  const [error, setError] = useState("");

  const first = people.find((person) => person.id === firstId);
  const second = people.find((person) => person.id === secondId);

  // o 2º colaborador precisa ser da mesma função do 1º
  const secondOptions = people.filter(
    (person) => person.id !== firstId && (!first || person.role === first.role)
  );

  // quem passa o plantão precisa realmente tê-lo na escala
  const giverProblem = (person: Collaborator, date: string, shift: string) =>
    shiftParts(getShiftOn(person, date)).includes(shift)
      ? ""
      : `${person.name} não tem plantão ${swapShiftName[shift]} em ${formatSwapDate(date)}.`;

  // quem recebe não pode estar ausente nem já ter esse plantão
  const receiverProblem = (person: Collaborator, date: string, shift: string) => {
    if (person.terminationDate && date > person.terminationDate) {
      return `${person.name} já estava desligado(a) em ${formatSwapDate(date)}.`;
    }

    const code = getShiftOn(person, date);

    if (BLOCKED.includes(code)) {
      return `${person.name} está com ${code} em ${formatSwapDate(date)} e não pode receber esse plantão.`;
    }

    if (shiftParts(code).includes(shift)) {
      return `${person.name} já trabalha no plantão ${swapShiftName[shift]} de ${formatSwapDate(date)}.`;
    }

    return "";
  };

  const handleSave = () => {
    if (!first || !second) {
      setError("Escolha os dois colaboradores.");
      return;
    }

    if (!firstDate || !secondDate) {
      setError("Informe a data dos dois plantões.");
      return;
    }

    const problem =
      giverProblem(first, firstDate, firstShift) ||
      giverProblem(second, secondDate, secondShift) ||
      receiverProblem(second, firstDate, firstShift) ||
      receiverProblem(first, secondDate, secondShift);

    if (problem) {
      setError(problem);
      return;
    }

    onSave({
      firstId: first.id,
      secondId: second.id,
      firstDate,
      firstShift,
      secondDate,
      secondShift,
    });

    onClose();
  };

  const preview =
    first && second && firstDate && secondDate
      ? `${first.name} assume o plantão ${swapShiftName[secondShift]} de ${formatSwapDate(secondDate)} e ${second.name} assume o plantão ${swapShiftName[firstShift]} de ${formatSwapDate(firstDate)}.`
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">Nova troca</h3>

        <p className="mt-1 text-sm text-slate-500">
          Cada colaborador assume o plantão do outro. Informe o plantão original de cada um.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">

          {/* COLABORADOR 1 */}
          <div className="space-y-3 rounded-xl border p-4">

            <div>
              <label className="mb-1 block text-sm font-medium">Colaborador 1</label>
              <select
                value={firstId}
                onChange={(event) => {
                  setFirstId(Number(event.target.value));
                  setSecondId(0);
                }}
                className={fieldClass}
              >
                <option value={0}>Selecione...</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs font-medium text-slate-500">
              Plantão dele(a) que passa para o colaborador 2
            </p>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={firstDate}
                onChange={(event) => setFirstDate(event.target.value)}
                className={fieldClass}
              />
              <select
                value={firstShift}
                onChange={(event) => setFirstShift(event.target.value)}
                className={fieldClass}
              >
                <option value="D">Dia</option>
                <option value="N">Noite</option>
              </select>
            </div>

          </div>

          {/* COLABORADOR 2 */}
          <div className="space-y-3 rounded-xl border p-4">

            <div>
              <label className="mb-1 block text-sm font-medium">Colaborador 2</label>
              <select
                value={secondId}
                onChange={(event) => setSecondId(Number(event.target.value))}
                className={fieldClass}
              >
                <option value={0}>Selecione...</option>
                {secondOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs font-medium text-slate-500">
              Plantão dele(a) que passa para o colaborador 1
            </p>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={secondDate}
                onChange={(event) => setSecondDate(event.target.value)}
                className={fieldClass}
              />
              <select
                value={secondShift}
                onChange={(event) => setSecondShift(event.target.value)}
                className={fieldClass}
              >
                <option value="D">Dia</option>
                <option value="N">Noite</option>
              </select>
            </div>

          </div>

        </div>

        {preview && (
          <p className="mt-4 rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-800">
            ⇄ {preview}
          </p>
        )}

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
            Registrar troca
          </button>

        </div>

      </div>

    </div>
  );
}