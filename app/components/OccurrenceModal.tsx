"use client";

import { useState } from "react";
import type {
  Collaborator,
  Occurrence,
  OccurrenceInput,
  Relocation,
  Swap,
  TreCredit,
} from "../lib/types";
import {
  MAX_OCCURRENCE_DAYS,
  describeDates,
  isOffKind,
  listPeriod,
  occurrenceLabel,
} from "../lib/occurrences";
import type { OccurrenceKind } from "../lib/occurrences";
import { formatSwapDate, getSwapSide } from "../lib/swaps";
import { getRelocationOps } from "../lib/relocations";
import { creditBalance } from "../lib/tre";

type Props = {
  people: Collaborator[];
  occurrences: Occurrence[];
  swaps: Swap[];
  relocations: Relocation[];
  credits: TreCredit[];
  onSave: (occurrence: OccurrenceInput) => void;
  onClose: () => void;
};

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

const kinds: OccurrenceKind[] = ["ATE", "FE", "FA", "FJ", "FT"];

export default function OccurrenceModal({
  people,
  occurrences,
  swaps,
  relocations,
  credits,
  onSave,
  onClose,
}: Props) {
  const [personId, setPersonId] = useState(0);
  const [kind, setKind] = useState<OccurrenceKind>("ATE");
  const [creditId, setCreditId] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [extraDay, setExtraDay] = useState("");
  const [extraDays, setExtraDays] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const person = people.find((item) => item.id === personId);
  const offKind = isOffKind(kind); // folga: aceita período e dias soltos
  const tre = kind === "FT";

  // saldos TRE da pessoa; sem escolha, já vem o primeiro que ainda tem folga
  const personCredits = credits.filter((item) => item.personId === personId);

  const firstWithBalance =
    personCredits.find((item) => creditBalance(item, occurrences) > 0)?.id ?? 0;

  const activeCreditId = personCredits.some((item) => item.id === creditId)
    ? creditId
    : firstWithBalance;

  const credit = personCredits.find((item) => item.id === activeCreditId);
  const balance = credit ? creditBalance(credit, occurrences) : 0;

  // dias do período (de/até) e, nas folgas, os dias soltos
  const periodDates = from && to && from <= to ? listPeriod(from, to) : [];

  const allDates = offKind
    ? Array.from(new Set([...periodDates, ...extraDays])).sort()
    : periodDates;

  const addExtraDay = () => {
    if (!extraDay || extraDays.includes(extraDay)) return;

    setExtraDays([...extraDays, extraDay].sort());
    setExtraDay("");
  };

  const handleSave = () => {
    const fail = (message: string) => setError(message);

    if (!person) return fail("Escolha o colaborador.");

    if (tre) {
      if (personCredits.length === 0) {
        return fail(
          `${person.name} não tem folgas TRE cadastradas. Cadastre o saldo na aba Folgas TRE.`
        );
      }

      if (!credit) return fail("Escolha a eleição.");
    }

    // período
    const hasPeriod = Boolean(from || to);

    if (!offKind || hasPeriod) {
      if (!from || !to) {
        return fail(
          offKind
            ? "Preencha as duas datas do período ou deixe as duas em branco."
            : "Informe a data inicial e a data final."
        );
      }

      if (from > to) return fail("A data inicial não pode ser depois da data final.");
    }

    if (allDates.length === 0) {
      return fail("Informe o período ou adicione pelo menos um dia.");
    }

    if (allDates.length > MAX_OCCURRENCE_DAYS) {
      return fail(`No máximo ${MAX_OCCURRENCE_DAYS} dias por lançamento.`);
    }

    if (kind === "FJ" && !note.trim()) {
      return fail("A justificativa é obrigatória na folga com justificativa.");
    }

    // saldo da folga TRE
    if (tre && credit && allDates.length > balance) {
      return fail(
        `${credit.election} tem só ${balance} folga(s) restante(s) e você está lançando ${allDates.length}.`
      );
    }

    // desligado
    const end = person.terminationDate;

    if (end && allDates.some((date) => date > end)) {
      return fail(`${person.name} foi desligado(a) em ${formatSwapDate(end)}.`);
    }

    // sobreposição com outro lançamento da mesma pessoa
    for (const item of occurrences) {
      if (item.personId !== person.id) continue;

      const day = item.dates.find((date) => allDates.includes(date));

      if (day) {
        return fail(
          `${person.name} já tem ${occurrenceLabel[item.kind].toLowerCase()} em ${formatSwapDate(day)}. Desfaça o outro lançamento antes.`
        );
      }
    }

    // troca no mesmo dia
    for (const swap of swaps) {
      const side = getSwapSide(swap, person.id);

      if (!side) continue;

      const day = [side.gives.date, side.takes.date].find((date) =>
        allDates.includes(date)
      );

      if (day) {
        return fail(
          `${person.name} tem uma troca em ${formatSwapDate(day)}. Desfaça a troca antes.`
        );
      }
    }

    // remanejo no mesmo dia
    for (const relocation of relocations) {
      if (relocation.personId !== person.id) continue;

      const day = getRelocationOps(relocation)
        .map((op) => op.date)
        .find((date) => allDates.includes(date));

      if (day) {
        return fail(
          `${person.name} tem um remanejo em ${formatSwapDate(day)}. Desfaça o remanejo antes.`
        );
      }
    }

    // folga TRE: a justificativa já vem pronta, com a observação opcional no fim
    const finalNote =
      tre && credit
        ? `Mesário TRE — ${credit.election}${note.trim() ? ` · ${note.trim()}` : ""}`
        : note.trim();

    onSave({
      personId: person.id,
      kind,
      dates: allDates,
      note: finalNote,
      creditId: tre && credit ? credit.id : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">Novo lançamento</h3>

        <p className="mt-1 text-sm text-slate-500">
          Atestado, férias, falta, folga com justificativa ou folga TRE, por período.
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
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as OccurrenceKind)}
              className={fieldClass}
            >
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {occurrenceLabel[item]}
                </option>
              ))}
            </select>
          </div>

          {tre && (
            <div>
              <label className="mb-1 block text-sm font-medium">Eleição</label>

              {!person && (
                <p className="text-xs text-slate-500">
                  Escolha o colaborador para ver as eleições dele.
                </p>
              )}

              {person && personCredits.length === 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {person.name} não tem folgas TRE cadastradas. Cadastre o saldo na
                  aba Folgas TRE.
                </p>
              )}

              {person && personCredits.length > 0 && (
                <select
                  value={activeCreditId}
                  onChange={(event) => setCreditId(Number(event.target.value))}
                  className={fieldClass}
                >
                  {personCredits.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.election} · restam {creditBalance(item, occurrences)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                {offKind ? "Período: de" : "De"}
              </label>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Até</label>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className={fieldClass}
              />
            </div>

          </div>

          {offKind && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Dias soltos <span className="font-normal text-slate-400">(opcional)</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={extraDay}
                  onChange={(event) => setExtraDay(event.target.value)}
                  className={fieldClass}
                />
                <button
                  onClick={addExtraDay}
                  className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Adicionar
                </button>
              </div>

              {extraDays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {extraDays.map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                    >
                      {formatSwapDate(day)}
                      <button
                        onClick={() =>
                          setExtraDays(extraDays.filter((item) => item !== day))
                        }
                        className="font-bold hover:text-amber-950"
                        title="Remover dia"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-1 text-xs text-slate-500">
                Use o período, os dias soltos ou os dois juntos.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              {kind === "FJ" ? "Justificativa" : "Observação"}{" "}
              {kind !== "FJ" && (
                <span className="font-normal text-slate-400">(opcional)</span>
              )}
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder={kind === "FJ" ? "Ex.: Doação de sangue" : ""}
              className={fieldClass}
            />
          </div>

        </div>

        {allDates.length > 0 && (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {describeDates(allDates)}
            {tre && credit && ` · saldo: restam ${balance}, este lançamento usa ${allDates.length}`}
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
            Lançar
          </button>

        </div>

      </div>

    </div>
  );
}