import { menuItems } from "../lib/constants";

type SidebarUser = {
  name: string;
  profile: string;
  sector: string;
  canSwitchSector: boolean;
};

type SidebarProps = {
  open: boolean;
  activeMenu: string;
  onSelect: (label: string) => void;
  canSee: (label: string) => boolean;
  user: SidebarUser;
  onSwitchSector: () => void;
  onLogout: () => void;
};

export default function Sidebar({
  open,
  activeMenu,
  onSelect,
  canSee,
  user,
  onSwitchSector,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-slate-950 text-white transition-all duration-300 ${
        open ? "w-64" : "w-20"
      }`}
    >
      {/* LOGO */}
      <div className="flex h-20 items-center border-b border-slate-800 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl">
          🏥
        </div>

        {open && (
          <div className="ml-3">
            <div className="font-bold">Escala</div>
            <div className="text-xs text-slate-400">Enfermagem</div>
          </div>
        )}
      </div>

      {/* MENU */}
      <nav className="p-3">
        {menuItems
          .filter((item) => canSee(item.label))
          .map((item) => (
            <button
              key={item.label}
              onClick={() => onSelect(item.label)}
              className={`mb-1 flex w-full items-center rounded-xl px-3 py-3 text-left transition ${
                activeMenu === item.label
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="text-xl">{item.icon}</span>

              {open && (
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}

        {canSee("Configurações") && (
          <>
            {/* SEPARADOR */}
            <div className="my-4 border-t border-slate-800" />

            <button
              onClick={() => onSelect("Configurações")}
              className={`flex w-full items-center rounded-xl px-3 py-3 text-left transition ${
                activeMenu === "Configurações"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="text-xl">⚙️</span>

              {open && (
                <span className="ml-3 text-sm font-medium">Configurações</span>
              )}
            </button>
          </>
        )}
      </nav>

      {/* RODAPÉ */}
      {open ? (
        <div className="absolute bottom-5 left-4 right-4 rounded-xl bg-slate-900 p-3">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {user.profile} · {user.sector}
          </div>

          <div className="mt-3 flex gap-2">
            {user.canSwitchSector && (
              <button
                onClick={onSwitchSector}
                className="flex-1 rounded-lg bg-slate-800 px-2 py-1.5 text-xs font-medium hover:bg-slate-700"
              >
                Trocar setor
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex-1 rounded-lg bg-slate-800 px-2 py-1.5 text-xs font-medium hover:bg-slate-700"
            >
              Sair
            </button>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">Escala Enfermagem · Beta 0.7</div>
        </div>
      ) : (
        <div className="absolute bottom-5 left-3 right-3">
          <button
            onClick={onLogout}
            title="Sair"
            className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-3 text-xl hover:bg-slate-800"
          >
            🚪
          </button>
        </div>
      )}
    </aside>
  );
}