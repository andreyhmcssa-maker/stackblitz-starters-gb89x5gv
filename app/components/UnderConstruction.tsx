"use client";

type Props = {
  title: string;
};

export default function UnderConstruction({ title }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      <div className="text-4xl">🚧</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-sm text-slate-500">Em construção</p>
    </div>
  );
}