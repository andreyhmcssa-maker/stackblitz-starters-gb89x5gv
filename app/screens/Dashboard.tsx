"use client";

import { useState } from "react";
import type { Collaborator } from "../lib/types";
import {
  RECENT_SICK_DAYS,
  UPCOMING_VACATION_DAYS,
  computeLeaves,
} from "../lib/leaves";
import type { LeaveItem } from "../lib/leaves";
import { COREN_WARNING_DAYS, getBirthdays, getCorenAlerts } from "../lib/dashboardAlerts";
import { daysUntil } from "../lib/holidays";
import { todayIso } from "../lib/relocations";
import { formatSwapDate } from "../lib/swaps";
import LeaveListModal from "../components/LeaveListModal";
import DashboardListModal from "../components/DashboardListModal";
import type { ListRow } from "../components/DashboardListModal";

type StatCardProps = {
  label: string;
  value: number;
  icon: string;
  iconClass: string;
  footer: string;
  footerClass: string;
  onClick?: () => void; // com onClick, o card abre uma lista
};

function StatCard({
  label,
  value,
  icon,
  iconClass,
  footer,
  footerClass,
  onClick,
}: StatCardProps) {
  const content = (
    <>

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 text-2xl ${iconClass}`}>
          {icon}
        </div>

      </div>

      <p className={`mt-3 text-xs ${footerClass}`}>
        {footer}
      </p>

    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

type Props = {
  collaboratorsCount: number;
  monthlyShifts: number;
  monthLabel: string;
  trades: number;
  conflicts: number;
  conflictsDetail: string; // ex.: "2 dívidas em aberto · 1 feriado chegando"
  onOpenConflicts: () => void;
  people: Collaborator[]; // colaboradores ativos
  getShiftOn: (person: Collaborator, dateIso: string) => string;
};

type OpenList = {
  title: string;
  items: LeaveItem[];
  hint: (item: LeaveItem) => string;
};

type OpenRows = {
  title: string;
  rows: ListRow[];
  emptyText: string;
};

const dias = (amount: number) => `${amount} ${amount === 1 ? "dia" : "dias"}`;

export default function Dashboard({
  collaboratorsCount,
  monthlyShifts,
  monthLabel,
  trades,
  conflicts,
  conflictsDetail,
  onOpenConflicts,
  people,
  getShiftOn,
}: Props) {
  const [openList, setOpenList] = useState<OpenList | null>(null);
  const [openRows, setOpenRows] = useState<OpenRows | null>(null);

  const today = todayIso();
  const leaves = computeLeaves(people, today, getShiftOn);

  // textos de cada lista de férias e atestados
  const endsIn = (item: LeaveItem) => {
    const days = daysUntil(item.end, today);

    return days === 0 ? "termina hoje" : `termina em ${dias(days)}`;
  };

  const startsIn = (item: LeaveItem) =>
    `começa em ${dias(daysUntil(item.start, today))}`;

  const startedAgo = (item: LeaveItem) => {
    const days = -daysUntil(item.start, today);

    if (days === 0) return "começou hoje";
    if (days === 1) return "começou ontem";

    return `começou há ${dias(days)}`;
  };

  // aniversariantes do mês de hoje
  const birthdays = getBirthdays(people, today);
  const birthdaysToday = birthdays.filter((item) => item.isToday).length;

  const monthName = new Date(`${today}T00:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    timeZone: "UTC",
  });

  const birthdayRows: ListRow[] = birthdays.map((item) => ({
    id: item.person.id,
    name: item.person.name,
    role: item.person.role,
    detail: `Dia ${item.day} · ${item.daysLeft >= 0 ? "faz" : "fez"} ${item.turning} anos`,
    badge: item.isToday
      ? "🎂 Hoje"
      : item.daysLeft > 0
        ? `Em ${dias(item.daysLeft)}`
        : "Já passou",
    badgeClass: item.isToday
      ? "bg-rose-100 text-rose-700"
      : item.daysLeft > 0
        ? "bg-sky-100 text-sky-700"
        : "bg-slate-100 text-slate-500",
  }));

  // COREN vencido ou a vencer
  const coren = getCorenAlerts(people, today);

  const corenRows: ListRow[] = coren.items.map((item) => ({
    id: item.person.id,
    name: item.person.name,
    role: item.person.role,
    detail: `Vencimento: ${formatSwapDate(item.expiry)}`,
    badge:
      item.days < 0
        ? `Vencido há ${dias(-item.days)}`
        : item.days === 0
          ? "Vence hoje"
          : `Vence em ${dias(item.days)}`,
    badgeClass:
      item.days < 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800",
  }));

  return (
    <>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Colaboradores"
          value={collaboratorsCount}
          icon="👥"
          iconClass="bg-blue-100"
          footer="Equipe cadastrada"
          footerClass="text-slate-500"
        />

        <StatCard
          label="Plantões no mês"
          value={monthlyShifts}
          icon="📅"
          iconClass="bg-emerald-100"
          footer={monthLabel}
          footerClass="text-slate-500"
        />

        <StatCard
          label="Trocas"
          value={trades}
          icon="🔄"
          iconClass="bg-amber-100"
          footer="Registradas no mês"
          footerClass="text-slate-500"
        />

        <StatCard
          label="Conflitos"
          value={conflicts}
          icon="⚠️"
          iconClass="bg-red-100"
          footer={conflictsDetail}
          footerClass="text-red-500"
          onClick={onOpenConflicts}
        />

      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="De férias"
          value={leaves.onVacation.length}
          icon="🏖️"
          iconClass="bg-emerald-100"
          footer="Hoje · clique para ver"
          footerClass="text-slate-500"
          onClick={() =>
            setOpenList({
              title: "De férias hoje",
              items: leaves.onVacation,
              hint: endsIn,
            })
          }
        />

        <StatCard
          label="Férias chegando"
          value={leaves.upcomingVacation.length}
          icon="🧳"
          iconClass="bg-sky-100"
          footer={`Próximos ${UPCOMING_VACATION_DAYS} dias · clique para ver`}
          footerClass="text-slate-500"
          onClick={() =>
            setOpenList({
              title: `Férias chegando (próximos ${UPCOMING_VACATION_DAYS} dias)`,
              items: leaves.upcomingVacation,
              hint: startsIn,
            })
          }
        />

        <StatCard
          label="De atestado"
          value={leaves.onSick.length}
          icon="🩺"
          iconClass="bg-purple-100"
          footer="Hoje · clique para ver"
          footerClass="text-slate-500"
          onClick={() =>
            setOpenList({
              title: "De atestado hoje",
              items: leaves.onSick,
              hint: endsIn,
            })
          }
        />

        <StatCard
          label="Entraram de atestado"
          value={leaves.enteredSick.length}
          icon="📋"
          iconClass="bg-rose-100"
          footer={`Últimos ${RECENT_SICK_DAYS} dias · clique para ver`}
          footerClass="text-slate-500"
          onClick={() =>
            setOpenList({
              title: `Entraram de atestado (últimos ${RECENT_SICK_DAYS} dias)`,
              items: leaves.enteredSick,
              hint: startedAgo,
            })
          }
        />

      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Aniversariantes do mês"
          value={birthdays.length}
          icon="🎂"
          iconClass="bg-pink-100"
          footer={
            birthdaysToday > 0
              ? `${birthdaysToday} ${birthdaysToday === 1 ? "faz aniversário hoje" : "fazem aniversário hoje"} · clique para ver`
              : "Clique para ver"
          }
          footerClass={birthdaysToday > 0 ? "text-rose-500" : "text-slate-500"}
          onClick={() =>
            setOpenRows({
              title: `Aniversariantes de ${monthName}`,
              rows: birthdayRows,
              emptyText: "Ninguém faz aniversário neste mês.",
            })
          }
        />

        <StatCard
          label="COREN vencido ou a vencer"
          value={coren.items.length}
          icon="🚨"
          iconClass="bg-orange-100"
          footer={`${coren.expired} ${coren.expired === 1 ? "vencido" : "vencidos"} · ${coren.expiring} a vencer (${COREN_WARNING_DAYS} dias)`}
          footerClass={coren.expired > 0 ? "text-red-500" : "text-slate-500"}
          onClick={() =>
            setOpenRows({
              title: `COREN vencido ou a vencer (próximos ${COREN_WARNING_DAYS} dias)`,
              rows: corenRows,
              emptyText: "Nenhum COREN vencido ou perto de vencer.",
            })
          }
        />

      </div>

      {openList && (
        <LeaveListModal
          title={openList.title}
          items={openList.items}
          hint={openList.hint}
          onClose={() => setOpenList(null)}
        />
      )}

      {openRows && (
        <DashboardListModal
          title={openRows.title}
          rows={openRows.rows}
          emptyText={openRows.emptyText}
          onClose={() => setOpenRows(null)}
        />
      )}

    </>
  );
}