import { useOutletContext, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, AlertTriangle, CheckSquare, Square, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { todosApi } from "../../api/todos";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* D-day */}
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className={`text-3xl font-bold font-mono mb-1 ${dday <= 2 ? "text-red-500" : dday <= 5 ? "text-amber-500" : "text-emerald-500"}`}>
            {dday <= 0 ? "마감 초과" : `D-${dday}`}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} />다음 마감</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(project.nextDeadline).toLocaleDateString("ko-KR")}
          </p>
        </Card>

        {/* Success rate */}
        <Card className="flex flex-col items-center justify-center py-4">
          <Gauge value={project.successRate} size="md" colorize label="마감 성공 확률" />
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
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">위험 요약</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">미회수 복선</span>
              <Badge variant="warning">미확인</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">설정 충돌 경고</span>
              <Badge variant="danger">2건</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Project info */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 정보</CardTitle>
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
