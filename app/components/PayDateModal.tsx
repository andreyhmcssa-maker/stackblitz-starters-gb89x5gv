"use client";

import { useState } from "react";
import type { Collaborator, Relocation } from "../lib/types";
import { checkPayment, getPayShift } from "../lib/relocations";
import { formatSwapDate, shiftParts, swapShiftName } from "../lib/swaps";

type Props = {
  relocation: Relocation;
  person: Collaborator | undefined;
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  onSave: (payDate: string, payShift: string) => void;
  onClose: () => void;
};

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

export default function PayDateModal({
  relocation,
  person,
  getShiftOn,
  onSave,
  onClose,
}: Props) {
  const [payDate, setPayDate] = useState(relocation.payDate);
  const [payShift, setPayShift] = useState(getPayShift(relocation));
  const [error, setError] = useState("");

  const casa = relocation.kind === "casa";

  // ao escolher o dia da folga, já sugere o plantão que a pessoa trabalha nele
  const handleDate = (value: string) => {
    setPayDate(value);

    if (person && value && casa) {
      const parts = shiftParts(getShiftOn(person, value));

      if (parts.length === 1) setPayShift(parts[0]);
    }
  };

  const handleSave = () => {
    const unchanged =
      payDate === relocation.payDate && payShift === getPayShift(relocation);

    // só valida se mudou algo e se tem data (vazio = apagar o pagamento)
    if (payDate && !unchanged && person) {
      const problem = checkPayment(
        person,
        relocation.kind,
        relocation.date,
        payDate,
        payShift,
        getShiftOn
      );

      if (problem) {
        setError(problem);
        return;
      }
    }

    onSave(payDate, payShift);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">Data do pagamento</h3>

        <p className="mt-1 text-sm text-slate-500">
          {person?.name} · {casa ? "a casa pediu" : "o colaborador pediu"} ·{" "}
          {swapShiftName[relocation.shift]} de {formatSwapDate(relocation.date)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              {casa ? "Dia da folga" : "Dia em que trabalha"}
            </label>
            <input
              type="date"
              value={payDate}
              onChange={(event) => handleDate(event.target.value)}
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

        <p className="mt-2 text-xs text-slate-500">
          {casa
            ? "Plantão do qual a pessoa vai folgar nesse dia. Deixe a data em branco para tirar o pagamento."
            : "Plantão que a pessoa vai trabalhar nesse dia. Deixe a data em branco para tirar o pagamento."}
        </p>

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