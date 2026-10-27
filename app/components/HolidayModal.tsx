"use client";

import { useState } from "react";
import type { Holiday, HolidayInput } from "../lib/types";
import { suggestNationalHolidays } from "../lib/holidays";
import { formatSwapDate } from "../lib/swaps";

type Props = {
  roles: string[];
  holidays: Holiday[];
  onSave: (items: HolidayInput[]) => void;
  onClose: () => void;
};

type Row = { key: number; name: string; date: string };

const fieldClass = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

// tira acentos e maiúsculas para comparar nomes
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function HolidayModal({ roles, holidays, onSave, onClose }: Props) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([{ key: 1, name: "", date: "" }]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState("");

  const toggleRole = (role: string) => {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    );
  };

  const addRow = () => {
    setRows((current) => [...current, { key: Date.now(), name: "", date: "" }]);
  };

  const updateRow = (key: number, field: "name" | "date", value: string) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (key: number) => {
    setRows((current) => current.filter((row) => row.key !== key));
  };

  // acrescenta os feriados nacionais do ano na lista (sem repetir datas que já estão nela)
  const suggest = () => {
    const number = Number(year);

    if (!Number.isInteger(number) || number < 2000 || number > 2100) {
      setError("Informe um ano válido (de 2000 a 2100).");
      return;
    }

    setError("");

    setRows((current) => {
      const filled = current.filter((row) => row.name.trim() || row.date);
      const used = new Set(filled.map((row) => row.date));

      const added = suggestNationalHolidays(number)
        .filter((item) => !used.has(item.date))
        .map((item, index) => ({
          key: Date.now() + index,
          name: item.name,
          date: item.date,
        }));

      return [...filled, ...added];
    });
  };

  const handleSave = () => {
    const fail = (message: string) => setError(message);

    if (selectedRoles.length === 0) {
      return fail("Escolha pelo menos uma função que folga nos feriados.");
    }

    // linhas totalmente vazias são ignoradas
    const filled = rows.filter((row) => row.name.trim() || row.date);

    if (filled.length === 0) return fail("Adicione pelo menos um feriado.");

    if (filled.some((row) => !row.name.trim() || !row.date)) {
      return fail(
        "Preencha o nome e a data de todos os feriados (ou remova a linha vazia)."
      );
    }

    // data repetida na própria lista
    const seen = new Set<string>();

    for (const row of filled) {
      if (seen.has(row.date)) {
        return fail(`A data ${formatSwapDate(row.date)} aparece mais de uma vez na lista.`);
      }

      seen.add(row.date);
    }

    // feriado que já existe
    for (const row of filled) {
      const clash = holidays.find(
        (item) =>
          item.date === row.date && normalize(item.name) === normalize(row.name.trim())
      );

      if (clash) {
        return fail(
          `"${clash.name}" já está lançado em ${formatSwapDate(row.date)}. Remova o existente antes.`
        );
      }
    }

    onSave(
      filled.map((row) => ({
        name: row.name.trim(),
        date: row.date,
        roles: selectedRoles,
      }))
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">Novo(s) feriado(s)</h3>

        <p className="mt-1 text-sm text-slate-500">
          Escolha as funções que folgam e monte a lista de feriados. Quem não tem
          uma dessas funções segue a escala normal.
        </p>

        <div className="mt-5 space-y-5">

          {/* FUNÇÕES */}
          <div>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Funções que folgam</label>

              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => setSelectedRoles(roles)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Todas
                </button>
                <button
                  onClick={() => setSelectedRoles([])}
                  className="font-medium text-slate-500 hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const active = selectedRoles.includes(role);

                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-rose-400 bg-rose-100 text-rose-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {active && "✓ "}
                    {role}
                  </button>
                );
              })}
            </div>

          </div>

          {/* LISTA DE FERIADOS */}
          <div>

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium">Feriados</label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="w-24 rounded-lg border bg-white px-3 py-1.5 text-sm"
                />
                <button
                  onClick={suggest}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  Sugerir feriados nacionais
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.key} className="flex gap-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(event) => updateRow(row.key, "name", event.target.value)}
                    placeholder="Nome do feriado"
                    className={fieldClass}
                  />
                  <input
                    type="date"
                    value={row.date}
                    onChange={(event) => updateRow(row.key, "date", event.target.value)}
                    className="w-44 shrink-0 rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => removeRow(row.key)}
                    className="shrink-0 rounded-lg border px-3 text-sm font-bold text-slate-500 hover:bg-slate-50"
                    title="Remover linha"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              + Adicionar feriado
            </button>

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
            Lançar feriados
          </button>

        </div>

      </div>

    </div>
  );
}