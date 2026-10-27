"use client";

import { useState } from "react";
import type { Holiday, HolidayInput } from "../lib/types";
import { UPCOMING_DAYS, daysUntil } from "../lib/holidays";
import { todayIso } from "../lib/relocations";
import { formatSwapDate } from "../lib/swaps";
import { getWeekdayShort } from "../lib/utils";
import HolidayModal from "./HolidayModal";

type Props = {
  holidays: Holiday[];
  roles: string[];
  onAdd: (items: HolidayInput[]) => void;
  onRemove: (id: number) => void;
  canEdit: boolean;
};

const filterClass = "rounded-lg border bg-white px-3 py-2 text-sm";

// tira acentos e maiúsculas para a busca achar "joao" em "João"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

    export default function HolidaysPanel({
      holidays,
      roles,
      onAdd,
      onRemove,
      canEdit,
    }: Props) {
  const today = todayIso();
  const currentYear = new Date().getFullYear();

  const [modalOpen, setModalOpen] = useState(false);
  const [year, setYear] = useState(String(currentYear));
  const [search, setSearch] = useState("");

  // anos para escolher: os que têm feriado, o atual e o próximo
  const years = Array.from(
    new Set([
      String(currentYear),
      String(currentYear + 1),
      ...holidays.map((item) => item.date.slice(0, 4)),
    ])
  ).sort();

  // feriados que chegam nos próximos dias
  const upcoming = holidays
    .filter((item) => {
      const days = daysUntil(item.date, today);

      return days >= 0 && days <= UPCOMING_DAYS;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const list = holidays
    .filter(
      (item) =>
        item.date.startsWith(year) &&
        normalize(item.name).includes(normalize(search.trim()))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const statusOf = (date: string) => {
    const days = daysUntil(date, today);

    if (days === 0) return { text: "Hoje", style: "bg-rose-100 text-rose-700" };

    if (days < 0) return { text: "Já passou", style: "bg-slate-100 text-slate-500" };

    return {
      text: `Em ${days} ${days === 1 ? "dia" : "dias"}`,
      style:
        days <= UPCOMING_DAYS
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-600",
    };
  };

  const handleRemove = (id: number) => {
    if (
      window.confirm(
        "Remover este feriado? As escalas voltam ao normal nesse dia para essas funções."
      )
    ) {
      onRemove(id);
    }
  };

  return (
    <>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-slate-50 p-4">

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar feriado..."
          className={`${filterClass} w-64`}
        />

        <select
          value={year}
          onChange={(event) => setYear(event.target.value)}
          className={filterClass}
        >
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          onClick={() => setModalOpen(true)}
          className={`ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${canEdit ? "" : "hidden"}`}
        >
          + Novo feriado(s)
        </button>

      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

        {upcoming.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

            <p className="text-sm font-semibold text-amber-900">
              Feriados chegando (próximos {UPCOMING_DAYS} dias)
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {upcoming.map((item) => {
                const days = daysUntil(item.date, today);

                return (
                  <span
                    key={item.id}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm"
                  >
                    {item.date.slice(8, 10)}/{item.date.slice(5, 7)} · {item.name} ·{" "}
                    {days === 0 ? "hoje" : `em ${days} ${days === 1 ? "dia" : "dias"}`}
                  </span>
                );
              })}
            </div>

          </div>
        )}

        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            {holidays.length === 0
              ? "Nenhum feriado lançado. Use + Novo feriado(s) para começar."
              : "Nenhum feriado encontrado neste ano."}
          </p>
        )}

        {list.length > 0 && (
          <ul className="divide-y rounded-xl border">

            {list.map((item) => {
              const status = statusOf(item.date);

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                >

                  <div className="space-y-1.5">

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-rose-600">★</span>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-500">
                        {formatSwapDate(item.date)} ({getWeekdayShort(item.date)})
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.style}`}
                      >
                        {status.text}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700"
                        >
                          {role}
                        </span>
                      ))}
                    </div>

                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 ${canEdit ? "" : "hidden"}`}
                  >
                    Remover
                  </button>

                </li>
              );
            })}

          </ul>
        )}

      </div>

      {modalOpen && (
        <HolidayModal
          roles={roles}
          holidays={holidays}
          onSave={onAdd}
          onClose={() => setModalOpen(false)}
        />
      )}

    </>
  );
}