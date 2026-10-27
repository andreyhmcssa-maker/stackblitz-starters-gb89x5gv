"use client";

import { useState } from "react";
import type { Collaborator, Swap, SwapInput } from "../lib/types";
import {
  formatSwapDate,
  getSwapSide,
  swapInMonth,
  swapMonthFor,
  swapShiftName,
} from "../lib/swaps";
import SwapModal from "../components/SwapModal";

type Props = {
  monthLabel: string;
  monthKey: string; // AAAA-MM do mês exibido
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  swaps: Swap[];
  collaborators: Collaborator[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  onAdd: (swap: SwapInput) => void;
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

export default function Swaps({
  monthLabel,
  monthKey,
  onPrevious,
  onToday,
  onNext,
  swaps,
  collaborators,
  getShiftOn,
  onAdd,
  onRemove,
  canEdit,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const nameById = new Map(collaborators.map((person) => [person.id, person.name]));
  const nameOf = (id: number) => nameById.get(id) ?? "Colaborador removido";

  // trocas que tocam o mês exibido
  const monthSwaps = swaps.filter(
    (swap) =>
      swap.firstDate.startsWith(monthKey) || swap.secondDate.startsWith(monthKey)
  );

  // histórico por colaborador: cada um só vê as trocas em que trabalha neste mês
  const ids = Array.from(
    new Set(monthSwaps.flatMap((swap) => [swap.firstId, swap.secondId]))
  );

  const allHistory = ids
    .map((id) => ({
      id,
      name: nameOf(id),
      list: monthSwaps.filter((swap) => swapMonthFor(swap, id) === monthKey),
    }))
    .filter((person) => person.list.length > 0);

  // pesquisa só pelo nome, em ordem alfabética
  const history = allHistory
    .filter((person) =>
      normalize(person.name).includes(normalize(search.trim()))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const handleRemove = (id: number) => {
    if (
      window.confirm(
        "Desfazer esta troca? Os plantões voltam para os donos originais."
      )
    ) {
      onRemove(id);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

      <div className="flex shrink-0 flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h2 className="text-xl font-bold">Trocas de Plantão</h2>

          <p className="mt-1 text-sm text-slate-500">
            {monthLabel} · {monthSwaps.length}{" "}
            {monthSwaps.length === 1 ? "troca" : "trocas"}
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
            + Nova troca
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
            Nenhuma troca neste mês.
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

              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                {person.list.length} {person.list.length === 1 ? "troca" : "trocas"}
              </span>
            </div>

            <ul className="divide-y">

              {person.list.map((swap) => {
                const side = getSwapSide(swap, person.id);

                if (!side) return null;

                const other = nameOf(side.otherId);

                return (
                  <li
                    key={swap.id}
                    className="flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                  >

                    <div className="text-slate-700">
                      <span className="mr-2 font-bold text-violet-600">⇄</span>
                      Trocou com <strong>{other}</strong>: assumiu{" "}
                      <strong>
                        {swapShiftName[side.takes.shift]} {formatSwapDate(side.takes.date)}
                      </strong>{" "}
                      (era de {other}) e passou{" "}
                      <strong>
                        {swapShiftName[side.gives.shift]} {formatSwapDate(side.gives.date)}
                      </strong>
                      .
                    </div>

                    <button
                      onClick={() => handleRemove(swap.id)}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 ${canEdit ? "" : "hidden"}`}
                    >
                      Desfazer
                    </button>

                  </li>
                );
              })}

            </ul>

          </div>

        ))}

      </div>

      {modalOpen && (
        <SwapModal
          people={collaborators.filter((person) => !person.terminationDate)}
          getShiftOn={getShiftOn}
          onSave={onAdd}
          onClose={() => setModalOpen(false)}
        />
      )}

    </section>
  );
}