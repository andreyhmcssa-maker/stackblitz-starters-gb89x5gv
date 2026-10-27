"use client";

type Props = {
  open: boolean;
  roles: string[];
  newRole: string;
  onNewRoleChange: (value: string) => void;
  editingRole: string | null;
  editingRoleName: string;
  onEditingRoleNameChange: (value: string) => void;
  error: string;
  onStartEdit: (role: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (role: string) => void;
  onAdd: () => void;
  onClose: () => void;
};

export default function RolesModal({
  open,
  roles,
  newRole,
  onNewRoleChange,
  editingRole,
  editingRoleName,
  onEditingRoleNameChange,
  error,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onAdd,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-6">
          <h3 className="text-xl font-bold">
            Funções
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre uma nova função para a equipe.
          </p>
        </div>

        <div className="mb-5 space-y-2">
          {roles.map((role) => (
            <div
              key={role}
              className="flex items-center gap-2 rounded-xl border px-3 py-2"
            >

              {editingRole === role ? (
                <>
                  <input
                    type="text"
                    value={editingRoleName}
                    onChange={(event) =>
                      onEditingRoleNameChange(event.target.value)
                    }
                    className="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />

                  <button
                    onClick={onSaveEdit}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Salvar
                  </button>

                  <button
                    onClick={onCancelEdit}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">
                    {role}
                  </span>

                  <button
                    onClick={() => onStartEdit(role)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={() => onDelete(role)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    🗑️ Excluir
                  </button>
                </>
              )}

            </div>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium">
          Nova função
        </label>

        <input
          type="text"
          value={newRole}
          onChange={(event) => onNewRoleChange(event.target.value)}
          placeholder="Ex.: Fisioterapeuta"
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-50"
          >
            Fechar
          </button>
          <button
            onClick={onAdd}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>

      </div>

    </div>
  );
}