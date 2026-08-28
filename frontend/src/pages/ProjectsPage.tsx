import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { PlusCircle, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { projectsApi } from "../api/projects";
import { MainLayout } from "../components/layout/MainLayout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/Gauge";
import { SkeletonList, ErrorState, EmptyState } from "../components/ui/Skeleton";
import { ConfirmModal } from "../components/ui/Modal";
import type { Project, RiskLevel } from "../types";
import { useState } from "react";

function getDday(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return diff;
}

function riskBadge(risk: RiskLevel) {
  const map: Record<RiskLevel, "success" | "warning" | "danger" | "neutral"> = {
    낮음: "success", 보통: "warning", 높음: "danger", 위험: "danger",
  };
  return <Badge variant={map[risk]}>{risk}</Badge>;
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const dday = getDday(project.nextDeadline);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}/dashboard`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground truncate">{project.title}</h2>
            <Badge variant="info">{project.genre}</Badge>
            {riskBadge(project.riskLevel)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.logline}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          className="ml-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 text-xs p-1"
        >
          삭제
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <ProgressBar
          value={project.currentEpisode}
          total={project.totalEpisodes}
          label="연재 진행률"
        />
        <ProgressBar
          value={project.successRate}
          total={100}
          label="마감 성공 확률"
          colorize
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{project.currentEpisode}</span>/{project.totalEpisodes}화
          </span>
          <span className="text-muted-foreground">{project.cadence}</span>
        </div>
        <div className={`flex items-center gap-1 font-semibold font-mono ${dday <= 2 ? "text-red-600" : dday <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
          {dday <= 0 ? (
            <><AlertTriangle size={12} />마감 초과</>
          ) : (
            <><Clock size={12} />D-{dday}</>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("프로젝트가 삭제되었습니다.");
      setDeleteId(null);
    },
    onError: () => toast.error("삭제 중 오류가 발생했습니다."),
  });

  return (
    <MainLayout
      pageTitle="프로젝트 목록"
      actions={
        <Button size="sm" onClick={() => navigate("/projects/new")}>
          <PlusCircle size={14} />새 프로젝트
        </Button>
      }
    >
      {isLoading && <SkeletonList count={4} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && (
        <>
          {projects && projects.length === 0 ? (
            <EmptyState
              title="아직 프로젝트가 없습니다"
              description="첫 번째 웹툰 프로젝트를 시작해보세요"
              action={
                <Button size="sm" onClick={() => navigate("/projects/new")}>
                  <PlusCircle size={14} />새 프로젝트 만들기
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects?.map((p) => (
                <ProjectCard key={p.id} project={p} onDelete={setDeleteId} />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="프로젝트 삭제"
        message="이 프로젝트와 관련된 모든 데이터가 삭제됩니다. 계속하시겠습니까?"
        confirmLabel="삭제"
        loading={deleteMutation.isPending}
      />
    </MainLayout>
  );
}
