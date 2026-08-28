import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { projectsApi } from "../api/projects";
import { MainLayout } from "../components/layout/MainLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/FormField";
import { NumberInput } from "../components/ui/NumberInput";
import { RadioGroup } from "../components/ui/RadioGroup";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";
import type { Genre, Cadence, ColorMode, BgComplexity } from "../types";

interface FormData {
  title: string;
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
}

const INITIAL: FormData = {
  title: "",
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
};

const GENRE_OPTIONS: Genre[] = ["판타지", "로맨스", "액션", "스릴러", "일상", "SF", "공포", "스포츠", "기타"];
const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: "주 1회", label: "주 1회" },
  { value: "주 2회", label: "주 2회" },
  { value: "격주", label: "격주" },
  { value: "월 1회", label: "월 1회" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">
      {children}
    </h3>
  );
}

export function NewProjectPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(INITIAL);
  const set = (d: Partial<FormData>) => setForm((p) => ({ ...p, ...d }));

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        ...form,
        nextDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("프로젝트가 생성되었습니다!");
      navigate(`/projects/${project.id}/dashboard`);
    },
    onError: () => toast.error("생성 중 오류가 발생했습니다."),
  });

  const canSubmit = form.title.trim().length > 0 && form.logline.trim().length > 0;

  return (
    <MainLayout pageTitle="새 프로젝트">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-1"
        >
          <ArrowLeft size={14} />프로젝트 목록으로
        </button>

        {/* 서비스 저장 방식 안내: 피드백에서 온라인/로컬 서비스 방향이 모호하다는 의견이 있어 화면에 명확히 표시합니다. */}
        <Card className="border-blue-100 bg-blue-50">
          <p className="text-xs leading-relaxed text-blue-800">
            WebtoonFlow AI는 웹 기반 온라인 서비스를 전제로 설계합니다. 최종 버전에서는 프로젝트, 캐릭터,
            스토리, 일정 데이터를 서비스 DB에 저장하고, 현재 프론트 시제품에서는 백엔드 연결 전까지 mock/localStorage로 동작합니다.
          </p>
        </Card>

        {/* ─── 기본 정보 ─── */}
        <Card padding="lg">
          <SectionTitle>기본 정보</SectionTitle>
          <div className="space-y-4">
            <Input
              label="작품 제목"
              required
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="예: 검은 태양의 후계자"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="장르"
                value={form.genre}
                onChange={(e) => set({ genre: e.target.value as Genre })}
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
              <Select
                label="연재 주기"
                value={form.cadence}
                onChange={(e) => set({ cadence: e.target.value as Cadence })}
              >
                {CADENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <NumberInput
              label="목표 회차 수"
              value={form.totalEpisodes}
              onChange={(v) => set({ totalEpisodes: v })}
              min={1}
              max={500}
              step={10}
              unit="화"
              hint="완결 목표 회차를 입력하세요."
            />
          </div>
        </Card>

        {/* ─── 작업 환경 ─── */}
        <Card padding="lg">
          <SectionTitle>작업 환경</SectionTitle>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="주당 가능 시간"
                value={form.weeklyHours}
                onChange={(v) => set({ weeklyHours: v })}
                min={1}
                max={100}
                step={5}
                unit="시간"
              />
              <NumberInput
                label="1화 평균 컷 수"
                value={form.avgCuts}
                onChange={(v) => set({ avgCuts: v })}
                min={10}
                max={200}
                step={5}
                unit="컷"
              />
            </div>

            <RadioGroup<ColorMode>
              label="채색 방식"
              value={form.colorMode}
              onChange={(v) => set({ colorMode: v })}
              options={[
                { value: "흑백", label: "흑백" },
                { value: "한정컬러", label: "한정 컬러" },
                { value: "컬러", label: "풀 컬러" },
              ]}
              layout="row"
            />

            <RadioGroup<BgComplexity>
              label="배경 복잡도"
              value={form.bgComplexity}
              onChange={(v) => set({ bgComplexity: v })}
              options={[
                { value: "단순", label: "단순", description: "단색·간단한 실내" },
                { value: "보통", label: "보통", description: "일반 실내·거리" },
                { value: "복잡", label: "복잡", description: "도시·자연·군중" },
              ]}
              layout="row"
            />

            <div className="p-3.5 rounded-md border border-border bg-input-background">
              <ToggleSwitch
                label="어시스턴트 유무"
                description="작업을 도와주는 어시스턴트가 있으면 일정 계산에 반영됩니다."
                checked={form.hasAssistant}
                onChange={(v) => set({ hasAssistant: v })}
              />
            </div>
          </div>
        </Card>

        {/* ─── 스토리 개요 ─── */}
        <Card padding="lg">
          <SectionTitle>스토리 개요</SectionTitle>
          <div className="space-y-4">
            <Textarea
              label="로그라인"
              required
              value={form.logline}
              onChange={(e) => set({ logline: e.target.value })}
              placeholder="한두 문장으로 작품의 핵심 설정과 주인공을 소개하세요."
              rows={3}
            />
            <Textarea
              label="핵심 갈등"
              value={form.conflict}
              onChange={(e) => set({ conflict: e.target.value })}
              placeholder="주인공이 직면하는 가장 큰 갈등 또는 장애물은 무엇인가요?"
              rows={3}
            />
          </div>
        </Card>

        {/* ─── 액션 ─── */}
        <div className="flex justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!canSubmit}
          >
            프로젝트 생성
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
