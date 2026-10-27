"use client";

import { useState } from "react";
import type { Collaborator, RelocationInput } from "../lib/types";
import { checkRelocation } from "../lib/relocations";
import type { RelocationKind } from "../lib/relocations";
import { formatSwapDate, shiftParts, swapShiftName } from "../lib/swaps";

type Props = {
  people: Collaborator[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  onSave: (relocation: RelocationInput) => void;
  onClose: () => void;
};

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

export default function RelocationModal({ people, getShiftOn, onSave, onClose }: Props) {
  const [personId, setPersonId] = useState(0);
  const [kind, setKind] = useState<RelocationKind>("casa");
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("D");
  const [payDate, setPayDate] = useState("");
  const [payShift, setPayShift] = useState("D");
  const [error, setError] = useState("");

  const person = people.find((item) => item.id === personId);
  const casa = kind === "casa";

  // ao escolher o dia da folga, já sugere o plantão que a pessoa trabalha nele
  const handlePayDate = (value: string) => {
    setPayDate(value);

    if (person && value && casa) {
      const parts = shiftParts(getShiftOn(person, value));

      if (parts.length === 1) setPayShift(parts[0]);
    }
  };

  const handleSave = () => {
    const problem = checkRelocation(
      person,
      kind,
      date,
      shift,
      payDate,
      payShift,
      getShiftOn
    );

    if (problem || !person) {
      setError(problem);
      return;
    }

    onSave({
      personId: person.id,
      kind,
      date,
      shift,
      payDate,
      payShift: payDate ? payShift : "",
    });

    onClose();
  };

  const payText = payDate
    ? casa
      ? ` Pagamento: folga do plantão ${swapShiftName[payShift]} em ${formatSwapDate(payDate)}.`
      : ` Pagamento: trabalha o plantão ${swapShiftName[payShift]} em ${formatSwapDate(payDate)}.`
    : " Sem data de pagamento por enquanto.";

  const preview =
    person && date
      ? casa
        ? `${person.name} vem trabalhar o plantão ${swapShiftName[shift]} de ${formatSwapDate(date)} e a casa fica devendo uma folga (Eu devo).${payText}`
        : `${person.name} folga do plantão ${swapShiftName[shift]} de ${formatSwapDate(date)} e fica devendo um plantão à casa (Me deve).${payText}`
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">Novo remanejo</h3>

        <p className="mt-1 text-sm text-slate-500">
          Lance quem pediu, o dia e o turno. A data de pagamento pode ficar para depois.
        </p>

        <div className="mt-5 space-y-4">

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
            <label className="mb-1 block text-sm font-medium">Quem pediu</label>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as RelocationKind)}
              className={fieldClass}
            >
              <option value="casa">A casa pediu (a casa deve → Eu devo)</option>
              <option value="colaborador">O colaborador pediu (ele deve → Me deve)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                {casa ? "Dia em que vem trabalhar" : "Dia em que folga"}
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Turno do remanejo</label>
              <select
                value={shift}
                onChange={(event) => setShift(event.target.value)}
                className={fieldClass}
              >
                <option value="D">Dia</option>
                <option value="N">Noite</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Data do pagamento <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="date"
                value={payDate}
                onChange={(event) => handlePayDate(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Turno do pagamento</label>
              <select
                value={payShift}
                onChange={(event) => setPayShift(event.target.value)}
                className={fieldClass}
              >
                <option value="D">Dia</option>
                <option value="N">Noite</option>
              </select>
            </div>

          </div>

          <p className="-mt-2 text-xs text-slate-500">
            {casa
              ? "Dia em que a pessoa folga e de qual plantão (o que ela trabalharia nesse dia)."
              : "Dia em que a pessoa trabalha e qual plantão ela vai fazer."}
          </p>

        </div>

        {preview && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ↻ {preview}
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
            Registrar remanejo
          </button>

        </div>

      </div>

    </div>
  );
}