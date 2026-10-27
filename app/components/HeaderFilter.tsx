"use client";

import { useEffect, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: Option[]; // a primeira opção é sempre a de "mostrar todos"
  onChange: (value: string) => void;
};

export default function HeaderFilter({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = value !== options[0]?.value;
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">

      <button
        onClick={() => setOpen(!open)}
        className={`-mx-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold transition hover:bg-slate-200 ${
          active ? "text-blue-700" : ""
        }`}
      >
        {label}

        {active && selected && (
          <span className="max-w-[80px] truncate rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold">
            {selected.label}
          </span>
        )}

        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-64 min-w-[200px] overflow-y-auto rounded-xl border bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition hover:bg-slate-50 ${
                option.value === value
                  ? "font-semibold text-blue-700"
                  : "font-normal text-slate-700"
              }`}
            >
              {option.label}
              {option.value === value && <span>✓</span>}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}