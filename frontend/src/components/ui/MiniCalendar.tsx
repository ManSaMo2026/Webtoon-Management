import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface MiniCalendarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  embedded?: boolean;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

export function toLocalDateValue(value: string) {
  return toDateValue(new Date(value));
}

export function MiniCalendar({ value, onChange, label = "다음 마감일", embedded = false }: MiniCalendarProps) {
  const selectedDate = fromDateValue(value);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const selectedLabel = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const todayValue = toDateValue(new Date());

  const moveMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <section className={clsx("bg-input-background p-4 sm:p-5", !embedded && "rounded-xl border border-border")} aria-labelledby="deadline-calendar-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="deadline-calendar-title" className="text-sm font-bold text-foreground">{label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">날짜를 선택하면 저장 후 D-day에 반영됩니다.</p>
        </div>
        <p className="text-sm font-semibold text-primary" aria-live="polite">{selectedLabel}</p>
      </div>

      <div className="mx-auto max-w-sm rounded-lg border border-border bg-white p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달 보기" className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <strong className="text-base font-bold tracking-[-0.02em] text-text">
            {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
          </strong>
          <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달 보기" className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center" aria-hidden="true">
          {WEEKDAYS.map((weekday, index) => (
            <span key={weekday} className={clsx("py-2 text-xs font-bold", index === 0 ? "text-red-500" : index === 6 ? "text-blue-600" : "text-text-muted")}>{weekday}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map((date) => {
            const dateValue = toDateValue(date);
            const isSelected = dateValue === value;
            const isToday = dateValue === todayValue;
            const isOutsideMonth = date.getMonth() !== visibleMonth.getMonth();
            return (
              <button
                key={dateValue}
                type="button"
                onClick={() => onChange(dateValue)}
                aria-label={date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                className={clsx(
                  "relative mx-auto flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  isSelected ? "bg-primary font-bold text-white hover:bg-primary/90" : "hover:bg-accent hover:text-primary",
                  !isSelected && isOutsideMonth && "text-muted-foreground/45",
                  !isSelected && !isOutsideMonth && "text-text",
                  isToday && !isSelected && "ring-1 ring-inset ring-primary/40 text-primary",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
