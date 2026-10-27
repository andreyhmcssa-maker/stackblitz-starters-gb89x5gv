"use client";

import { useState } from "react";
import type { Collaborator, Relocation, RelocationInput } from "../lib/types";
import { formatSwapDate, swapShiftName } from "../lib/swaps";
import RelocationModal from "../components/RelocationModal";
import PayDateModal from "../components/PayDateModal";

type Props = {
  monthLabel: string;
  monthKey: string; // AAAA-MM do mês exibido
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  relocations: Relocation[];
  collaborators: Collaborator[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  onAdd: (relocation: RelocationInput) => void;
  onSetPayDate: (id: number, payDate: string, payShift: string) => void;
  onRemove: (id: number) => void;
  canEdit: boolean;
};

const navButton = "rounded-lg border px-4 py-2 text-sm hover:bg-slate-50";

const filterClass = "rounded-lg border bg-white px-3 py-2 text-sm";

// tira acentos e maiúsculas para a busca achar "joao" em "João"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function Remanejos({
  monthLabel,
  monthKey,
  onPrevious,
  onToday,
  onNext,
  relocations,
  collaborators,
  getShiftOn,
  onAdd,
  onSetPayDate,
  onRemove,
  canEdit,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Relocation | null>(null);
  const [search, setSearch] = useState("");

  const nameById = new Map(collaborators.map((person) => [person.id, person.name]));
  const nameOf = (id: number) => nameById.get(id) ?? "Colaborador removido";

  // remanejos do mês exibido (pela data do remanejo)
  const monthList = relocations.filter((item) => item.date.startsWith(monthKey));

  const ids = Array.from(new Set(monthList.map((item) => item.personId)));

  const allHistory = ids.map((id) => ({
    id,
    name: nameOf(id),
    list: monthList
      .filter((item) => item.personId === id)
      .sort((a, b) => a.date.localeCompare(b.date)),
  }));

  // pesquisa só pelo nome, em ordem alfabética
  const history = allHistory
    .filter((person) =>
      normalize(person.name).includes(normalize(search.trim()))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const handleRemove = (id: number) => {
    if (
      window.confirm(
        "Desfazer este remanejo? A escala volta ao que era antes, inclusive o dia do pagamento."
      )
    ) {
      onRemove(id);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

      <div className="flex shrink-0 flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h2 className="text-xl font-bold">Remanejos</h2>

          <p className="mt-1 text-sm text-slate-500">
            {monthLabel} · {monthList.length}{" "}
            {monthList.length === 1 ? "remanejo" : "remanejos"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button onClick={onPrevious} className={navButton}>
            ← Anterior
          </button>

          <button onClick={onToday} className={navButton}>
            Atual
          </button>

          <button onClick={onNext} className={navButton}>
            Próximo →
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${canEdit ? "" : "hidden"}`}
          >
            + Novo remanejo
          </button>

        </div>

      </div>

      <div className="flex shrink-0 flex-wrap gap-3 border-b bg-slate-50 p-4">

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por nome..."
          className={`${filterClass} w-64`}
        />

      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

        {allHistory.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Nenhum remanejo neste mês.
          </p>
        )}

        {allHistory.length > 0 && history.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Nenhum colaborador encontrado.
          </p>
        )}

        {history.map((person) => (

          <div key={person.id} className="rounded-xl border">

            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-800">{person.name}</span>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {person.list.length}{" "}
                {person.list.length === 1 ? "remanejo" : "remanejos"}
              </span>
            </div>

            <ul className="divide-y">

              {person.list.map((item) => {
                const casa = item.kind === "casa";
                const turno = swapShiftName[item.shift];

                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                  >

                    <div className="space-y-1.5 text-slate-700">

                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          casa
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {casa ? "A casa pediu · Eu devo" : "Colaborador pediu · Me deve"}
                      </span>

                      <div>
                        <span className="mr-2 font-bold text-emerald-600">↻</span>
                        {casa ? "Veio trabalhar" : "Folgou"} no plantão{" "}
                        <strong>
                          {turno} {formatSwapDate(item.date)}
                        </strong>
                        .{" "}
                        {item.payDate ? (
                          <>
                            Pagamento: {casa ? "folga" : "trabalha"} em{" "}
                            <strong>
                              {formatSwapDate(item.payDate)} ({swapShiftName[item.payShift || item.shift]})
                            </strong>.
                          </>
                        ) : (
                          <span className="text-slate-400">Sem data de pagamento.</span>
                        )}
                      </div>

                    </div>

                    <div className="flex shrink-0 gap-2">

                      <button
                        onClick={() => setPayTarget(item)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${canEdit ? "" : "hidden"}`}
                      >
                        {item.payDate ? "Alterar pagamento" : "Definir pagamento"}
                      </button>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 ${canEdit ? "" : "hidden"}`}
                      >
                        Desfazer
                      </button>

                    </div>

                  </li>
                );
              })}

            </ul>

          </div>

        ))}

      </div>

      {modalOpen && (
        <RelocationModal
          people={collaborators.filter((person) => !person.terminationDate)}
          getShiftOn={getShiftOn}
          onSave={onAdd}
          onClose={() => setModalOpen(false)}
        />
      )}

      {payTarget && (
        <PayDateModal
          relocation={payTarget}
          person={collaborators.find((person) => person.id === payTarget.personId)}
          getShiftOn={getShiftOn}
          onSave={(payDate, payShift) => onSetPayDate(payTarget.id, payDate, payShift)}
          onClose={() => setPayTarget(null)}
        />
      )}

    </section>
  );
}