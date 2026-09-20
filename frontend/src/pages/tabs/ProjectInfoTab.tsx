import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { FilePenLine, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { projectsApi } from "../../api/projects";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/FormField";
import { TagInput } from "../../components/ui/TagInput";
import { toLocalDateValue } from "../../components/ui/MiniCalendar";
import type { Genre, Project, ProjectStatus } from "../../types";
import { optimizeCoverImage } from "../../utils/image";

const GENRE_OPTIONS: Genre[] = ["판타지", "로맨스", "액션", "스릴러", "일상", "SF", "공포", "스포츠", "기타"];
type PlatformChoice = "" | "네이버웹툰" | "카카오페이지" | "기타";
const PLATFORM_OPTIONS: Exclude<PlatformChoice, "">[] = ["네이버웹툰", "카카오페이지", "기타"];
const STANDARD_PLATFORMS: PlatformChoice[] = ["네이버웹툰", "카카오페이지"];
type StatusChoice = Exclude<ProjectStatus, "기획중">;
const STATUS_OPTIONS: StatusChoice[] = ["연재중", "휴재중", "완결", "기타"];

interface ProjectInfoForm {
  title: string;
  coverImageUrl: string;
  platformChoice: PlatformChoice;
  customPlatform: string;
  tags: string[];
  genre: Genre;
  customGenre: string;
  logline: string;
  status: StatusChoice;
  customStatus: string;
  completionDate: string;
}

function toForm(project: Project): ProjectInfoForm {
  const savedPlatform = project.platform?.trim() ?? "";
  const isStandardPlatform = STANDARD_PLATFORMS.includes(savedPlatform as PlatformChoice);
  const savedStatus = project.status ?? "연재중";
  const isStandardStatus = STATUS_OPTIONS.includes(savedStatus as StatusChoice) && savedStatus !== "기타";
  return {
    title: project.title,
    coverImageUrl: project.coverImageUrl ?? "",
    platformChoice: savedPlatform ? (isStandardPlatform ? savedPlatform as PlatformChoice : "기타") : "",
    customPlatform: savedPlatform && !isStandardPlatform ? savedPlatform : "",
    tags: project.tags ?? [],
    genre: project.genre,
    customGenre: project.customGenre ?? "",
    logline: project.logline,
    status: isStandardStatus ? savedStatus as StatusChoice : savedStatus === "기타" ? "기타" : "기타",
    customStatus: savedStatus === "기타" ? project.customStatus ?? "" : isStandardStatus ? "" : savedStatus,
    completionDate: project.completionDate ? toLocalDateValue(project.completionDate) : "",
  };
}

export function ProjectInfoTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProjectInfoForm>(() => toForm(project));
  const set = (data: Partial<ProjectInfoForm>) => setForm((current) => ({ ...current, ...data }));

  useEffect(() => setForm(toForm(project)), [project]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const { platformChoice, customPlatform, ...projectData } = form;
      return projectsApi.update(project.id, {
        ...projectData,
        title: form.title.trim(),
        platform: platformChoice === "기타" ? customPlatform.trim() : platformChoice,
        customGenre: form.genre === "기타" ? form.customGenre.trim() : "",
        logline: form.logline.trim(),
        status: form.status,
        customStatus: form.status === "기타" ? form.customStatus.trim() : "",
        completionDate: form.completionDate ? new Date(`${form.completionDate}T23:59:59`).toISOString() : undefined,
      });
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(["project", project.id], updatedProject);
      queryClient.setQueryData<Project[]>(["projects"], (projects) => projects?.map((item) => item.id === updatedProject.id ? updatedProject : item));
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("작품 정보가 저장되었습니다.");
    },
    onError: () => toast.error("작품 정보를 저장하지 못했습니다."),
  });

  const handleCoverChange = async (file?: File) => {
    if (!file) return;
    try {
      set({ coverImageUrl: await optimizeCoverImage(file) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "표지를 불러오지 못했습니다.");
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <Card className="bg-secondary/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><FilePenLine size={19} /></div>
          <div><h2 className="text-sm font-semibold">작품 정보 수정</h2><p className="mt-1 text-xs text-muted-foreground">목록 카드와 프로젝트에 표시되는 기본 정보를 관리합니다.</p></div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid gap-7 md:grid-cols-[180px_1fr]">
          <section>
            <p className="mb-2 text-sm font-medium text-foreground">작품 표지</p>
            <div className="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-input-background">
              {form.coverImageUrl ? <img src={form.coverImageUrl} alt={`${form.title || "작품"} 표지 미리보기`} className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><ImagePlus size={26} /><span className="text-xs">등록된 표지가 없습니다</span></div>}
            </div>
            <div className="mt-3 grid gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ImagePlus size={14} />{form.coverImageUrl ? "표지 변경" : "표지 등록"}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleCoverChange(event.target.files?.[0])} />
              </label>
              {form.coverImageUrl && <Button type="button" size="sm" variant="ghost" onClick={() => set({ coverImageUrl: "" })}><Trash2 size={14} />표지 삭제</Button>}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">JPG, PNG 등 10MB 이하<br />세로형 이미지를 권장합니다.</p>
          </section>

          <section className="space-y-5">
            <Input label="작품 제목" required value={form.title} onChange={(event) => set({ title: event.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="장르" value={form.genre} onChange={(event) => set({ genre: event.target.value as Genre })}>{GENRE_OPTIONS.map((genre) => <option key={genre} value={genre}>{genre}</option>)}</Select>
              <Select label="연재 플랫폼" value={form.platformChoice} onChange={(event) => set({ platformChoice: event.target.value as PlatformChoice })} hint="미정이면 선택하지 않아도 됩니다.">
                <option value="">미정</option>
                {PLATFORM_OPTIONS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
              </Select>
            </div>
            {(form.genre === "기타" || form.platformChoice === "기타") && (
              <div className="grid gap-4 sm:grid-cols-2">
                {form.genre === "기타" && <Input label="기타 장르" required value={form.customGenre} onChange={(event) => set({ customGenre: event.target.value })} placeholder="장르를 직접 입력하세요" />}
                {form.platformChoice === "기타" && <Input label="기타 연재 플랫폼" required value={form.customPlatform} onChange={(event) => set({ customPlatform: event.target.value })} placeholder="연재 플랫폼을 직접 입력하세요" />}
              </div>
            )}
            <TagInput value={form.tags} onChange={(tags) => set({ tags })} />
            <Textarea label="스토리 요약" value={form.logline} onChange={(event) => set({ logline: event.target.value })} rows={3} maxLength={180} placeholder="작품의 핵심 이야기와 주인공을 1~2줄로 정리하세요." hint={`${form.logline.length}/180자 · 프로젝트 목록에도 표시됩니다.`} />
            <div className="border-t border-border pt-5">
              <h3 className="mb-4 text-sm font-bold text-text">연재 정보</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="연재 진행상황" value={form.status} onChange={(event) => set({ status: event.target.value as StatusChoice })} hint="프로젝트 목록과 오늘의 작업에 표시됩니다.">
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </Select>
                <Input label="최종 완결 예정일" type="date" value={form.completionDate} onChange={(event) => set({ completionDate: event.target.value })} hint="미정이면 비워둘 수 있습니다." />
              </div>
              {form.status === "기타" && <div className="mt-4"><Input label="기타 진행상황" required value={form.customStatus} onChange={(event) => set({ customStatus: event.target.value })} placeholder="예: 시즌 준비중" /></div>}
            </div>
          </section>
        </div>

        <div className="mt-7 flex justify-end gap-2 border-t border-border pt-5">
          <Button type="button" variant="outline" onClick={() => setForm(toForm(project))}><RotateCcw size={14} />변경 취소</Button>
          <Button type="button" loading={updateMutation.isPending} disabled={!form.title.trim() || (form.genre === "기타" && !form.customGenre.trim()) || (form.platformChoice === "기타" && !form.customPlatform.trim()) || (form.status === "기타" && !form.customStatus.trim())} onClick={() => updateMutation.mutate()}><Save size={14} />변경사항 저장</Button>
        </div>
      </Card>
    </div>
  );
}
