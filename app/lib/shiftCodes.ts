// Cor de cada código na grade (etiquetas)
export const shiftBadge: Record<string, string> = {
  D: "bg-blue-100 text-blue-700",
  N: "bg-indigo-100 text-indigo-700",
  F: "bg-slate-200 text-slate-600",
  FA: "bg-red-100 text-red-700",
  ATE: "bg-purple-100 text-purple-700",
  FE: "bg-emerald-100 text-emerald-700",
  FO: "bg-slate-200 text-slate-600",
  "D/N": "bg-violet-100 text-violet-700",
};

// Nome de cada código
export const shiftLabel: Record<string, string> = {
  D: "Diurno",
  N: "Noturno",
  F: "Folga",
  FA: "Falta",
  ATE: "Atestado",
  FE: "Férias",
  FO: "Folga lançada",
  "D/N": "Dia e noite (24h)",
};