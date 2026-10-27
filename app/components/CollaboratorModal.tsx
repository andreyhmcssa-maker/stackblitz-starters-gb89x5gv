"use client";

import type { CollaboratorForm, Journey } from "../lib/types";

type Props = {
  open: boolean;
  editing: boolean;
  value: CollaboratorForm;
  roles: string[];
  sectors: string[];
  journeys: Journey[];
  error: string;
  onChange: (value: CollaboratorForm) => void;
  onSave: () => void;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const selectClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500";

export default function CollaboratorModal({
  sectors,
  open,
  editing,
  value,
  roles,
  journeys,
  error,
  onChange,
  onSave,
  onClose,
}: Props) {
  if (!open) return null;

  const update = (field: keyof CollaboratorForm, newValue: string) =>
    onChange({ ...value, [field]: newValue });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6">

          <h3 className="text-xl font-bold">
            {editing ? "Editar colaborador" : "Novo colaborador"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Atualize os dados do profissional."
              : "Cadastre um profissional da equipe."}
          </p>

        </div>

        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Matrícula
            </label>
            <input
              type="text"
              value={value.registration}
              onChange={(event) => update("registration", event.target.value)}
              placeholder="Ex.: 1005"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome
            </label>
            <input
              type="text"
              value={value.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Digite o nome completo"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Função
            </label>
            <select
              value={value.role}
              onChange={(event) => update("role", event.target.value)}
              className={selectClass}
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Contrato
            </label>
            <select
              value={value.contract}
              onChange={(event) => update("contract", event.target.value)}
              className={selectClass}
            >
              <option value="">Selecione...</option>
              <option>Efetivo</option>
              <option>Celetista</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Setor
            </label>
            <select
              value={value.sector}
              onChange={(event) => update("sector", event.target.value)}
              className={selectClass}
            >
              <option value="">Selecione...</option>
              {sectors.map((sector) => (
                <option key={sector}>{sector}</option>
              ))}
              {value.sector && !sectors.includes(value.sector) && (
                <option>{value.sector}</option>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Jornada
            </label>
            <select
              value={value.journey}
              onChange={(event) => update("journey", event.target.value)}
              className={selectClass}
            >
              {journeys
                .filter(
                  (journey) => journey.active || journey.name === value.journey
                )
                .map((journey) => (
                  <option key={journey.id}>{journey.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Data base da jornada
            </label>
            <input
              type="date"
              value={value.journeyStart}
              onChange={(event) => update("journeyStart", event.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              {editing
                ? "Para trocar de jornada, escolha a nova jornada e a data base dela: a anterior continua valendo até lá."
                : "Primeiro dia de trabalho nessa jornada. A escala é gerada a partir dessa data."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nº do COREN
              </label>
              <input
                type="text"
                value={value.corenNumber}
                onChange={(event) => update("corenNumber", event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Vencimento do COREN
              </label>
              <input
                type="date"
                value={value.corenExpiry}
                onChange={(event) => update("corenExpiry", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Aniversário
              </label>
              <input
                type="date"
                value={value.birthDate}
                onChange={(event) => update("birthDate", event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Admissão
              </label>
              <input
                type="date"
                value={value.admissionDate}
                onChange={(event) => update("admissionDate", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {editing ? "Salvar alterações" : "Cadastrar"}
          </button>

        </div>

      </div>

    </div>
  );
}