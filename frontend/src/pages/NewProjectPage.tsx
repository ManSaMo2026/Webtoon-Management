import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BookOpen, CalendarClock, ImagePlus, Info, SlidersHorizontal, Trash2 } from "lucide-react";
import { projectsApi } from "../api/projects";
import { MainLayout } from "../components/layout/MainLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/FormField";
import { NumberInput } from "../components/ui/NumberInput";
import { RadioGroup } from "../components/ui/RadioGroup";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";
import type { Genre, Cadence, ColorMode, BgComplexity } from "../types";
import { optimizeCoverImage } from "../utils/image";

interface FormData {
  title: string;
  coverImageUrl: string;
  genre: Genre;
  totalEpisodes: number;
  cadence: Cadence;
  weeklyHours: number;
  avgCuts: number;
  colorMode: ColorMode;
  bgComplexity: BgComplexity;
  hasAssistant: boolean;
  logline: string;
  conflict: string;
  nextDeadline: string;
}

const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const INITIAL: FormData = {
  title: "",
  coverImageUrl: "",
  genre: "판타지",
  totalEpisodes: 60,
  cadence: "주 1회",
  weeklyHours: 30,
  avgCuts: 45,
  colorMode: "컬러",
  bgComplexity: "보통",
  hasAssistant: false,
  logline: "",
  conflict: "",
  nextDeadline: nextWeek,
};

const GENRE_OPTIONS: Genre[] = ["판타지", "로맨스", "액션", "스릴러", "일상", "SF", "공포", "스포츠", "기타"];
const CADENCE_OPTIONS: Cadence[] = ["주 1회", "주 2회", "격주", "월 1회"];

function StepHeader({ step }: { step: 1 | 2 }) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className={step === 1 ? "text-primary" : "text-text-muted"}>1. 작품 정보</span>
        <span className={step === 2 ? "text-primary" : "text-text-muted"}>2. 작업 계획</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full bg-primary transition-all ${step === 1 ? "w-1/2" : "w-full"}`} />
      </div>
    </div>
  );
}

export function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const set = (data: Partial<FormData>) => setForm((previous) => ({ ...previous, ...data }));

  const handleCoverChange = async (file?: File) => {
    if (!file) return;
    try {
      set({ coverImageUrl: await optimizeCoverImage(file) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "표지를 등록하지 못했습니다.");
    }
  };

  const mutation = useMutation({
    mutationFn: () => projectsApi.create({
      ...form,
      nextDeadline: new Date(`${form.nextDeadline}T23:59:59`).toISOString(),
    }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("프로젝트가 준비되었습니다. 첫 작업을 시작해보세요.");
      navigate(`/projects/${project.id}/dashboard`);
    },
    onError: () => toast.error("프로젝트를 만들지 못했습니다. 잠시 후 다시 시도해주세요."),
  });

  return (
    <MainLayout pageTitle="새 프로젝트">
      <div className="mx-auto max-w-2xl space-y-5">
        <button onClick={() => navigate("/projects")} className="-mt-1 flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text">
          <ArrowLeft size={14} />프로젝트 목록으로
        </button>

        <div>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-text">새 작품을 시작해볼까요?</h2>
          <p className="mt-2 text-sm leading-6 text-text-body">처음에는 꼭 필요한 정보만 입력합니다. 나머지는 프로젝트 안에서 언제든 바꿀 수 있어요.</p>
        </div>

        <StepHeader step={step} />

        {step === 1 ? (
          <Card padding="lg">
            <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><BookOpen size={19} /></span>
              <div><h3 className="text-base font-bold">어떤 작품인가요?</h3><p className="mt-1 text-sm text-text-muted">제목만 입력해도 다음 단계로 갈 수 있습니다.</p></div>
            </div>

            <div className="space-y-5">
              <Input label="작품 제목" required value={form.title} onChange={(event) => set({ title: event.target.value })} placeholder="예: 검은 태양의 후계자" autoFocus />
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">작품 표지 <span className="font-normal text-muted-foreground">선택</span></p>
                <div className="flex items-center gap-4 rounded-lg border border-border bg-input-background p-3.5">
                  <div className="flex aspect-[3/4] w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10">
                    {form.coverImageUrl ? <img src={form.coverImageUrl} alt="선택한 작품 표지 미리보기" className="h-full w-full object-cover" /> : <ImagePlus size={22} className="text-primary/60" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text">목록에서 작품을 쉽게 구분할 수 있어요</p>
                    <p className="mt-1 text-xs leading-5 text-text-muted">JPG, PNG 등 10MB 이하 · 세로형 이미지를 권장합니다.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:text-primary">
                        <ImagePlus size={14} />{form.coverImageUrl ? "표지 변경" : "표지 선택"}
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleCoverChange(event.target.files?.[0])} />
                      </label>
                      {form.coverImageUrl && <button type="button" onClick={() => set({ coverImageUrl: "" })} className="inline-flex items-center gap-1.5 px-2 text-xs text-text-muted hover:text-destructive"><Trash2 size={13} />삭제</button>}
                    </div>
                  </div>
                </div>
              </div>
              <Select label="장르" value={form.genre} onChange={(event) => set({ genre: event.target.value as Genre })} hint="추천이나 분류에 활용됩니다.">
                {GENRE_OPTIONS.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </Select>
              <Textarea label="작품 한 줄 소개" value={form.logline} onChange={(event) => set({ logline: event.target.value })} placeholder="선택 사항입니다. 작품의 주인공과 핵심 사건을 한 문장으로 적어보세요." rows={3} hint="비워두고 나중에 스토리 메뉴에서 작성해도 됩니다." />
            </div>

            <div className="mt-7 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!form.title.trim()}>다음: 작업 계획 입력<ArrowRight size={15} /></Button>
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <div className="mb-5 flex items-start gap-3 border-b border-border pb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><CalendarClock size={19} /></span>
              <div><h3 className="text-base font-bold">현실적인 작업 계획을 알려주세요</h3><p className="mt-1 text-sm text-text-muted">입력한 값으로 마감에 필요한 시간과 부족한 시간을 계산합니다.</p></div>
            </div>

            <div className="mb-6 flex gap-2 rounded-lg border border-primary/15 bg-accent/50 px-3.5 py-3 text-sm leading-6 text-secondary-foreground">
              <Info size={16} className="mt-1 shrink-0" />정답을 고르는 단계가 아닙니다. 현재 예상값을 입력하고 실제 작업 기록에 맞춰 조정하세요.
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="연재 주기" value={form.cadence} onChange={(event) => set({ cadence: event.target.value as Cadence })} hint="마감 간격을 계산하는 기준입니다.">
                  {CADENCE_OPTIONS.map((cadence) => <option key={cadence} value={cadence}>{cadence}</option>)}
                </Select>
                <Input label="다음 마감일" type="date" required value={form.nextDeadline} onChange={(event) => set({ nextDeadline: event.target.value })} hint="첫 일정 진단에 사용됩니다." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput label="일주일에 작업 가능한 시간" value={form.weeklyHours} onChange={(value) => set({ weeklyHours: value })} min={1} max={100} step={5} unit="시간" hint="학교·직장 시간을 제외한 현실적인 시간을 입력하세요." />
                <NumberInput label="한 회차의 예상 컷 수" value={form.avgCuts} onChange={(value) => set({ avgCuts: value })} min={10} max={200} step={5} unit="컷" hint="아직 모르면 기본값 45컷을 사용해도 됩니다." />
              </div>

              <NumberInput label="완결 목표" value={form.totalEpisodes} onChange={(value) => set({ totalEpisodes: value })} min={1} max={500} step={10} unit="화" hint="전체 연재 진행률을 보여주는 데 사용됩니다." />

              <details className="rounded-lg border border-border bg-input-background">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-text"><SlidersHorizontal size={16} className="text-primary" />세부 작업 방식 <span className="ml-1 font-normal text-text-muted">선택</span></summary>
                <div className="space-y-6 border-t border-border p-4">
                  <RadioGroup<ColorMode> label="채색 방식" value={form.colorMode} onChange={(value) => set({ colorMode: value })} options={[{ value: "흑백", label: "흑백" }, { value: "한정컬러", label: "한정 컬러" }, { value: "컬러", label: "풀 컬러" }]} layout="row" />
                  <RadioGroup<BgComplexity> label="평균 배경 복잡도" value={form.bgComplexity} onChange={(value) => set({ bgComplexity: value })} options={[{ value: "단순", label: "단순" }, { value: "보통", label: "보통" }, { value: "복잡", label: "복잡" }]} layout="row" />
                  <div className="rounded-md border border-border bg-white p-3.5"><ToggleSwitch label="함께 작업하는 어시스턴트가 있나요?" description="보조 인력이 있으면 예상 작업량을 낮춰 계산합니다." checked={form.hasAssistant} onChange={(value) => set({ hasAssistant: value })} /></div>
                </div>
              </details>
            </div>

            <div className="mt-7 flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>이전</Button>
              <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!form.nextDeadline}>프로젝트 만들기</Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
