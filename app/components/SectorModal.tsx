"use client";

import { useState } from "react";
import type { Sector } from "../lib/types";

type Props = {
  sector: Sector | null; // null = novo setor
  onSave: (name: string) => string; // devolve "" se deu certo, ou a mensagem do problema
  onClose: () => void;
};

export default function SectorModal({ sector, onSave, onClose }: Props) {
  const [name, setName] = useState(sector?.name ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const problem = onSave(name);

    if (problem) {
      setError(problem);
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <h3 className="text-xl font-bold">
          {sector ? "Renomear setor" : "Novo setor"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {sector
            ? "Os colaboradores deste setor passam a usar o novo nome."
            : "Ex.: Pronto Socorro, Clínica Médica, Bloco Cirúrgico..."}
        </p>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium">Nome do setor</label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
            }}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
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