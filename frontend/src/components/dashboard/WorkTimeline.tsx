import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { timelineApi } from "../../api/timeline";
import { Button } from "../ui/Button";
import type { TimelineItem, Todo } from "../../types";

interface WorkTimelineProps {
  projectId: string;
  deadline: string;
  todos: Todo[];
}

const DAY_MS = 86400000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function differenceInDays(date: Date, start: Date) {
  return Math.round((startOfDay(date).getTime() - startOfDay(start).getTime()) / DAY_MS);
}

function firstDayOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function WorkTimeline({ projectId, deadline, todos }: WorkTimelineProps) {
  const queryClient = useQueryClient();
  const today = startOfDay(new Date());
  const todayValue = toDateValue(today);
  const [visibleStart, setVisibleStart] = useState(() => firstDayOfMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(todayValue);
  const [endDate, setEndDate] = useState(todayValue);

  const dayCount = new Date(visibleStart.getFullYear(), visibleStart.getMonth() + 1, 0).getDate();
  const dates = useMemo(() => Array.from({ length: dayCount }, (_, index) => addDays(visibleStart, index)), [dayCount, visibleStart]);
  const visibleEnd = dates[dates.length - 1];
  const deadlineDate = parseDate(deadline);
  const todayIndex = differenceInDays(today, visibleStart);
  const deadlineIndex = differenceInDays(deadlineDate, visibleStart);
  const isDeadlineVisible = deadlineIndex >= 0 && deadlineIndex < dayCount;
  const isTodayVisible = todayIndex >= 0 && todayIndex < dayCount;
  const periodStart = Math.max(0, todayIndex);
  const periodEnd = Math.min(dayCount - 1, deadlineIndex);
  const isPeriodVisible = deadlineDate >= today && periodStart <= periodEnd;

  const { data: timelineItems = [], isLoading } = useQuery({
    queryKey: ["timeline-items", projectId],
    queryFn: () => timelineApi.list(projectId),
  });

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setStartDate(todayValue);
    setEndDate(todayValue);
    setFormOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: () => editingId
      ? timelineApi.update(editingId, { title: title.trim(), startDate, endDate })
      : timelineApi.create({ projectId, title: title.trim(), startDate, endDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-items", projectId] });
      toast.success(editingId ? "일정이 수정되었습니다." : "일정이 추가되었습니다.");
      resetForm();
    },
    onError: () => toast.error("일정을 저장하지 못했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: timelineApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-items", projectId] });
      toast.success("일정이 삭제되었습니다.");
    },
    onError: () => toast.error("일정을 삭제하지 못했습니다."),
  });

  const submitSchedule = () => {
    if (!title.trim()) return toast.error("일정 제목을 입력해주세요.");
    if (!startDate || !endDate) return toast.error("시작일과 종료일을 선택해주세요.");
    if (endDate < startDate) return toast.error("종료일은 시작일보다 빠를 수 없습니다.");
    saveMutation.mutate();
  };

  const editSchedule = (item: TimelineItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setFormOpen(true);
  };

  const changeMonth = (amount: number) => setVisibleStart((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const visibleItems = timelineItems.filter((item) => parseDate(item.endDate) >= visibleStart && parseDate(item.startDate) <= visibleEnd);
  const monthLabel = `${visibleStart.getFullYear()}년 ${visibleStart.getMonth() + 1}월`;
  const gridColumns = `repeat(${dayCount}, minmax(58px, 1fr))`;
  const minimumWidth = `${dayCount * 58}px`;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white" aria-labelledby="work-timeline-title">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="work-timeline-title" className="text-base font-bold text-text">작업 일정 타임라인</h3>
          <p className="mt-1 text-xs leading-5 text-text-muted">작업 기간을 일정으로 추가하고 월별 흐름을 확인합니다.</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setFormOpen(true); }}><Plus size={14} />새 일정</Button>
      </div>

      {formOpen && (
        <div className="border-b border-border bg-accent/30 px-5 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_170px_auto] lg:items-end">
            <label className="space-y-1.5 text-sm font-semibold text-text">일정 이름<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 12화 콘티 작업" autoFocus className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-primary" /></label>
            <label className="space-y-1.5 text-sm font-semibold text-text">시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-primary" /></label>
            <label className="space-y-1.5 text-sm font-semibold text-text">종료일<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-primary" /></label>
            <div className="flex gap-2">
              <Button size="sm" loading={saveMutation.isPending} onClick={submitSchedule}>{editingId ? "수정 저장" : "일정 추가"}</Button>
              <Button size="sm" variant="ghost" aria-label="일정 입력 닫기" onClick={resetForm}><X size={15} /></Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative inline-flex w-fit cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-base font-bold text-text hover:bg-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
          <span aria-hidden="true">{monthLabel}</span>
          <Pencil size={13} className="text-text-muted" aria-hidden="true" />
          <span className="sr-only">표시할 월 선택</span>
          <input type="month" value={toMonthValue(visibleStart)} onChange={(event) => { const [year, month] = event.target.value.split("-").map(Number); if (year && month) setVisibleStart(new Date(year, month - 1, 1)); }} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달 보기" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ChevronLeft size={17} /></button>
          <button type="button" onClick={() => setVisibleStart(firstDayOfMonth())} className="h-9 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">오늘</button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달 보기" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ChevronRight size={17} /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: minimumWidth }}>
          <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: gridColumns }}>
            {dates.map((date) => {
              const isToday = differenceInDays(date, today) === 0;
              return (
                <div key={date.toISOString()} className="border-r border-border/70 py-2 text-center last:border-r-0">
                  <p className={clsx("text-[11px] font-semibold", isToday ? "text-primary" : "text-text-muted")}>{date.toLocaleDateString("ko-KR", { weekday: "short" })}</p>
                  <p className={clsx("mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold", isToday ? "bg-primary text-white" : "text-text")}>{date.getDate()}</p>
                </div>
              );
            })}
          </div>

          <div className="relative min-h-52 border-b border-border" style={{ backgroundImage: "linear-gradient(to right, var(--color-border) 1px, transparent 1px)", backgroundSize: `${100 / dayCount}% 100%` }}>
            {isTodayVisible && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary/60" style={{ left: `${((todayIndex + 0.5) / dayCount) * 100}%` }} />}
            <div className="grid gap-y-2 px-1 py-3" style={{ gridTemplateColumns: gridColumns, gridAutoRows: "44px" }}>
              {isPeriodVisible && <div className="z-20 mx-1 flex min-w-0 items-center rounded-md border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary" style={{ gridColumn: `${periodStart + 1} / ${periodEnd + 2}`, gridRow: 1 }}><span className="truncate">이번 작업 기간 · 오늘부터 마감일까지</span></div>}

              {isTodayVisible && todos.length > 0 && <div className="z-20 mx-1 flex min-w-0 items-center gap-2 rounded-md border border-primary/20 bg-white px-3 shadow-sm" style={{ gridColumn: `${todayIndex + 1} / span ${Math.min(5, dayCount - todayIndex)}`, gridRow: 2 }}><Check size={13} className="shrink-0 text-primary" /><span className="truncate text-xs font-semibold text-text">오늘의 할 일 {todos.filter((todo) => todo.done).length}/{todos.length} · {todos.find((todo) => !todo.done)?.content ?? "모두 완료"}</span></div>}

              {isDeadlineVisible && <div className={clsx("z-20 mx-1 flex min-w-0 items-center justify-center gap-1 rounded-md border px-2 text-xs font-bold", deadlineDate < today ? "border-red-200 bg-red-50 text-red-600" : "border-primary/25 bg-primary text-white")} style={{ gridColumn: `${deadlineIndex + 1} / span ${Math.min(2, dayCount - deadlineIndex)}`, gridRow: 3 }}><CalendarClock size={13} /><span className="truncate">다음 마감</span></div>}

              {visibleItems.map((item, index) => {
                const itemStart = Math.max(0, differenceInDays(parseDate(item.startDate), visibleStart));
                const itemEnd = Math.min(dayCount - 1, differenceInDays(parseDate(item.endDate), visibleStart));
                return (
                  <div key={item.id} className="group z-20 mx-1 flex min-w-0 items-center rounded-md border border-primary/30 bg-accent px-2 text-xs font-semibold text-primary shadow-sm" style={{ gridColumn: `${itemStart + 1} / ${itemEnd + 2}`, gridRow: index + 4 }}>
                    <button type="button" onClick={() => editSchedule(item)} className="min-w-0 flex-1 truncate text-left focus-visible:outline-2 focus-visible:outline-primary" title={`${item.title} · ${item.startDate} ~ ${item.endDate}`}>{item.title}</button>
                    <button type="button" onClick={() => deleteMutation.mutate(item.id)} aria-label={`${item.title} 일정 삭제`} className="ml-1 shrink-0 rounded p-1 text-primary/60 opacity-0 hover:bg-white/70 hover:text-destructive focus:opacity-100 group-hover:opacity-100"><Trash2 size={12} /></button>
                  </div>
                );
              })}

              {!isLoading && visibleItems.length === 0 && !isPeriodVisible && !isTodayVisible && !isDeadlineVisible && <p className="col-span-full px-4 py-6 text-sm text-text-muted">이 달에는 등록된 일정이 없습니다. `새 일정`을 눌러 작업 구간을 추가해보세요.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
