import type { Adjustment, Collaborator, Fixation } from "./types";
import type { SectorRow } from "./sectorLayout";
import { buildMonthAssignments } from "./sectorAssignment";
import type { DayAssignment } from "./sectorAssignment";
import { getWeekdayShort, shortName } from "./utils";
import type { RowInput } from "jspdf-autotable";

// Quantos dias cabem por página (se o período for maior, divide em mais páginas)
const MAX_DAYS_PER_PAGE = 10;

// Período máximo aceito, para não gerar um PDF gigante sem querer
export const MAX_EXPORT_DAYS = 92;

type Rgb = [number, number, number];

export type ExportBlock = {
  title: string;
  rows: SectorRow[];
  role: string;
  shift: string;
  homeSectors?: Record<string, string>;
  spill: string;
  rotationStart: string;
};

type Line = {
  label: string;
  kind: "posto" | "quantidade";
  cells: string[]; // um texto por dia do período
};

type Params = {
  blocks: ExportBlock[];
  collaborators: Collaborator[];
  fixations: Fixation[];
  adjustments: Adjustment[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  from: string; // AAAA-MM-DD
  to: string; // AAAA-MM-DD
};

// Lista as datas de from até to (inclusive)
export const listDates = (from: string, to: string) => {
  const [year, month, day] = from.split("-").map(Number);
  const dates: string[] = [];

  for (let i = 0; i <= MAX_EXPORT_DAYS; i++) {
    const iso = new Date(Date.UTC(year, month - 1, day + i))
      .toISOString()
      .slice(0, 10);

    if (iso > to) break;
    dates.push(iso);
  }

  return dates;
};

// Divide o período em páginas com quantidades parecidas de dias
const splitDates = (dates: string[]) => {
  const pages = Math.max(1, Math.ceil(dates.length / MAX_DAYS_PER_PAGE));
  const size = Math.ceil(dates.length / pages);
  const chunks: { start: number; dates: string[] }[] = [];

  for (let i = 0; i < dates.length; i += size) {
    chunks.push({ start: i, dates: dates.slice(i, i + size) });
  }

  return chunks;
};

// Monta as linhas do bloco: setores, vagas EXTRA, excedentes e QUANTIDADE
const buildLines = (rows: SectorRow[], assignments: DayAssignment[]): Line[] => {
  const firstSummary = rows.findIndex((row) => row.kind !== "posto");
  const postoRows = rows.slice(0, firstSummary);
  const labels = postoRows.map((row) => row.label);

  const maxExtras: Record<string, number> = {};

  assignments.forEach((assignment) => {
    Object.entries(assignment.extras).forEach(([sector, slots]) => {
      maxExtras[sector] = Math.max(maxExtras[sector] ?? 0, slots.length);
    });
  });

  const maxOverflow = Math.max(
    0,
    ...assignments.map((assignment) => assignment.overflow.length)
  );

  const lines: Line[] = [];

  postoRows.forEach((row, rowIndex) => {
    lines.push({
      label: row.label,
      kind: "posto",
      cells: assignments.map((assignment) => {
        const slot = assignment.byRow[rowIndex];
        return slot ? shortName(slot.person.name) : "";
      }),
    });

    if (labels.lastIndexOf(row.label) === rowIndex) {
      for (let position = 0; position < (maxExtras[row.label] ?? 0); position++) {
        lines.push({
          label: `${row.label} (EXTRA)`,
          kind: "posto",
          cells: assignments.map((assignment) => {
            const slot = assignment.extras[row.label]?.[position];
            return slot ? shortName(slot.person.name) : "";
          }),
        });
      }
    }
  });

  for (let position = 0; position < maxOverflow; position++) {
    lines.push({
      label: "EXCEDENTE",
      kind: "posto",
      cells: assignments.map((assignment) => {
        const person = assignment.overflow[position];
        return person ? shortName(person.name) : "";
      }),
    });
  }

  lines.push({
    label: "QUANTIDADE",
    kind: "quantidade",
    cells: assignments.map((assignment) => String(assignment.total)),
  });

  return lines;
};

export const exportSchedulePdf = async ({
  blocks,
  collaborators,
  fixations,
  adjustments,
  getShiftOn,
  from,
  to,
}: Params) => {
  // carrega as bibliotecas só na hora de gerar (não pesa no resto do site)
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const dates = listDates(from, to);
  const chunks = splitDates(dates);

  // calcula cada bloco uma vez, para o período inteiro
  const prepared = blocks.map((block) => {
    const people = collaborators.filter(
      (person) =>
        person.role === block.role || Boolean(block.homeSectors?.[person.role])
    );

    const assignments = buildMonthAssignments({
      rows: block.rows,
      people,
      shift: block.shift,
      dates,
      fixations,
      adjustments,
      homeSectors: block.homeSectors,
      rotationStart: block.rotationStart,
      spillSector: block.spill,
      getShiftOn,
    });

    return { block, lines: buildLines(block.rows, assignments) };
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const MARGIN = 8;
  const GAP = 6;
  const SECTOR_WIDTH = 42;

  const border: Rgb = [203, 213, 225];
  const summaryFill: Rgb = [241, 245, 249];

  chunks.forEach((chunk, chunkIndex) => {
    if (chunkIndex > 0) doc.addPage();

    let y = MARGIN;

    const dayWidth = Math.min(
      28,
      (pageWidth - MARGIN * 2 - SECTOR_WIDTH) / chunk.dates.length
    );

    prepared.forEach(({ block, lines }) => {
      // só as linhas com nome neste trecho de dias (a QUANTIDADE sempre fica)
      const visible = lines
        .map((line) => ({
          ...line,
          cells: line.cells.slice(chunk.start, chunk.start + chunk.dates.length),
        }))
        .filter(
          (line) => line.kind === "quantidade" || line.cells.some((cell) => cell !== "")
        );

      // se o bloco provavelmente não cabe no resto da página, começa outra
      const estimatedHeight = (visible.length + 2) * 6;

      if (y > MARGIN && y + estimatedHeight > pageHeight - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }

      const dark = block.shift === "N";
      const titleFill: Rgb = dark ? [30, 58, 138] : [186, 230, 253];
      const titleText: Rgb = dark ? [255, 255, 255] : [12, 74, 110];

      const head: RowInput[] = [
        [
          {
            content: block.title.toUpperCase(),
            colSpan: chunk.dates.length + 1,
            styles: {
              halign: "left" as const,
              fillColor: titleFill,
              textColor: titleText,
              fontStyle: "bold" as const,
              fontSize: 9,
            },
          },
        ],
        [
          {
            content: "SETOR",
            styles: { halign: "left" as const, fillColor: [248, 250, 252] as Rgb },
          },
          ...chunk.dates.map((iso) => {
            const weekday = getWeekdayShort(iso);
            const weekend = weekday === "sáb" || weekday === "dom";

            return {
              content: `${iso.slice(8, 10)}/${iso.slice(5, 7)}\n(${weekday})`,
              styles: {
                halign: "center" as const,
                fillColor: (weekend ? [226, 232, 240] : [248, 250, 252]) as Rgb,
              },
            };
          }),
        ],
      ];

      const body: RowInput[] = visible.map((line) => {
        const summary = line.kind === "quantidade";

        return [
          {
            content: line.label,
            styles: {
              halign: "left" as const,
              fontStyle: summary ? ("bold" as const) : ("normal" as const),
              fillColor: (summary ? summaryFill : [255, 255, 255]) as Rgb,
            },
          },
          ...line.cells.map((cell) => ({
            content: cell,
            styles: {
              halign: "center" as const,
              fontStyle: summary ? ("bold" as const) : ("normal" as const),
              fillColor: (summary ? summaryFill : [255, 255, 255]) as Rgb,
            },
          })),
        ];
      });

      const columnStyles: Record<number, { cellWidth: number }> = {
        0: { cellWidth: SECTOR_WIDTH },
      };

      chunk.dates.forEach((_, index) => {
        columnStyles[index + 1] = { cellWidth: dayWidth };
      });

      autoTable(doc, {
        startY: y,
        head,
        body,
        theme: "grid",
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 1.2,
          lineColor: border,
          lineWidth: 0.2,
          textColor: [51, 65, 85],
          valign: "middle",
        },
        headStyles: { fontStyle: "bold", textColor: [51, 65, 85] },
        columnStyles,
        rowPageBreak: "avoid",
      });

      const last = (doc as unknown as { lastAutoTable?: { finalY: number } })
        .lastAutoTable;

      y = (last?.finalY ?? y) + GAP;
    });
  });

  doc.save(`escala-setorial_${from}_a_${to}.pdf`);
};