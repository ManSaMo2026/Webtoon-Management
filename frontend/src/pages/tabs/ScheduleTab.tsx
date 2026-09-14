import { useState } from "react";
import { useOutletContext } from "react-router";
import { Calculator, ChevronDown, Info, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { scheduleApi } from "../../api/schedule";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { NumberInput } from "../../components/ui/NumberInput";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { Gauge } from "../../components/ui/Gauge";
import { Badge } from "../../components/ui/Badge";
import type { Project, BgComplexity, ColorMode } from "../../types";

const severityBadge: Record<string, "success" | "warning" | "danger"> = { low: "success", medium: "warning", high: "danger" };
const severityLabel: Record<string, string> = { low: "낮음", medium: "보통", high: "높음" };

export function ScheduleTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const initialDeadlineDays = Math.max(1, Math.ceil((new Date(project.nextDeadline).getTime() - Date.now()) / 86400000));
  const [cuts, setCuts] = useState(project.avgCuts);
  const [weeklyHours, setWeeklyHours] = useState(project.weeklyHours);
  const [deadlineDays, setDeadlineDays] = useState(initialDeadlineDays);
  const [colorMode, setColorMode] = useState<ColorMode>(project.colorMode);
  const [bgComplexity, setBgComplexity] = useState<BgComplexity>(project.bgComplexity);
  const [hasAssistant, setHasAssistant] = useState(project.hasAssistant);

  const result = scheduleApi.calculateSync({ cuts, weeklyHours, colorMode, bgComplexity, hasAssistant, deadlineDays });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-text">마감 계획 진단</h2>
          <Badge variant="neutral">수식 기반 베타</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-body">현재 계획으로 작업 시간이 충분한지 확인하는 참고 도구입니다. 값을 바꾸면 결과가 바로 갱신됩니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator size={16} className="text-primary" />계획에 꼭 필요한 정보</CardTitle>
          </CardHeader>

          <div className="mb-6 flex gap-2 rounded-lg border border-primary/15 bg-accent/40 px-3.5 py-3 text-sm leading-6 text-secondary-foreground">
            <Info size={16} className="mt-1 shrink-0" />정확한 정답이 없어도 괜찮습니다. 예상값으로 시작한 뒤 실제 작업 기록에 맞춰 조정하세요.
          </div>

          <div className="space-y-6">
            <NumberInput label="이번 회차 예상 컷 수" value={cuts} onChange={setCuts} min={10} max={150} step={5} unit="컷" hint="아직 모르면 일반적인 기본값 45컷으로 시작하세요." />
            <NumberInput label="일주일에 작업 가능한 시간" value={weeklyHours} onChange={setWeeklyHours} min={5} max={100} step={5} unit="시간" hint="학교, 직장과 휴식 시간을 제외한 현실적인 시간을 입력하세요." />
            <NumberInput label="마감까지 남은 기간" value={deadlineDays} onChange={setDeadlineDays} min={1} max={60} step={1} unit="일" hint="오늘부터 최종 마감일까지 남은 날짜입니다." />

            <details className="group rounded-lg border border-border bg-input-background">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-text">
                작업 방식 세부 설정 <ChevronDown size={16} className="text-text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-6 border-t border-border p-4">
                <RadioGroup<ColorMode> label="채색 방식" value={colorMode} onChange={setColorMode} options={[{ value: "흑백", label: "흑백", description: "선화·명암 중심" }, { value: "한정컬러", label: "한정 컬러", description: "일부만 채색" }, { value: "컬러", label: "풀 컬러", description: "전체 채색" }]} layout="row" />
                <RadioGroup<BgComplexity> label="평균 배경 복잡도" value={bgComplexity} onChange={setBgComplexity} options={[{ value: "단순", label: "단순", description: "단색·간단한 실내" }, { value: "보통", label: "보통", description: "일반 실내·거리" }, { value: "복잡", label: "복잡", description: "도시·군중·액션" }]} layout="row" />
                <div className="rounded-md border border-border bg-white p-3.5"><ToggleSwitch label="어시스턴트가 있나요?" description="보조 인력이 있으면 직접 작업량이 약 15% 줄어드는 것으로 가정합니다." checked={hasAssistant} onChange={setHasAssistant} /></div>
              </div>
            </details>
          </div>
        </Card>

        <div className="space-y-5">
          <Card padding="lg">
            <CardHeader>
              <CardTitle>현재 계획 진단</CardTitle>
              <span className="flex items-center gap-1 text-xs text-text-muted"><ShieldCheck size={14} />참고용 추정치</span>
            </CardHeader>

            <div className="flex flex-col items-center gap-5 py-3">
              <Gauge value={result.successRate} size="lg" colorize label="마감 가능성 참고값" />
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-text-muted">예상 필요</p><p className="mt-1 font-mono text-base font-bold">{result.requiredHours}시간</p></div>
                <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-text-muted">확보 가능</p><p className="mt-1 font-mono text-base font-bold">{result.availableHours}시간</p></div>
                <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-text-muted">시간 차이</p><p className={clsx("mt-1 font-mono text-base font-bold", result.hourGap >= 0 ? "text-emerald-600" : "text-red-600")}>{result.hourGap >= 0 ? "+" : ""}{result.hourGap}시간</p></div>
              </div>
              <div className={clsx("w-full rounded-lg px-4 py-3 text-center text-sm font-medium", result.successRate >= 80 ? "bg-emerald-50 text-emerald-700" : result.successRate >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{result.recommendation}</div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>왜 이런 결과가 나왔나요?</CardTitle></CardHeader>
            <div className="space-y-3">
              {result.riskFactors.map((factor) => (
                <div key={factor.label} className="rounded-lg border border-border p-3.5">
                  <div className="flex items-center gap-2"><span className="text-sm font-semibold">{factor.label}</span><Badge variant={severityBadge[factor.severity]}>{severityLabel[factor.severity]}</Badge></div>
                  <p className="mt-1.5 text-xs leading-5 text-text-muted">{factor.detail}</p>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-xs leading-5 text-text-muted">
              <summary className="cursor-pointer font-semibold text-text-body">계산 기준과 한계 보기</summary>
              <div className="mt-2 space-y-1.5">
                <p>기본 작업량은 컷당 1.5시간으로 가정하고 채색 방식, 배경 복잡도와 어시스턴트 유무에 따라 보정합니다.</p>
                <p>참고값은 확보 가능 시간 ÷ 예상 필요 시간으로 계산하며 5~100 범위로 표시합니다.</p>
                <p>현재는 수식 기반 베타 모델이므로 개인의 실제 작업 속도, 수정 횟수와 컨디션을 완전히 반영하지 못합니다.</p>
              </div>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
}
