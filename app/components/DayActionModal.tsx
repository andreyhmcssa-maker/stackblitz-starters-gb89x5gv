"use client";

import { useState } from "react";
import type { Collaborator, Fixation } from "../lib/types";
import { formatDate, shortName } from "../lib/utils";

export type DayStatus = "rodizio" | "fixado" | "ajustado" | "excedente";

export type DayPeer = {
  person: Collaborator;
  sector: string;
};

export type DayAction = {
  person: Collaborator;
  sector: string; // "" = excedente (sem setor)
  dateIso: string;
  status: DayStatus;
  fixation?: Fixation;
  peers: DayPeer[];
  sectorOptions: string[]; // setores que existem nesta planilha
};

type Props = {
  action: DayAction | null;
  onClose: () => void;
  onMove: (sector: string) => void;
  onSwap: (peer: DayPeer) => void;
  onUndo: () => void;
  onFix: () => void;
  onEditFixation: () => void;
};

const statusLabel: Record<DayStatus, { text: string; className: string }> = {
  rodizio: { text: "Rodízio", className: "bg-slate-100 text-slate-600" },
  fixado: { text: "📌 Fixado", className: "bg-amber-100 text-amber-800" },
  ajustado: { text: "✋ Ajuste do dia", className: "bg-sky-100 text-sky-800" },
  excedente: { text: "⚠ Excedente", className: "bg-red-100 text-red-700" },
};

const optionClass =
  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50";

const hintClass = "block text-xs font-normal text-slate-500";

const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function DayActionModal({
  action,
  onClose,
  onMove,
  onSwap,
  onUndo,
  onFix,
  onEditFixation,
}: Props) {
  const [mode, setMode] = useState<"menu" | "move" | "swap">("menu");
  const [moveTo, setMoveTo] = useState("");

  if (!action) return null;

  const { person, sector, dateIso, status, fixation } = action;

  const sectorOptions = action.sectorOptions.filter((option) => option !== sector);

  // trocar com alguém do mesmo setor não muda nada, então essas pessoas não aparecem
  const peers = action.peers.filter((peer) => peer.sector !== sector);

  const label = statusLabel[status];

  const fixationText =
    status === "fixado" && fixation
      ? fixation.endDate
        ? ` até ${formatDate(fixation.endDate)}`
        : " por tempo indeterminado"
      : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        {/* CABEÇALHO */}
        <h3 className="text-lg font-bold">{person.name}</h3>

        <p className="mt-1 text-sm text-slate-500">
          {formatDate(dateIso)} · {sector || "Sem setor"}
        </p>

        <span
          className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${label.className}`}
        >
          {label.text}
          {fixationText}
        </span>

        {/* MENU */}
        {mode === "menu" && (
          <div className="mt-5 space-y-2">

            {status === "ajustado" && (
              <button onClick={onUndo} className={optionClass}>
                <span>↩</span>
                <span>
                  Desfazer ajuste do dia
                  <span className={hintClass}>
                    Volta para o que o rodízio ou a fixação definem
                  </span>
                </span>
              </button>
            )}

            <button onClick={() => setMode("move")} className={optionClass}>
              <span>➜</span>
              <span>
                Mover para outro setor
                <span className={hintClass}>Só neste dia</span>
              </span>
            </button>

            {status !== "excedente" && peers.length > 0 && (
              <button onClick={() => setMode("swap")} className={optionClass}>
                <span>↔</span>
                <span>
                  Trocar de setor com...
                  <span className={hintClass}>
                    Só neste dia, com alguém desta mesma planilha
                  </span>
                </span>
              </button>
            )}

            {status === "fixado" ? (
              <button onClick={onEditFixation} className={optionClass}>
                <span>✏️</span>
                <span>
                  Editar fixação
                  <span className={hintClass}>Mudar setor ou período, ou encerrar</span>
                </span>
              </button>
            ) : (
              <button onClick={onFix} className={optionClass}>
                <span>📌</span>
                <span>
                  Fixar por período
                  <span className={hintClass}>Vários plantões no mesmo setor</span>
                </span>
              </button>
            )}

          </div>
        )}

        {/* MOVER */}
        {mode === "move" && (
          <div className="mt-5 space-y-3">

            <label className="block text-sm font-medium">Mover para</label>

            <select
              value={moveTo}
              onChange={(event) => setMoveTo(event.target.value)}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              {sectorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <p className="text-xs text-slate-500">
              Vale só para {formatDate(dateIso)}. Se o setor estiver cheio, ganha uma
              vaga EXTRA.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMode("menu")}
                className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Voltar
              </button>

              <button
                onClick={() => onMove(moveTo)}
                disabled={!moveTo}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mover
              </button>
            </div>

          </div>
        )}

        {/* TROCAR */}
        {mode === "swap" && (
          <div className="mt-5">

            <p className="mb-2 text-sm font-medium">Trocar de setor com:</p>

            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border p-1">
              {peers.map((peer) => (
                <button
                  key={`${peer.person.id}-${peer.sector}`}
                  onClick={() => onSwap(peer)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                >
                  <span className="truncate font-medium">
                    {shortName(peer.person.name)}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {peer.sector}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setMode("menu")}
              className="mt-3 w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Voltar
            </button>

          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          Fechar
        </button>

      </div>

    </div>
  );
}