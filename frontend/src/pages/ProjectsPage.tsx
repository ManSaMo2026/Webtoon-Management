import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { PlusCircle, AlertTriangle, Clock, ImagePlus } from "lucide-react";
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
import { optimizeCoverImage } from "../utils/image";
import { getProjectGenreLabel, getProjectStatusLabel } from "../utils/project";
import { MAX_PROJECTS } from "../config/limits";

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

const COVER_STYLES: Record<string, string> = {
  판타지: "from-indigo-950 via-violet-800 to-amber-500",
  로맨스: "from-rose-700 via-pink-500 to-orange-200",
  액션: "from-zinc-950 via-red-800 to-orange-500",
  스릴러: "from-slate-950 via-slate-700 to-emerald-700",
  일상: "from-sky-700 via-cyan-500 to-yellow-200",
  SF: "from-slate-950 via-indigo-800 to-cyan-400",
  공포: "from-neutral-950 via-red-950 to-stone-600",
  스포츠: "from-blue-900 via-blue-600 to-lime-400",
  기타: "from-violet-900 via-indigo-600 to-sky-300",
};

function ProjectCard({ project, number, onDelete, onCoverChange }: { project: Project; number: number; onDelete: (id: string) => void; onCoverChange: (id: string, file?: File) => void }) {
  const navigate = useNavigate();
  const dday = getDday(project.nextDeadline);
  const isCompleted = project.status === "완결" || project.currentEpisode >= project.totalEpisodes;
  const genreLabel = getProjectGenreLabel(project);
  const statusLabel = isCompleted ? "완결" : getProjectStatusLabel(project);
  const statusVariant = statusLabel === "완결" ? "success" : statusLabel === "휴재중" ? "warning" : statusLabel === "연재중" ? "info" : "neutral";

  return (
    <Card padding="none"
      className="group flex min-h-[260px] cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={() => navigate(`/projects/${project.id}/dashboard`)}
    >
      <div className={`relative w-[34%] min-w-[116px] shrink-0 overflow-hidden bg-gradient-to-br ${COVER_STYLES[project.genre]}`}>
        {project.coverImageUrl ? (
          <img src={project.coverImageUrl} alt={`${project.title} 표지`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full flex-col justify-between p-4 text-white">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-white/65">WEBTOON</span>
            <div>
              <p className="line-clamp-3 text-lg font-bold leading-snug drop-shadow-sm">{project.title}</p>
              <p className="mt-2 text-xs text-white/70">{genreLabel}</p>
            </div>
          </div>
        )}
        <label onClick={(event) => event.stopPropagation()} className="absolute inset-x-2 bottom-2 flex cursor-pointer items-center justify-center gap-1 rounded-md bg-black/65 px-2 py-1.5 text-[11px] font-medium text-white opacity-100 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
          <ImagePlus size={12} />{project.coverImageUrl ? "표지 변경" : "표지 등록"}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => onCoverChange(project.id, event.target.files?.[0])} />
        </label>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-xs font-bold text-primary">작품 {String(number).padStart(2, "0")}</p>
            <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-[-0.02em] text-text">{project.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="info">{genreLabel}</Badge>
              <Badge variant="neutral">{project.platform?.trim() || "플랫폼 미정"}</Badge>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {!isCompleted && riskBadge(project.riskLevel)}
            </div>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-text-muted">{project.logline || "한 줄 소개를 작성하면 작품의 방향을 빠르게 확인할 수 있습니다."}</p>
            {project.tags && project.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{project.tags.slice(0, 3).map((tag) => <span key={tag} className="text-xs font-medium text-primary">#{tag}</span>)}{project.tags.length > 3 && <span className="text-xs text-muted-foreground">+{project.tags.length - 3}</span>}</div>}
            {project.completionDate && <p className="mt-2 text-xs font-medium text-text-muted">최종 완결 {new Date(project.completionDate).toLocaleDateString("ko-KR")} 예정</p>}
          </div>
          <button onClick={(event) => { event.stopPropagation(); onDelete(project.id); }} className="shrink-0 rounded px-1.5 py-1 text-xs text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100">삭제</button>
        </div>

        <div className="mb-4 mt-auto space-y-2">
          <ProgressBar value={project.currentEpisode} total={project.totalEpisodes} label="연재 진행률" />
          {!isCompleted && <ProgressBar value={project.successRate} total={100} label="마감 가능성 참고값" colorize />}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground"><span className="font-mono text-base font-extrabold text-foreground">{project.currentEpisode}</span>/{project.totalEpisodes}화</span>
            <span className="font-medium text-muted-foreground">{project.cadence}</span>
          </div>
          <div className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-sm font-extrabold ${isCompleted ? "border-primary/20 bg-primary/10 text-primary" : dday <= 2 ? "border-red-200 bg-red-50 text-red-600" : dday <= 5 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {isCompleted ? <>총 {project.totalEpisodes}화 완결</> : dday <= 0 ? <><AlertTriangle size={15} />마감 초과</> : <><Clock size={15} />D-{dday}</>}
          </div>
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

  const coverMutation = useMutation({
    mutationFn: ({ id, coverImageUrl }: { id: string; coverImageUrl: string }) => projectsApi.update(id, { coverImageUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("작품 표지가 저장되었습니다.");
    },
    onError: () => toast.error("표지를 저장하지 못했습니다."),
  });

  const handleCoverChange = async (id: string, file?: File) => {
    if (!file) return;
    try {
      coverMutation.mutate({ id, coverImageUrl: await optimizeCoverImage(file) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "표지를 등록하지 못했습니다.");
    }
  };

  const orderedProjects = [...(projects ?? [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const projectLimitReached = (projects?.length ?? 0) >= MAX_PROJECTS;
  const createProject = () => {
    if (projectLimitReached) return toast.error(`프로젝트는 최대 ${MAX_PROJECTS}개까지 만들 수 있습니다.`);
    navigate("/projects/new");
  };

  return (
    <MainLayout
      pageTitle="프로젝트 목록"
      actions={
        <Button size="sm" onClick={createProject} disabled={projectLimitReached} title={projectLimitReached ? `최대 ${MAX_PROJECTS}개까지 만들 수 있습니다.` : undefined}>
          <PlusCircle size={14} />새 프로젝트 ({projects?.length ?? 0}/{MAX_PROJECTS})
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
                <Button size="sm" onClick={createProject}>
                  <PlusCircle size={14} />새 프로젝트 만들기
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {orderedProjects.map((p, index) => (
                <ProjectCard key={p.id} project={p} number={index + 1} onDelete={setDeleteId} onCoverChange={handleCoverChange} />
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
