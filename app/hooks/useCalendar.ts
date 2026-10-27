import { useState } from "react";

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1).padStart(2, "0")
  );

  const monthLabel = currentDate
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (letter) => letter.toUpperCase());

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const getDateIso = (day: string) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${day}`;

  return {
    year,
    month,
    days,
    monthLabel,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    getDateIso,
  };
}