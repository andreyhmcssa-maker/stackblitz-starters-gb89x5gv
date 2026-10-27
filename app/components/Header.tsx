type HeaderProps = {
  title: string;
  onToggleSidebar: () => void;
};

export default function Header({ title, onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          ☰
        </button>

        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-xs text-slate-500">
            Gestão de escalas hospitalares
          </p>
        </div>
      </div>

      {/* USUÁRIO */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 hover:bg-slate-100">
          🔔
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            A
          </div>

          <div className="hidden md:block">
            <div className="text-sm font-semibold">Administrador</div>
            <div className="text-xs text-slate-500">Gestão</div>
          </div>
        </div>
      </div>
    </header>
  );
}