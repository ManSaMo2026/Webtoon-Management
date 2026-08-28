import type { BgComplexity, ColorMode, ScheduleInput, ScheduleResult, RiskFactor } from "../types";

/**
 * 일정 리스크 계산 API(mock)
 *
 * 현재 단계에서는 백엔드가 없기 때문에 프론트에서 수식 기반으로 계산합니다.
 * 이후 FastAPI가 완성되면 이 파일의 calculate 함수만 실제 API 호출로 바꾸면 됩니다.
 *
 * 계산 기준은 캡스톤 기획서의 핵심 기능인
 * "사용자 작업 데이터 기반 마감 성공 확률, 일정 지연 위험도, 주요 위험 요인 분석"에 맞췄습니다.
 */

const BASE_HOURS_PER_CUT = 1.5;

// 채색 방식에 따른 작업 시간 계수입니다.
// 흑백보다 한정 컬러, 풀 컬러가 더 많은 시간이 걸린다고 가정합니다.
const COLOR_FACTOR: Record<ColorMode, number> = {
  흑백: 1.0,
  한정컬러: 1.2,
  컬러: 1.5,
};

// 배경 복잡도에 따른 작업 시간 계수입니다.
// 복잡한 도시, 자연, 군중 배경일수록 컷당 작업 시간이 늘어납니다.
const BG_FACTOR: Record<BgComplexity, number> = {
  단순: 1.0,
  보통: 1.2,
  복잡: 1.4,
};

// 어시스턴트가 있으면 작가가 직접 감당해야 하는 작업량이 줄어든다고 봅니다.
const ASSISTANT_FACTOR = 0.85;

function estimateRequiredHours(input: ScheduleInput): number {
  return (
    input.cuts *
    BASE_HOURS_PER_CUT *
    COLOR_FACTOR[input.colorMode] *
    BG_FACTOR[input.bgComplexity] *
    (input.hasAssistant ? ASSISTANT_FACTOR : 1)
  );
}

function estimateAvailableHours(input: ScheduleInput): number {
  return input.weeklyHours * (input.deadlineDays / 7);
}

function calcResult(input: ScheduleInput): ScheduleResult {
  const requiredHours = estimateRequiredHours(input);
  const availableHours = estimateAvailableHours(input);
  const hourGap = availableHours - requiredHours;

  // 성공 확률 = 사용 가능한 시간 / 예상 작업 시간
  // 화면에서 너무 극단적으로 보이지 않도록 5~100 사이로 제한합니다.
  const successRate = Math.min(
    100,
    Math.max(5, Math.round((availableHours / requiredHours) * 100))
  );

  const riskFactors: RiskFactor[] = [];

  // 위험 요인은 사용자가 납득할 수 있는 숫자와 조건을 기준으로 생성합니다.
  if (requiredHours > availableHours) {
    riskFactors.push({
      label: "작업 시간 부족",
      detail: `예상 필요 시간은 ${Math.round(requiredHours)}시간이지만 확보 가능한 시간은 ${Math.round(availableHours)}시간입니다.`,
      severity: "high",
    });
  }

  if (input.cuts >= 60) {
    riskFactors.push({
      label: "회차당 컷 수 과다",
      detail: `${input.cuts}컷은 기본 기준인 45컷보다 많아 작업량 부담이 큽니다.`,
      severity: "high",
    });
  }

  if (input.colorMode === "컬러") {
    riskFactors.push({
      label: "풀 컬러 작업 부담",
      detail: "풀 컬러는 흑백보다 채색 시간이 많이 필요해 마감 리스크가 높아질 수 있습니다.",
      severity: "medium",
    });
  }

  if (input.bgComplexity === "복잡") {
    riskFactors.push({
      label: "배경 복잡도 높음",
      detail: "도시, 자연, 군중 등 디테일이 많은 배경은 컷당 작업 시간을 증가시킵니다.",
      severity: "medium",
    });
  }

  if (!input.hasAssistant && input.cuts >= 50) {
    riskFactors.push({
      label: "보조 인력 없음",
      detail: "어시스턴트 없이 많은 컷을 혼자 작업해야 하므로 일정 부담이 커질 수 있습니다.",
      severity: "medium",
    });
  }

  if (input.weeklyHours < 20) {
    riskFactors.push({
      label: "주당 작업 시간 부족",
      detail: `${input.weeklyHours}시간/주는 장기 연재 준비 기준으로 다소 부족할 수 있습니다.`,
      severity: "medium",
    });
  }

  if (riskFactors.length === 0) {
    riskFactors.push({
      label: "일정 여유",
      detail: "현재 입력값 기준으로 예상 작업 시간보다 확보 가능한 시간이 충분합니다.",
      severity: "low",
    });
  }

  return {
    successRate,
    estimatedDays: Math.ceil(requiredHours / Math.max(1, input.weeklyHours / 7)),
    requiredHours: Math.round(requiredHours),
    availableHours: Math.round(availableHours),
    hourGap: Math.round(hourGap),
    riskFactors: riskFactors.slice(0, 3),
    recommendation:
      successRate >= 80
        ? "현재 계획은 비교적 안정적입니다. 현재 작업량을 유지해도 마감 가능성이 높습니다."
        : successRate >= 60
        ? "주의가 필요합니다. 컷 수를 줄이거나 주당 작업 시간을 조금 더 확보하는 것을 권장합니다."
        : "현재 계획으로는 마감 지연 가능성이 큽니다. 컷 수, 채색 범위, 연재 주기를 다시 조정하는 것이 좋습니다.",
  };
}

export const scheduleApi = {
  calculate: async (input: ScheduleInput): Promise<ScheduleResult> => {
    // 실제 API 호출처럼 보이도록 짧은 지연을 둡니다.
    await new Promise<void>((r) => setTimeout(r, 700));
    return calcResult(input);
  },

  // What-if 영역에서 입력값 변경 즉시 미리보기용으로 사용하는 동기 계산 함수입니다.
  calculateSync: (input: ScheduleInput): ScheduleResult => calcResult(input),
};
