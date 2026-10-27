"use client";

import type { Collaborator, Fixation, SectorLayout } from "../lib/types";
import { formatDate, getHistory, previousDay, todayIso } from "../lib/utils";
import { getRowsForRole } from "../lib/sectorLayout";

type Props = {
  profile: Collaborator | null;
  onClose: () => void;
  onEdit: (person: Collaborator) => void;
  onDeletePeriod: (personId: number, index: number) => void;
  fixations: Fixation[];
  onNewFixation: (person: Collaborator) => void;
  onDeleteFixation: (fixation: Fixation) => void;
  onEditFixation: (fixation: Fixation, person: Collaborator) => void;
  canEditTeam: boolean;
  canEditSchedule: boolean;
  layout: SectorLayout | undefined;
};

export default function ProfileModal({
  profile,
  onClose,
  onEdit,
  onDeletePeriod,
  fixations,
  onNewFixation,
  onDeleteFixation,
  onEditFixation,
  canEditTeam,
  canEditSchedule,
  layout,
}: Props) {
  if (!profile) return null;

  const items = [
    { label: "Matrícula", value: profile.registration || "Não informada" },
    { label: "Setor", value: profile.sector || "Não informado" },
    { label: "Contrato", value: profile.contract || "Não informado" },
    { label: "Jornada", value: profile.journey },
    { label: "Nº do COREN", value: profile.corenNumber || "Não informado" },
    { label: "Vencimento do COREN", value: formatDate(profile.corenExpiry) },
    { label: "Aniversário", value: formatDate(profile.birthDate) },
    { label: "Admissão", value: formatDate(profile.admissionDate) },
  ];

  // HISTÓRICO DE JORNADAS
  const history = getHistory(profile);

  const periods = history
    .map((item, index) => {
      const next = history[index + 1];

      return {
        ...item,
        index,
        current: !next,
        end: next ? previousDay(next.startDate) : profile.terminationDate ?? "",
      };
    })
    .reverse();

  const canDelete = history.length > 1;

  // FIXAÇÕES NA ESCALA SETORIAL
  const inSectorSchedule = getRowsForRole(profile.role, layout) !== null;
  const today = todayIso();

  const personFixations = fixations
    .filter((fixation) => fixation.personId === profile.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const fixationStatus = (fixation: Fixation) => {
      if (fixation.endDate && fixation.endDate < today) {
        return { label: "Encerrada", className: "bg-slate-100 text-slate-500" };
      }
  
      if (fixation.startDate > today) {
        return { label: "Agendada", className: "bg-sky-50 text-sky-700" };
      }
  
      return { label: "Em vigor", className: "bg-amber-100 text-amber-800" };
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6 flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-xl font-bold">
              {profile.name}
            </h3>
            <p className="text-sm text-slate-500">
              {profile.role}
            </p>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* HISTÓRICO DE JORNADAS */}
        <div className="mt-6">

          <h4 className="mb-3 text-sm font-semibold text-slate-700">
            Histórico de jornadas
          </h4>

          <div className="space-y-2">
            {periods.map((period) => (
              <div
                key={`${period.index}-${period.startDate}`}
                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >

                <div className="min-w-0">

                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {period.journey}
                    </span>

                    {period.current && (
                      <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Atual
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 text-xs text-slate-500">
                    {formatDate(period.startDate)}
                    {" → "}
                    {period.end ? formatDate(period.end) : "em vigor"}
                  </div>

                </div>

                {canDelete && canEditTeam && (
                  <button
                    onClick={() => onDeletePeriod(profile.id, period.index)}
                    title="Excluir período"
                    className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
                  >
                    🗑️
                  </button>
                )}

              </div>
            ))}
          </div>

        </div>

        {/* FIXAÇÕES NA ESCALA SETORIAL */}
        {inSectorSchedule && (
          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Fixações na escala setorial
              </h4>

              <button
                onClick={() => onNewFixation(profile)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${canEditSchedule ? "" : "hidden"}`}
              >
                + Nova fixação
              </button>
            </div>

            {personFixations.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Nenhuma fixação. Esse colaborador participa do rodízio.
              </p>
            ) : (
              <div className="space-y-2">
                {personFixations.map((fixation) => {
                  const status = fixationStatus(fixation);

                  return (
                    <div
                      key={fixation.id}
                      className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                    >

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            📌 {fixation.sector}
                          </span>

                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-0.5 text-xs text-slate-500">
                          {formatDate(fixation.startDate)}
                          {" → "}
                          {fixation.endDate ? formatDate(fixation.endDate) : "indeterminado"}
                        </div>

                      </div>

                      <div className={`flex shrink-0 gap-2 ${canEditSchedule ? "" : "hidden"}`}>

<button
  onClick={() => onEditFixation(fixation, profile)}
  title="Editar fixação"
  className="rounded-lg border px-2.5 py-1.5 text-xs transition hover:bg-slate-100"
>
  ✏️
</button>

<button
  onClick={() => onDeleteFixation(fixation)}
  title="Excluir fixação"
  className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
>
  🗑️
</button>

</div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>

          <button
            onClick={() => {
              onEdit(profile);
              onClose();
            }}
            className={`flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 ${canEditTeam ? "" : "hidden"}`}
          >
            ✏️ Editar
          </button>
        </div>

      </div>

    </div>
  );
}