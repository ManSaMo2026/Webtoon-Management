import { Link, useOutletContext, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, CheckSquare, Square, Plus, Save, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { todosApi } from "../../api/todos";
import { projectsApi } from "../../api/projects";
import { scheduleApi } from "../../api/schedule";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Gauge, ProgressBar } from "../../components/ui/Gauge";
import { Button } from "../../components/ui/Button";
import { SkeletonCard } from "../../components/ui/Skeleton";
import type { Project, ProjectStatus } from "../../types";
import { useEffect, useState } from "react";
import { getProjectGenreLabel, getProjectStatusLabel } from "../../utils/project";
import { MiniCalendar, toLocalDateValue } from "../../components/ui/MiniCalendar";
import { WorkTimeline } from "../../components/dashboard/WorkTimeline";

function getDday(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

type StatusChoice = Exclude<ProjectStatus, "기획중">;
const STATUS_OPTIONS: StatusChoice[] = ["연재중", "휴재중", "완결", "기타"];

function statusFormValue(project: Project): StatusChoice {
  if (project.currentEpisode >= project.totalEpisodes) return "완결";
  return STATUS_OPTIONS.includes(project.status as StatusChoice) ? project.status as StatusChoice : project.status ? "기타" : "연재중";
}

export function DashboardTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const dday = getDday(project.nextDeadline);
  const isCompleted = project.status === "완결" || project.currentEpisode >= project.totalEpisodes;
  const scheduleResult = scheduleApi.calculateSync({
    cuts: project.avgCuts,
    weeklyHours: project.weeklyHours,
    colorMode: project.colorMode,
    bgComplexity: project.bgComplexity,
    hasAssistant: project.hasAssistant,
    deadlineDays: Math.max(1, dday),
  });
  const nextAction = isCompleted
    ? { to: `/projects/${id}/story`, title: "완결 작품의 구성 자료를 살펴보세요", description: "소개용 레퍼런스 프로젝트입니다. 스토리, 캐릭터, 세계관 탭에서 정리 방식을 확인할 수 있습니다.", label: "스토리 자료 보기" }
    : project.logline.trim()
    ? { to: `/projects/${id}/schedule`, title: "첫 일정 진단을 확인해보세요", description: "입력한 작업량과 마감일을 바탕으로 부족한 시간을 확인할 수 있습니다.", label: "일정 진단 보기" }
    : { to: `/projects/${id}/story`, title: "먼저 작품의 한 줄 소개를 적어보세요", description: "작품의 중심을 정하면 캐릭터와 장면을 설계하기 쉬워집니다.", label: "스토리 시작하기" };
  const [newTodo, setNewTodo] = useState("");
  const [nextDeadline, setNextDeadline] = useState(() => toLocalDateValue(project.nextDeadline));
  const [currentEpisode, setCurrentEpisode] = useState(project.currentEpisode);
  const [status, setStatus] = useState<StatusChoice>(() => statusFormValue(project));
  const [customStatus, setCustomStatus] = useState(() => project.status === "기타" ? project.customStatus ?? "" : project.status === "기획중" ? "기획중" : "");

  const changeCurrentEpisode = (value: number) => {
    setCurrentEpisode(value);
    if (value >= project.totalEpisodes) setStatus("완결");
    else if (status === "완결") setStatus("연재중");
  };

  useEffect(() => setNextDeadline(toLocalDateValue(project.nextDeadline)), [project.nextDeadline]);
  useEffect(() => {
    setCurrentEpisode(project.currentEpisode);
    setStatus(statusFormValue(project));
    setCustomStatus(project.status === "기타" ? project.customStatus ?? "" : project.status === "기획중" ? "기획중" : "");
  }, [project]);

  const { data: todos, isLoading } = useQuery({
    queryKey: ["todos", id],
    queryFn: () => todosApi.list(id!),
  });

  const toggleMutation = useMutation({
    mutationFn: todosApi.toggle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", id] }),
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => todosApi.create({ projectId: id!, content, done: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["todos", id] }); setNewTodo(""); },
    onError: () => toast.error("추가 실패"),
  });

  const deleteTodoMutation = useMutation({
    mutationFn: todosApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", id] }),
  });

  const deadlineMutation = useMutation({
    mutationFn: () => projectsApi.update(project.id, { nextDeadline: new Date(`${nextDeadline}T23:59:59`).toISOString() }),
    onSuccess: (updatedProject) => {
      qc.setQueryData(["project", project.id], updatedProject);
      qc.setQueryData<Project[]>(["projects"], (projects) => projects?.map((item) => item.id === updatedProject.id ? updatedProject : item));
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("다음 마감일이 저장되었습니다.");
    },
    onError: () => toast.error("마감일을 저장하지 못했습니다."),
  });

  const progressMutation = useMutation({
    mutationFn: () => projectsApi.update(project.id, { currentEpisode, status, customStatus: status === "기타" ? customStatus.trim() : "" }),
    onSuccess: (updatedProject) => {
      qc.setQueryData(["project", project.id], updatedProject);
      qc.setQueryData<Project[]>(["projects"], (projects) => projects?.map((item) => item.id === updatedProject.id ? updatedProject : item));
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("연재 진행상황이 저장되었습니다.");
    },
    onError: () => toast.error("연재 진행상황을 저장하지 못했습니다."),
  });

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-accent/40">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm"><Sparkles size={18} /></span>
            <div>
              <p className="text-xs font-semibold text-primary">지금 할 일</p>
              <h2 className="mt-1 text-base font-bold text-text">{nextAction.title}</h2>
              <p className="mt-1 text-sm leading-6 text-text-body">{nextAction.description}</p>
            </div>
          </div>
          <Link to={nextAction.to} className="shrink-0"><Button size="sm">{nextAction.label}<ArrowRight size={14} /></Button></Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* D-day */}
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className={`text-3xl font-bold font-mono mb-1 ${isCompleted ? "text-primary" : dday <= 2 ? "text-red-500" : dday <= 5 ? "text-amber-500" : "text-emerald-500"}`}>
            {isCompleted ? "완결" : dday <= 0 ? "마감 초과" : `D-${dday}`}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-text-body"><Clock size={14} />{isCompleted ? "연재 상태" : "다음 마감일"}</p>
          {!isCompleted && <p className="mt-1.5 text-base font-bold tracking-[-0.02em] text-foreground">
            {new Date(project.nextDeadline).toLocaleDateString("ko-KR")}
          </p>}
        </Card>

        {/* Success rate */}
        <Card className="flex flex-col items-center justify-center py-4">
          {isCompleted ? <><p className="font-mono text-3xl font-bold text-primary">{project.totalEpisodes}화</p><p className="mt-2 text-xs text-muted-foreground">총 연재 회차</p></> : <><Gauge value={scheduleResult.successRate} size="md" colorize label="마감 가능성 참고값" /><p className="mt-1 text-center text-[11px] text-muted-foreground">현재 입력값을 이용한 수식 기반 추정</p></>}
        </Card>

        {/* Progress */}
        <Card className="flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">연재 진행</div><span className="text-xs font-bold text-primary">{getProjectStatusLabel({ status, customStatus })}</span></div>
          <div className="flex items-end justify-between"><span className="text-xs text-text-muted">현재 회차</span><span className="font-mono text-base font-extrabold text-text">{currentEpisode}/{project.totalEpisodes}</span></div>
          <input type="range" min={0} max={project.totalEpisodes} step={1} value={currentEpisode} onChange={(event) => changeCurrentEpisode(Number(event.target.value))} aria-label={`현재 연재 회차, 총 ${project.totalEpisodes}화 중 ${currentEpisode}화`} className="h-2 w-full cursor-ew-resize accent-primary" />
          <div className="flex items-center justify-between text-xs text-muted-foreground"><span>0화</span><span><strong className="font-mono text-foreground">{Math.max(0, project.totalEpisodes - currentEpisode)}</strong>화 남음</span><span>{project.totalEpisodes}화</span></div>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusChoice)} aria-label="연재 진행상황" className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-xs font-semibold text-text outline-none focus:ring-2 focus:ring-primary">
            {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {status === "기타" && <input value={customStatus} onChange={(event) => setCustomStatus(event.target.value)} maxLength={30} placeholder="진행상황 직접 입력" aria-label="기타 연재 진행상황" className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-xs text-text outline-none focus:ring-2 focus:ring-primary" />}
          <Button size="sm" variant="outline" loading={progressMutation.isPending} disabled={(currentEpisode === project.currentEpisode && status === statusFormValue(project) && (status !== "기타" || customStatus.trim() === (project.customStatus ?? ""))) || (status === "기타" && !customStatus.trim())} onClick={() => progressMutation.mutate()}><Save size={13} />진행상황 저장</Button>
        </Card>

        {/* Risk */}
        <Card className="flex flex-col justify-center gap-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isCompleted ? "자료 안내" : "가장 큰 일정 요인"}</div>
          {isCompleted ? <div><p className="text-sm font-semibold">완결 작품 레퍼런스</p><p className="mt-2 text-xs leading-5 text-muted-foreground">공개된 작품 정보를 만사모의 관리 구조에 맞춰 정리한 소개용 데이터입니다.</p></div> : <div>
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{scheduleResult.riskFactors[0]?.label}</span><Badge variant={scheduleResult.riskFactors[0]?.severity === "high" ? "danger" : scheduleResult.riskFactors[0]?.severity === "medium" ? "warning" : "success"}>{scheduleResult.riskFactors[0]?.severity === "high" ? "높음" : scheduleResult.riskFactors[0]?.severity === "medium" ? "보통" : "낮음"}</Badge></div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{scheduleResult.riskFactors[0]?.detail}</p>
          </div>}
          <Link to={isCompleted ? `/projects/${id}/story` : `/projects/${id}/schedule`} className="text-xs font-semibold text-primary hover:underline">{isCompleted ? "구성 자료 보기 →" : "계산 근거 확인하기 →"}</Link>
        </Card>
      </div>

      {/* Project info, todo, and deadline */}
      <div className={`grid grid-cols-1 gap-4 ${isCompleted ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
        <Card>
          <CardHeader>
            <div><CardTitle>프로젝트 정보</CardTitle>{isCompleted && <p className="mt-1 text-[11px] text-muted-foreground">작업량 관련 값은 화면 시연을 위한 가정값입니다.</p>}</div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {[
              ["장르", getProjectGenreLabel(project)],
              ["연재 주기", project.cadence],
              ["연재 상태", getProjectStatusLabel(project)],
              ["최종 완결일", project.completionDate ? new Date(project.completionDate).toLocaleDateString("ko-KR") : "미정"],
              ["주당 작업 시간", `${project.weeklyHours}시간`],
              ["1화 평균 컷 수", `${project.avgCuts}컷`],
              ["채색 방식", project.colorMode],
              ["배경 복잡도", project.bgComplexity],
              ["어시스턴트", project.hasAssistant ? "있음" : "없음"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="font-medium text-sm">{v}</p>
              </div>
            ))}
          </div>
          {project.logline && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">로그라인</p>
              <p className="text-sm text-foreground">{project.logline}</p>
            </div>
          )}
        </Card>

        {/* Todo */}
        <Card>
          <CardHeader>
            <CardTitle>할 일 체크리스트</CardTitle>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard lines={3} />
          ) : (
            <div className="space-y-2">
              {todos?.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleMutation.mutate(todo.id)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {todo.done ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  </button>
                  <span className={`flex-1 text-sm ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {todo.content}
                  </span>
                  <button
                    onClick={() => deleteTodoMutation.mutate(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newTodo.trim() && addMutation.mutate(newTodo.trim())}
                  placeholder="새 할 일 추가..."
                  className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => newTodo.trim() && addMutation.mutate(newTodo.trim())}
                  disabled={!newTodo.trim() || addMutation.isPending}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {!isCompleted && (
          <Card padding="none" className="flex flex-col overflow-hidden">
            <MiniCalendar value={nextDeadline} onChange={setNextDeadline} embedded />
            <div className="mt-auto flex flex-col gap-3 border-t border-border px-5 py-4">
              <p className="text-xs leading-5 text-text-muted">저장하면 D-day와 마감 가능성 계산에 반영됩니다.</p>
              <Button className="w-full" size="sm" loading={deadlineMutation.isPending} disabled={!nextDeadline || nextDeadline === toLocalDateValue(project.nextDeadline)} onClick={() => deadlineMutation.mutate()}><Save size={14} />마감일 저장</Button>
            </div>
          </Card>
        )}
      </div>

      {!isCompleted && <WorkTimeline projectId={project.id} deadline={nextDeadline} todos={todos ?? []} />}
    </div>
  );
}
