import { useState } from "react";
import { useOutletContext } from "react-router";
import { Info } from "lucide-react";
import { clsx } from "clsx";
import { scheduleApi } from "../../api/schedule";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { NumberInput } from "../../components/ui/NumberInput";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { Gauge } from "../../components/ui/Gauge";
import { Badge } from "../../components/ui/Badge";
import type { Project, ScheduleResult, BgComplexity, ColorMode } from "../../types";

const severityBadge: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const severityLabel: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

/**
 * 화면 안에서 반복해서 쓰는 안내 박스입니다.
 * 피드백에서 "마감 성공 확률이 무엇인지", "What-if와 계산 버튼의 차이가 무엇인지"가 불분명하다고 했기 때문에
 * 사용자가 결과를 해석할 수 있도록 짧은 설명을 제공합니다.
 */
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800">
      <Info size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function BgComplexityGuide() {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground mb-1">배경 복잡도 기준</p>
      <p>단순: 단색 배경, 간단한 실내, 소품이 거의 없는 컷</p>
      <p>보통: 일반 실내/거리, 기본 소품이 있는 컷</p>
      <p>복잡: 도시, 자연, 군중, 액션 배경처럼 디테일이 많은 컷</p>
    </div>
  );
}

function WhatIfSection({
  cuts,
  setCuts,
  weeklyHours,
  setWeeklyHours,
  liveResult,
}: {
  cuts: number;
  setCuts: (v: number) => void;
  weeklyHours: number;
  setWeeklyHours: (v: number) => void;
  liveResult: ScheduleResult;
}) {
  const liveRate = liveResult.successRate;

  return (
    <Card className="border-secondary/60 bg-secondary/10">
      <CardHeader>
        <CardTitle>계획 조정 미리보기</CardTitle>
        <span className="text-xs text-muted-foreground">저장 없이 즉시 반영</span>
      </CardHeader>

      <div className="space-y-5">
        <InfoBox>
          What-if 미리보기는 실제 프로젝트 값을 저장하지 않고, 컷 수와 작업 시간을 임시로 바꿨을 때
          마감 성공 확률이 어떻게 달라지는지 확인하는 기능입니다.
        </InfoBox>

        <NumberInput
          label="컷 수 조정"
          value={cuts}
          onChange={setCuts}
          min={10}
          max={150}
          step={5}
          unit="컷"
        />
        <NumberInput
          label="주당 작업 시간 조정"
          value={weeklyHours}
          onChange={setWeeklyHours}
          min={5}
          max={80}
          step={5}
          unit="시간"
        />

        <div className="flex items-center gap-4 pt-1">
          <Gauge value={liveRate} size="sm" colorize showLabel={false} />
          <div>
            <p
              className={clsx(
                "text-sm font-semibold",
                liveRate >= 80 ? "text-emerald-600" : liveRate >= 60 ? "text-amber-600" : "text-red-600"
              )}
            >
              미리보기 성공률 {liveRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              필요 {liveResult.requiredHours}시간 / 가능 {liveResult.availableHours}시간
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ScheduleTab() {
  const { project } = useOutletContext<{ project: Project }>();

  // 사용자가 입력하는 일정 계산 기준값입니다.
  const [cuts, setCuts] = useState(project.avgCuts);
  const [weeklyHours, setWeeklyHours] = useState(project.weeklyHours);
  const [colorMode, setColorMode] = useState<ColorMode>(project.colorMode);
  const [bgComplexity, setBgComplexity] = useState<BgComplexity>(project.bgComplexity);
  const [hasAssistant, setHasAssistant] = useState(project.hasAssistant);
  const [deadlineDays, setDeadlineDays] = useState(7);

  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);

  const input = { cuts, weeklyHours, colorMode, bgComplexity, hasAssistant, deadlineDays };

  // What-if 미리보기는 버튼을 누르지 않아도 현재 입력값으로 즉시 계산합니다.
  const liveResult = scheduleApi.calculateSync(input);

  const calculate = async () => {
    setLoading(true);
    try {
      // 현재 입력값을 기준으로 정식 계산 결과를 만들고 결과 패널에 표시합니다.
      const res = await scheduleApi.calculate(input);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
      <div className="space-y-4">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>일정 입력</CardTitle>
          </CardHeader>

          <div className="space-y-6">
            <InfoBox>
              마감 성공 확률은 컷 수, 채색 방식, 배경 복잡도, 어시스턴트 유무, 주당 작업 시간,
              마감까지 남은 일수를 기준으로 <b>예상 작업 시간</b>과 <b>확보 가능한 작업 시간</b>을 비교해 계산합니다.
            </InfoBox>

            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="컷 수"
                value={cuts}
                onChange={setCuts}
                min={10}
                max={150}
                step={5}
                unit="컷"
              />
              <NumberInput
                label="주당 작업 시간"
                value={weeklyHours}
                onChange={setWeeklyHours}
                min={5}
                max={80}
                step={5}
                unit="시간"
              />
            </div>

            <NumberInput
              label="마감까지 남은 일수"
              value={deadlineDays}
              onChange={setDeadlineDays}
              min={1}
              max={60}
              step={1}
              unit="일"
            />

            <RadioGroup<ColorMode>
              label="채색 방식"
              value={colorMode}
              onChange={setColorMode}
              options={[
                { value: "흑백", label: "흑백", description: "선화와 명암 중심" },
                { value: "한정컬러", label: "한정 컬러", description: "일부 컷/효과만 컬러" },
                { value: "컬러", label: "풀 컬러", description: "전체 컷 채색" },
              ]}
              layout="row"
            />

            <RadioGroup<BgComplexity>
              label="배경 복잡도"
              value={bgComplexity}
              onChange={setBgComplexity}
              options={[
                { value: "단순", label: "단순", description: "단색·간단한 실내" },
                { value: "보통", label: "보통", description: "일반 실내·거리" },
                { value: "복잡", label: "복잡", description: "도시·자연·군중" },
              ]}
              layout="row"
            />
            <BgComplexityGuide />

            <div className="p-3.5 rounded-md border border-border bg-input-background">
              <ToggleSwitch
                label="어시스턴트 유무"
                description="어시스턴트가 있으면 작가가 직접 감당해야 하는 작업량이 줄어드는 것으로 계산합니다."
                checked={hasAssistant}
                onChange={setHasAssistant}
              />
            </div>

            <Button className="w-full" loading={loading} onClick={calculate}>
              현재 계획으로 계산하기
            </Button>
          </div>
        </Card>

        <WhatIfSection
          cuts={cuts}
          setCuts={setCuts}
          weeklyHours={weeklyHours}
          setWeeklyHours={setWeeklyHours}
          liveResult={liveResult}
        />
      </div>

      <div className="space-y-4">
        {!result ? (
          <Card className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Gauge value={0} size="sm" showLabel={false} colorize={false} />
            </div>
            <p className="text-sm text-muted-foreground">
              입력값을 설정한 후<br />현재 계획으로 계산하기 버튼을 눌러주세요.
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>마감 성공 확률</CardTitle>
              </CardHeader>

              <div className="flex flex-col items-center py-5 gap-4">
                <Gauge value={result.successRate} size="lg" colorize label="성공 확률" />

                <div className="w-full grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">예상 필요</p>
                    <p className="font-mono font-bold text-sm">{result.requiredHours}시간</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">확보 가능</p>
                    <p className="font-mono font-bold text-sm">{result.availableHours}시간</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">차이</p>
                    <p className={clsx("font-mono font-bold text-sm", result.hourGap >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {result.hourGap >= 0 ? "+" : ""}{result.hourGap}시간
                    </p>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  현재 작업 속도 기준 예상 소요 기간은 약 <b>{result.estimatedDays}일</b>입니다.
                </p>

                <div
                  className={clsx(
                    "w-full px-4 py-3 rounded-lg text-sm text-center font-medium",
                    result.successRate >= 80
                      ? "bg-emerald-50 text-emerald-700"
                      : result.successRate >= 60
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {result.recommendation}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>위험 요인 TOP {result.riskFactors.length}</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {result.riskFactors.map((rf, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{rf.label}</span>
                        <Badge variant={severityBadge[rf.severity]}>
                          {severityLabel[rf.severity]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rf.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
