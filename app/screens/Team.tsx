"use client";

import type { Collaborator } from "../lib/types";
import { formatDate } from "../lib/utils";
import HeaderFilter from "../components/HeaderFilter";

type Props = {
  view: string;
  onViewChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  collaborators: Collaborator[];
  activeCount: number;
  terminatedCount: number;
  effectiveCount: number;
  cltCount: number;
  roles: string[];
  contractFilter: string;
  onContractFilter: (value: string) => void;
  roleFilter: string;
  onRoleFilter: (value: string) => void;
  onOpenRoles: () => void;
  onOpenJourneys: () => void;
  onNew: () => void;
  onOpenProfile: (id: number) => void;
  onEdit: (person: Collaborator) => void;
  onTerminate: (person: Collaborator) => void;
  onReactivate: (person: Collaborator) => void;
  onOpenNotes: (person: Collaborator) => void;
  canEdit: boolean;
};

const th = "px-5 py-4 text-left text-sm font-semibold";

const contractOptions = [
  { value: "Todos", label: "Todos os contratos" },
  { value: "Efetivo", label: "Efetivo" },
  { value: "Celetista", label: "Celetista" },
];

export default function Team({
  view,
  onViewChange,
  search,
  onSearchChange,
  collaborators,
  activeCount,
  terminatedCount,
  effectiveCount,
  cltCount,
  roles,
  contractFilter,
  onContractFilter,
  roleFilter,
  onRoleFilter,
  onOpenRoles,
  onOpenJourneys,
  onNew,
  onOpenProfile,
  onEdit,
  onTerminate,
  onReactivate,
  onOpenNotes,
  canEdit,
}: Props) {
  const roleOptions = [
    { value: "Todas", label: "Todas as funções" },
    ...roles.map((role) => ({ value: role, label: role })),
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col">

      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            Equipe
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gerencie os colaboradores da instituição.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={onOpenRoles}
            className={`rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 ${canEdit ? "" : "hidden"}`}
          >
            + Função
          </button>

          <button
            onClick={onOpenJourneys}
            className={`rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 ${canEdit ? "" : "hidden"}`}
          >
            Jornadas
          </button>

          <button
            onClick={onNew}
            className={`rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 ${canEdit ? "" : "hidden"}`}
          >
            + Novo colaborador
          </button>

        </div>

      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="🔍 Pesquisar por nome, matrícula, função ou setor..."
          className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-96"
        />

        <div className="flex rounded-xl border bg-white p-1">

          <button
            onClick={() => onViewChange("ativos")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === "ativos"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Ativos ({activeCount})
          </button>

          <button
            onClick={() => onViewChange("desligados")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === "desligados"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Desligados ({terminatedCount})
          </button>

        </div>

        {/* TOTAIS */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:ml-auto">

          <span className="rounded-lg border bg-white px-3 py-2 text-slate-700">
            Ativos: {activeCount}
          </span>

          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
            Efetivos: {effectiveCount}
          </span>

          <span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">
            Celetistas: {cltCount}
          </span>

        </div>

      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="min-h-0 flex-1 overflow-auto">

          {view === "ativos" ? (
                        <table className="w-full min-w-[1220px] table-fixed">

                        <colgroup>
                          <col className="w-[110px]" />
                          <col />
                          <col className="w-[200px]" />
                          <col className="w-[170px]" />
                          <col className="w-[160px]" />
                          <col className="w-[170px]" />
                          <col className="w-[190px]" />
                        </colgroup>

              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr className="border-b bg-slate-50">
                  <th className={th}>Matrícula</th>
                  <th className={th}>Colaborador</th>
                  <th className={th}>
                    <HeaderFilter
                      label="Função"
                      value={roleFilter}
                      options={roleOptions}
                      onChange={onRoleFilter}
                    />
                  </th>
                  <th className={th}>
                    <HeaderFilter
                      label="Contrato"
                      value={contractFilter}
                      options={contractOptions}
                      onChange={onContractFilter}
                    />
                  </th>
                  <th className={th}>Setor</th>
                  <th className={th}>Jornada</th>
                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>

                {collaborators.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b last:border-b-0 hover:bg-slate-50"
                  >

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {person.registration || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => onOpenProfile(person.id)}
                        className="text-left font-semibold text-blue-700 hover:underline"
                      >
                        {person.name}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {person.role}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {person.contract ? (
                        <span
                          className={`inline-block whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold ${
                            person.contract === "Efetivo"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {person.contract}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {person.sector || "Não informado"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        title={person.journey}
                        className="inline-block max-w-full truncate whitespace-nowrap rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 align-middle"
                      >
                        {person.journey}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => onEdit(person)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-100 ${canEdit ? "" : "hidden"}`}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          onClick={() => onTerminate(person)}
                          className={`rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 ${canEdit ? "" : "hidden"}`}
                        >
                          Desligar
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

                {collaborators.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          ) : (
            <table className="w-full min-w-[1130px] table-fixed">

            <colgroup>
              <col className="w-[110px]" />
              <col />
              <col className="w-[200px]" />
              <col className="w-[170px]" />
              <col className="w-[190px]" />
              <col className="w-[90px]" />
              <col className="w-[150px]" />
            </colgroup>

            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="border-b bg-slate-50">
                <th className={th}>Matrícula</th>
                <th className={th}>Colaborador</th>
                <th className={th}>
                  <HeaderFilter
                    label="Função"
                    value={roleFilter}
                    options={roleOptions}
                    onChange={onRoleFilter}
                  />
                </th>
                <th className={th}>
                  <HeaderFilter
                    label="Contrato"
                    value={contractFilter}
                    options={contractOptions}
                    onChange={onContractFilter}
                  />
                </th>
                <th className={th}>Data de desligamento</th>
                <th className="px-5 py-4 text-center text-sm font-semibold">
                  Obs.
                </th>
                <th className="px-5 py-4 text-right text-sm font-semibold">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {collaborators.map((person) => (
                <tr
                  key={person.id}
                  className="border-b last:border-b-0 hover:bg-slate-50"
                >

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {person.registration || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => onOpenProfile(person.id)}
                      className="text-left font-semibold text-blue-700 hover:underline"
                    >
                      {person.name}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {person.role}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {person.contract ? (
                      <span
                        className={`inline-block whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold ${
                          person.contract === "Efetivo"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {person.contract}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatDate(person.terminationDate ?? "")}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onOpenNotes(person)}
                      title="Observações"
                      className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition hover:bg-slate-100"
                    >
                      ℹ️
                      {(person.terminationNotes ?? []).length > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                          {(person.terminationNotes ?? []).length}
                        </span>
                      )}
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      onClick={() => onReactivate(person)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-100 ${canEdit ? "" : "hidden"}`}
                    >
                      ↩️ Reativar
                    </button>
                  </td>

                </tr>
              ))}

              {collaborators.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Nenhum colaborador desligado.
                  </td>
                </tr>
              )}

            </tbody>

          </table>
          )}

        </div>

      </div>

    </section>
  );
}