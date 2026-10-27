import type { LayoutPost, LayoutRole, SectorLayout } from "./types";

export type SectorRowKind =
  | "posto"
  | "quantidade"
  | "ausencias"
  | "quantidade-ausencias";

export type SectorRow = {
  label: string;
  kind: SectorRowKind;
  rotation: boolean; // entra no rodízio automático?
};

// Data padrão de início do rodízio
export const ROTATION_START = "2026-10-01";

// Identificador novo para um posto
let idCounter = 0;
export const newId = () => Date.now() * 1000 + (idCounter++ % 1000);

const summaryRows: SectorRow[] = [
  { label: "QUANTIDADE", kind: "quantidade", rotation: false },
  { label: "AUSÊNCIAS", kind: "ausencias", rotation: false },
];

// Linhas de uma função num turno: cada vaga de um posto vira uma linha
export const buildRows = (role: LayoutRole, shift: string): SectorRow[] => {
  const posts = role.posts.filter((post) => (shift === "N" ? post.night : post.day));

  return [
    ...posts.flatMap((post) =>
      Array.from(
        { length: Math.max(1, post.slots) },
        (): SectorRow => ({
          label: post.label,
          kind: "posto",
          // o posto que recebe a sobra nunca entra no rodízio
          rotation: post.rotation && post.label !== role.spill,
        })
      )
    ),
    ...summaryRows,
  ];
};

// Uma planilha da escala setorial (função + turno)
export type LayoutBlock = {
  id: string;
  title: string; // ex.: "Enfermeiro Diurno"
  roleTitle: string; // ex.: "Enfermeiro"
  header: string; // cores do título
  rows: SectorRow[];
  role: string;
  shift: string;
  homeSectors?: Record<string, string>; // outras funções com posto fixo
  spill: string;
  rotationStart: string;
};

// Planilhas do setor: Diurno de todas as funções, depois Noturno
export const buildBlocks = (layout: SectorLayout | undefined): LayoutBlock[] => {
  if (!layout) return [];

  return ["D", "N"].flatMap((shift) =>
    layout.roles.flatMap((role): LayoutBlock[] => {
      const rows = buildRows(role, shift);

      if (!rows.some((row) => row.kind === "posto")) return [];

      const roleTitle = role.title.trim() || role.role;

      return [
        {
          id: `${role.role}-${shift}`,
          title: `${roleTitle} ${shift === "D" ? "Diurno" : "Noturno"}`,
          roleTitle,
          header:
            shift === "D" ? "bg-sky-200 text-sky-900" : "bg-blue-900 text-white",
          rows,
          role: role.role,
          shift,
          homeSectors:
            role.homes.length > 0
              ? Object.fromEntries(role.homes.map((home) => [home.role, home.post]))
              : undefined,
          spill: role.spill,
          rotationStart: layout.rotationStart,
        },
      ];
    })
  );
};

// Linhas da escala setorial de uma função (null = função fora da setorial desse setor)
export const getRowsForRole = (
  role: string,
  layout: SectorLayout | undefined
): SectorRow[] | null => {
  if (!layout) return null;

  const host = layout.roles.find(
    (item) => item.role === role || item.homes.some((home) => home.role === role)
  );

  return host ? buildRows(host, "D") : null;
};

// Postos (sem repetir) em que uma função pode ser fixada
export const getSectorOptions = (role: string, layout: SectorLayout | undefined) => {
  const rows = getRowsForRole(role, layout) ?? [];

  return Array.from(
    new Set(rows.filter((row) => row.kind === "posto").map((row) => row.label))
  );
};

// ───────────── MODELO DO PRONTO SOCORRO ─────────────

const post = (
  label: string,
  slots: number,
  rotation = true,
  dayOnly = false
): LayoutPost => ({
  id: newId(),
  label,
  slots,
  rotation,
  day: true,
  night: !dayOnly,
});

// O layout que usávamos até aqui, como ponto de partida
export const makePsTemplate = (): Omit<SectorLayout, "sectorId"> => ({
  rotationStart: ROTATION_START,
  roles: [
    {
      role: "Enfermeiro",
      title: "Enfermeiro",
      spill: "APOIO",
      homes: [],
      posts: [
        post("CLASSIFICAÇÃO", 1),
        post("UDC1 / UDC2 / SUT / ORT / ISO", 1),
        post("SALA VERMELHA", 1),
        post("UNIDADE DE AVC", 1),
        post("ECP", 2),
        post("APOIO", 2, false),
        post("AUDITORIA", 1, false, true),
        post("HORIZONTAL", 1, false, true),
      ],
    },
    {
      role: "Técnico de Enfermagem",
      title: "Técnicos de Enfermagem",
      spill: "APOIO",
      homes: [{ role: "Assistente Administrativo", post: "APOIO ADMINISTRATIVO" }],
      posts: [
        post("SALA VERMELHA", 3),
        post("AVC BOX 1/2", 1),
        post("AVC ROT 3, 4, 5", 1),
        post("AVC ROT 6, 7, 8", 1),
        post("ECP BOX 1/2", 1),
        post("ECP BOX 3/4", 1),
        post("ECP BOX 5/6", 1),
        post("ECP ROT 09, 03", 1),
        post("ECP ROT 10, 11, 12, 13", 1),
        post("ECP ROT 4, 5, 6, 14", 1),
        post("UDC 1", 2),
        post("UDC 2", 2),
        post("SUTURA", 1),
        post("ORTOPEDIA", 1),
        post("ACOLHIMENTO", 1),
        post("APOIO", 5, false),
        post("CIRCULANTE", 1, false, true),
        post("APOIO ADMINISTRATIVO", 2, false),
        post("FLUXISTA", 1, false),
        post("TREINAMENTO", 2, false),
      ],
    },
  ],
});

// O setor chamado "Pronto Socorro" já nasce com o modelo
export const isProntoSocorro = (name: string) => {
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return (
    clean === "ps" || clean.includes("pronto socorro") || clean.includes("pronto-socorro")
  );
};