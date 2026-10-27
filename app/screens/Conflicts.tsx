"use client";

import { useState } from "react";
import type {
  Collaborator,
  Occurrence,
  OccurrenceInput,
  Relocation,
  Swap,
  TreCredit,
  TreCreditInput,
} from "../lib/types";
import {
  describeDates,
  isOffKind,
  occurrenceLabel,
  occurrenceStyle,
} from "../lib/occurrences";
import type { OccurrenceKind } from "../lib/occurrences";
import {
  debtStatusLabel,
  debtStatusStyle,
  getDebtStatus,
  getPayShift,
  todayIso,
} from "../lib/relocations";
import { creditBalance, creditUsed } from "../lib/tre";
import { formatSwapDate, swapShiftName } from "../lib/swaps";
import OccurrenceModal from "../components/OccurrenceModal";
import PayDateModal from "../components/PayDateModal";
import TreCreditModal from "../components/TreCreditModal";
import type { Holiday, HolidayInput } from "../lib/types";
import { countUpcomingHolidays } from "../lib/holidays";
import HolidaysPanel from "../components/HolidaysPanel";

type Props = {
  monthLabel: string;
  monthKey: string; // AAAA-MM do mês exibido
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  collaborators: Collaborator[];
  occurrences: Occurrence[];
  swaps: Swap[];
  relocations: Relocation[];
  credits: TreCredit[];
  getShiftOn: (person: Collaborator, dateIso: string) => string;
  onAddOccurrence: (occurrence: OccurrenceInput) => void;
  onRemoveOccurrence: (id: number) => void;
  onSetPayDate: (id: number, payDate: string, payShift: string) => void;
  onAddCredit: (credit: TreCreditInput) => void;
  onUpdateCredit: (id: number, granted: number) => void;
  onRemoveCredit: (id: number) => void;
  holidays: Holiday[];
  roles: string[];
  onAddHolidays: (items: HolidayInput[]) => void;
  onRemoveHoliday: (id: number) => void;
  canEdit: boolean;
};

const navButton = "rounded-lg border px-4 py-2 text-sm hover:bg-slate-50";

const filterClass = "rounded-lg border bg-white px-3 py-2 text-sm";

const tabs = ["Lançamentos", "Eu devo", "Me deve", "Folgas TRE", "Feriados"];

const kinds: OccurrenceKind[] = ["ATE", "FE", "FA", "FJ", "FT"];

// tira acentos e maiúsculas para a busca achar "joao" em "João"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function Conflicts({
  monthLabel,
  monthKey,
  onPrevious,
  onToday,
  onNext,
  collaborators,
  occurrences,
  swaps,
  relocations,
  credits,
  getShiftOn,
  onAddOccurrence,
  onRemoveOccurrence,
  onSetPayDate,
  onAddCredit,
  onUpdateCredit,
  onRemoveCredit,
  holidays,
  roles,
  onAddHolidays,
  onRemoveHoliday,
  canEdit,
}: Props) {
  const [tab, setTab] = useState("Lançamentos");
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [debtFilter, setDebtFilter] = useState("aberto");
  const [treFilter, setTreFilter] = useState("saldo");
  const [payTarget, setPayTarget] = useState<Relocation | null>(null);
  // null = fechado · { credit: null } = novo saldo · { credit } = alterar quantidade
  const [creditModal, setCreditModal] = useState<{ credit: TreCredit | null } | null>(
    null
  );

  const nameById = new Map(collaborators.map((person) => [person.id, person.name]));
  const nameOf = (id: number) => nameById.get(id) ?? "Colaborador removido";

  const today = todayIso();

  // ───────────── LANÇAMENTOS ─────────────

  // lançamentos que têm algum dia no mês exibido
  const monthList = occurrences.filter(
    (item) =>
      item.dates.some((date) => date.startsWith(monthKey)) &&
      (typeFilter === "todos" || item.kind === typeFilter)
  );

  const ids = Array.from(new Set(monthList.map((item) => item.personId)));

  const allHistory = ids.map((id) => ({
    id,
    name: nameOf(id),
    list: monthList
      .filter((item) => item.personId === id)
      .sort((a, b) => a.dates[0].localeCompare(b.dates[0])),
  }));

  // pesquisa só pelo nome, em ordem alfabética
  const history = allHistory
    .filter((person) =>
      normalize(person.name).includes(normalize(search.trim()))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const handleRemove = (id: number) => {
    if (
      window.confirm(
        "Desfazer este lançamento? A escala volta ao que era antes nesses dias."
      )
    ) {
      onRemoveOccurrence(id);
    }
  };

  // ───────────── EU DEVO / ME DEVE ─────────────

  const isDebtTab = tab === "Eu devo" || tab === "Me deve";
  const debtKind = tab === "Eu devo" ? "casa" : "colaborador";

  // dívidas em aberto de cada aba (para o número no título)
  const openCount = (kind: string) =>
    relocations.filter(
      (item) => item.kind === kind && getDebtStatus(item, today) !== "quitado"
    ).length;

  // todos os meses: a dívida vale até ser paga
  const debtList = relocations.filter((item) => {
    if (item.kind !== debtKind) return false;

    const status = getDebtStatus(item, today);

    if (debtFilter === "todos") return true;
    if (debtFilter === "aberto") return status !== "quitado";

    return status === debtFilter;
  });

  const debtPeople = Array.from(new Set(debtList.map((item) => item.personId)))
    .map((id) => ({
      id,
      name: nameOf(id),
      list: debtList
        .filter((item) => item.personId === id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((person) =>
      normalize(person.name).includes(normalize(search.trim()))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const casa = debtKind === "casa";

  // ───────────── FOLGAS TRE ─────────────

  const creditRows = credits.map((credit) => ({
    credit,
    used: creditUsed(credit, occurrences),
    balance: creditBalance(credit, occurrences),
  }));

  // total de folgas que ainda restam (para o número no título)
  const totalLeft = creditRows.reduce(
    (sum, row) => sum + Math.max(0, row.balance),
    0
  );

  const treRows = creditRows.filter(
    (row) => treFilter === "todos" || row.balance > 0
  );

  const trePeople = Array.from(new Set(treRows.map((row) => row.credit.personId)))
    .map((id) => ({
      id,
      name: nameOf(id),
      rows: treRows
        .filter((row) => row.credit.personId === id)
        .sort((a, b) => a.credit.election.localeCompare(b.credit.election, "pt-BR")),
    }))
    .filter((person) =>
      normalize(person.name).includes(normalize(search.trim()))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const handleRemoveCredit = (row: { credit: TreCredit; used: number }) => {
    if (row.used > 0) {
      window.alert(
        `Já foram lançadas ${row.used} folga(s) dessa eleição. Desfaça esses lançamentos antes de remover o saldo.`
      );
      return;
    }

    if (window.confirm("Remover este saldo de folgas TRE?")) {
      onRemoveCredit(row.credit.id);
    }
  };

  // número que aparece no título de cada aba
  const upcomingHolidays = countUpcomingHolidays(holidays, today);

  const tabCount: Record<string, number> = {
    Feriados: upcomingHolidays,
    "Eu devo": openCount("casa"),
    "Me deve": openCount("colaborador"),
    "Folgas TRE": totalLeft,
  };

  const subtitle =
    tab === "Lançamentos"
      ? monthLabel
      : tab === "Folgas TRE"
        ? "Saldo por eleição"
        : "Todos os meses";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

      <div className="flex shrink-0 flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex flex-wrap items-center gap-4">

          <div>
            <h2 className="text-xl font-bold">Conflitos</h2>

            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap rounded-xl border bg-white p-1">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === item
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item}

                {(tabCount[item] ?? 0) > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      tab === item
                        ? "bg-white/25 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {tabCount[item]}
                  </span>
                )}
              </button>
            ))}
          </div>

        </div>

        {tab === "Lançamentos" && (
          <div className="flex flex-wrap gap-2">

            <button onClick={onPrevious} className={navButton}>
              ← Anterior
            </button>

            <button onClick={onToday} className={navButton}>
              Atual
            </button>

            <button onClick={onNext} className={navButton}>
              Próximo →
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${canEdit ? "" : "hidden"}`}
            >
              + Novo lançamento
            </button>

          </div>
        )}

        {tab === "Folgas TRE" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCreditModal({ credit: null })}
              className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${canEdit ? "" : "hidden"}`}
            >
              + Novo saldo
            </button>
          </div>
        )}

      </div>

      {/* LANÇAMENTOS */}

      {tab === "Lançamentos" && (
        <>

          <div className="flex shrink-0 flex-wrap gap-3 border-b bg-slate-50 p-4">

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome..."
              className={`${filterClass} w-64`}
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={filterClass}
            >
              <option value="todos">Todos os tipos</option>
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {occurrenceLabel[item]}
                </option>
              ))}
            </select>

          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

            {allHistory.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum lançamento neste mês.
              </p>
            )}

            {allHistory.length > 0 && history.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum colaborador encontrado.
              </p>
            )}

            {history.map((person) => (

              <div key={person.id} className="rounded-xl border">

                <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">{person.name}</span>

                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                    {person.list.length}{" "}
                    {person.list.length === 1 ? "lançamento" : "lançamentos"}
                  </span>
                </div>

                <ul className="divide-y">

                  {person.list.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                    >

                      <div className="space-y-1.5 text-slate-700">

                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${occurrenceStyle[item.kind]}`}
                        >
                          {occurrenceLabel[item.kind]}
                        </span>

                        <div>{describeDates(item.dates)}</div>

                        {item.note && (
                          <div className="text-xs text-slate-500">
                            {isOffKind(item.kind) ? "Justificativa" : "Observação"}: {item.note}
                          </div>
                        )}

                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Desfazer
                      </button>

                    </li>
                  ))}

                </ul>

              </div>

            ))}

          </div>

        </>
      )}

      {/* EU DEVO / ME DEVE */}

      {isDebtTab && (
        <>

          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-slate-50 p-4">

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome..."
              className={`${filterClass} w-64`}
            />

            <select
              value={debtFilter}
              onChange={(event) => setDebtFilter(event.target.value)}
              className={filterClass}
            >
              <option value="aberto">Em aberto</option>
              <option value="sem-data">Sem data</option>
              <option value="agendado">Agendado</option>
              <option value="quitado">Quitado</option>
              <option value="todos">Todos</option>
            </select>

            <span className="text-xs text-slate-500">
              {casa
                ? "Remanejos pedidos pela casa: a casa deve uma folga ao colaborador."
                : "Remanejos pedidos pelo colaborador: ele deve um plantão à casa."}
            </span>

          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

            {debtList.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                {debtFilter === "aberto"
                  ? "Nenhuma dívida em aberto."
                  : "Nenhum remanejo encontrado neste filtro."}
              </p>
            )}

            {debtList.length > 0 && debtPeople.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum colaborador encontrado.
              </p>
            )}

            {debtPeople.map((person) => (

              <div key={person.id} className="rounded-xl border">

                <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">{person.name}</span>

                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                    {person.list.length}{" "}
                    {person.list.length === 1 ? "remanejo" : "remanejos"}
                  </span>
                </div>

                <ul className="divide-y">

                  {person.list.map((item) => {
                    const status = getDebtStatus(item, today);
                    const turno = swapShiftName[item.shift];

                    return (
                      <li
                        key={item.id}
                        className="flex flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                      >

                        <div className="space-y-1.5 text-slate-700">

                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${debtStatusStyle[status]}`}
                          >
                            {debtStatusLabel[status]}
                          </span>

                          <div>
                            <span className="mr-2 font-bold text-emerald-600">↻</span>
                            {casa ? "Veio trabalhar" : "Folgou"} no plantão{" "}
                            <strong>
                              {turno} {formatSwapDate(item.date)}
                            </strong>
                            .{" "}
                            {casa ? "A casa deve uma folga." : "Deve um plantão à casa."}
                          </div>

                          <div className="text-xs text-slate-500">
                            {item.payDate
                              ? `Pagamento: ${casa ? "folga" : "trabalha"} em ${formatSwapDate(item.payDate)} (${swapShiftName[getPayShift(item)]})`
                              : "Sem data de pagamento"}
                          </div>

                        </div>

                        <button
                          onClick={() => setPayTarget(item)}
                          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${canEdit ? "" : "hidden"}`}
                        >
                          {item.payDate ? "Alterar pagamento" : "Definir pagamento"}
                        </button>

                      </li>
                    );
                  })}

                </ul>

              </div>

            ))}

          </div>

        </>
      )}

      {/* FOLGAS TRE */}

      {tab === "Folgas TRE" && (
        <>

          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-slate-50 p-4">

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome..."
              className={`${filterClass} w-64`}
            />

            <select
              value={treFilter}
              onChange={(event) => setTreFilter(event.target.value)}
              className={filterClass}
            >
              <option value="saldo">Com saldo</option>
              <option value="todos">Todos</option>
            </select>

            <span className="text-xs text-slate-500">
              Folgas dos mesários do TSE, por eleição. Lance as folgas em
              Lançamentos, no tipo Folga TRE.
            </span>

          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

            {treRows.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                {credits.length === 0
                  ? "Nenhum saldo cadastrado. Use + Novo saldo para começar."
                  : "Nenhum colaborador com saldo neste filtro."}
              </p>
            )}

            {treRows.length > 0 && trePeople.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum colaborador encontrado.
              </p>
            )}

            {trePeople.map((person) => {
              const left = person.rows.reduce(
                (sum, row) => sum + Math.max(0, row.balance),
                0
              );

              return (
                <div key={person.id} className="rounded-xl border">

                  <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-800">{person.name}</span>

                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                      {left} {left === 1 ? "folga restante" : "folgas restantes"}
                    </span>
                  </div>

                  <ul className="divide-y">

                    {person.rows.map((row) => (
                      <li
                        key={row.credit.id}
                        className="flex flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                      >

                        <div className="space-y-1.5 text-slate-700">

                          <div className="font-semibold">{row.credit.election}</div>

                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                              Ganhou {row.credit.granted}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                              Usou {row.used}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 ${
                                row.balance > 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              Restam {row.balance}
                            </span>
                          </div>

                        </div>

                        <div className="flex shrink-0 gap-2">

                          <button
                            onClick={() => setCreditModal({ credit: row.credit })}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${canEdit ? "" : "hidden"}`}
                          >
                            Alterar quantidade
                          </button>

                          <button
                            onClick={() => handleRemoveCredit(row)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 ${canEdit ? "" : "hidden"}`}
                          >
                            Remover
                          </button>

                        </div>

                      </li>
                    ))}

                  </ul>

                </div>
              );
            })}

          </div>

        </>
      )}

            {/* FERIADOS */}

            {tab === "Feriados" && (
        <HolidaysPanel
          holidays={holidays}
          roles={roles}
          onAdd={onAddHolidays}
          onRemove={onRemoveHoliday}
          canEdit={canEdit}
        />
      )}

      {modalOpen && (
        <OccurrenceModal
          people={collaborators.filter((person) => !person.terminationDate)}
          occurrences={occurrences}
          swaps={swaps}
          relocations={relocations}
          credits={credits}
          onSave={onAddOccurrence}
          onClose={() => setModalOpen(false)}
        />
      )}

      {payTarget && (
        <PayDateModal
          relocation={payTarget}
          person={collaborators.find((person) => person.id === payTarget.personId)}
          getShiftOn={getShiftOn}
          onSave={(payDate, payShift) => onSetPayDate(payTarget.id, payDate, payShift)}
          onClose={() => setPayTarget(null)}
        />
      )}

      {creditModal && (
        <TreCreditModal
          people={collaborators.filter((person) => !person.terminationDate)}
          credits={credits}
          occurrences={occurrences}
          editing={creditModal.credit}
          nameOf={nameOf}
          onCreate={onAddCredit}
          onUpdate={onUpdateCredit}
          onClose={() => setCreditModal(null)}
        />
      )}

    </section>
  );
}