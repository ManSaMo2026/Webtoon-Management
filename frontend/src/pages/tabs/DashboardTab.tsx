import { Link, useOutletContext, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, CheckSquare, Square, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { todosApi } from "../../api/todos";
import { scheduleApi } from "../../api/schedule";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Gauge, ProgressBar } from "../../components/ui/Gauge";
import { Button } from "../../components/ui/Button";
import { SkeletonCard } from "../../components/ui/Skeleton";
import type { Project } from "../../types";
import { useState } from "react";

function getDday(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
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
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} />{isCompleted ? "연재 상태" : "다음 마감"}</p>
          {!isCompleted && <p className="text-xs text-muted-foreground mt-1">
            {new Date(project.nextDeadline).toLocaleDateString("ko-KR")}
          </p>}
        </Card>

        {/* Success rate */}
        <Card className="flex flex-col items-center justify-center py-4">
          {isCompleted ? <><p className="font-mono text-3xl font-bold text-primary">{project.totalEpisodes}화</p><p className="mt-2 text-xs text-muted-foreground">총 연재 회차</p></> : <><Gauge value={scheduleResult.successRate} size="md" colorize label="마감 가능성 참고값" /><p className="mt-1 text-center text-[11px] text-muted-foreground">현재 입력값을 이용한 수식 기반 추정</p></>}
        </Card>

        {/* Progress */}
        <Card className="flex flex-col justify-center gap-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">연재 진행</div>
          <ProgressBar value={project.currentEpisode} total={project.totalEpisodes} label="회차" />
          <div className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{project.totalEpisodes - project.currentEpisode}</span>화 남음
          </div>
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

      {/* Project info */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div><CardTitle>프로젝트 정보</CardTitle>{isCompleted && <p className="mt-1 text-[11px] text-muted-foreground">작업량 관련 값은 화면 시연을 위한 가정값입니다.</p>}</div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {[
              ["장르", project.genre],
              ["연재 주기", project.cadence],
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
      </div>
    </div>
  );
}
