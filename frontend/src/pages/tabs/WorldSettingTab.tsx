import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Globe2, Save } from "lucide-react";
import { toast } from "sonner";
import { worldSettingsApi } from "../../api/worldSettings";
import { CreativeChat } from "../../components/ai/CreativeChat";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/FormField";
import { SkeletonCard } from "../../components/ui/Skeleton";
import type { WorldSetting } from "../../types";

const createEmptySetting = (projectId: string): WorldSetting => ({
  id: `world-${projectId}`,
  projectId,
  era: "",
  mainPlaces: "",
  worldRules: "",
  organizations: "",
  culture: "",
  technologyOrMagic: "",
  moodTone: "",
  forbiddenSettings: "",
  researchNotes: "",
  referenceSources: "",
});

export function WorldSettingTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [form, setForm] = useState<WorldSetting>(() => createEmptySetting(projectId ?? ""));

  const { data, isLoading } = useQuery({
    queryKey: ["world-setting", projectId],
    queryFn: () => worldSettingsApi.get(projectId!),
    enabled: !!projectId,
  });

  // 저장된 문서가 있으면 불러오고, 없으면 프로젝트별 빈 문서를 준비합니다.
  useEffect(() => {
    if (!projectId || data === undefined) return;
    setForm(data ?? createEmptySetting(projectId));
  }, [data, projectId]);

  const saveMutation = useMutation({
    mutationFn: () => worldSettingsApi.save(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["world-setting", projectId] });
      toast.success("세계관 설정이 저장되었습니다.");
    },
    onError: () => toast.error("세계관 설정을 저장하지 못했습니다."),
  });

  if (isLoading) return <SkeletonCard lines={8} />;

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
    <div className="min-w-0 space-y-5">
      <Card className="bg-secondary/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0"><Globe2 size={19} /></div>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">왜 작성하나요?</p><h2 className="mt-1 text-base font-bold">회차가 늘어나도 설정이 흔들리지 않게 하는 기준표입니다</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">장소와 규칙을 미리 기록하면 캐릭터의 행동이 앞선 설정과 충돌하는 일을 줄이고, 새 회차마다 같은 자료를 다시 찾는 시간을 아낄 수 있습니다.</p>
            <div className="mt-4 grid gap-2 border-t border-primary/10 pt-3 sm:grid-cols-3">{[["1", "시대와 장소"], ["2", "지켜야 할 규칙"], ["3", "조사 근거"]].map(([number, label]) => <div key={number} className="flex items-center gap-2 text-xs"><span className="font-mono font-bold text-primary">{number}</span><span className="font-medium text-foreground">{label}</span></div>)}</div>
          </div>
        </div>
      </Card>

      <Card>
      <CardHeader className="flex-wrap gap-3">
        <div><CardTitle>세계관 기준표</CardTitle><p className="mt-1 text-xs text-muted-foreground">처음에는 핵심 설정만 작성하고, 필요한 세부 설정을 나중에 확장하세요.</p></div>
        <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}><Save size={13} />저장</Button>
      </CardHeader>
      <section aria-labelledby="world-core-title">
        <div className="mb-3"><h3 id="world-core-title" className="text-sm font-semibold">먼저 작성할 핵심 설정</h3><p className="mt-1 text-xs text-muted-foreground">이 네 항목만 있어도 스토리와 캐릭터가 따라야 할 기본 기준이 생깁니다.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="시대/시간적 배경" value={form.era} onChange={(e) => setForm(current => ({ ...current, era: e.target.value }))} placeholder="예: 현대 한국, 근미래, 중세 판타지, 조선 시대" />
          <Input label="작품 분위기 톤" value={form.moodTone} onChange={(e) => setForm(current => ({ ...current, moodTone: e.target.value }))} placeholder="예: 어둡지만 따뜻한 성장물, 가볍고 코믹한 학원물" />
          <Textarea label="주요 장소" rows={3} value={form.mainPlaces} onChange={(e) => setForm(current => ({ ...current, mainPlaces: e.target.value }))} placeholder="이야기가 반복해서 벌어지는 장소와 특징" />
          <Textarea label="세계관 핵심 규칙" rows={3} value={form.worldRules} onChange={(e) => setForm(current => ({ ...current, worldRules: e.target.value }))} placeholder="누구나 따라야 하는 규칙과 어겼을 때의 결과" />
        </div>
      </section>

      <details className="group mt-5 rounded-lg border border-border bg-input-background">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">세부 설정 확장하기 <span className="ml-1 text-xs font-normal text-muted-foreground">필요할 때 작성</span></summary>
        <div className="grid grid-cols-1 gap-4 border-t border-border p-4 md:grid-cols-2">
          <Textarea label="주요 조직" rows={3} value={form.organizations} onChange={(e) => setForm(current => ({ ...current, organizations: e.target.value }))} placeholder="예: 왕실, 반란군, 대기업, 학생회" />
          <Textarea label="문화/사회 분위기" rows={3} value={form.culture} onChange={(e) => setForm(current => ({ ...current, culture: e.target.value }))} placeholder="예: 계급 차이가 뚜렷하고 외부인을 경계함" />
          <Textarea label="기술/마법/능력 체계" rows={3} value={form.technologyOrMagic} onChange={(e) => setForm(current => ({ ...current, technologyOrMagic: e.target.value }))} placeholder="사용 조건, 한계, 대가를 함께 기록" />
          <Textarea label="금지 설정/주의할 설정" rows={3} value={form.forbiddenSettings} onChange={(e) => setForm(current => ({ ...current, forbiddenSettings: e.target.value }))} placeholder="예: 시간여행은 사용하지 않음, 특정 인물은 죽지 않음" />
        </div>
      </details>

      <section aria-labelledby="world-research-title" className="mt-5 border-t border-border pt-5">
        <div className="mb-3 flex items-start gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-primary"><BookOpenCheck size={16} /></span><div><h3 id="world-research-title" className="text-sm font-semibold">사전 조사 메모</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">역사·지역·직업처럼 실제 사실을 참고했다면 설정과 근거를 함께 남겨 나중에 다시 확인할 수 있게 합니다.</p></div></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Textarea label="조사한 내용과 작품에 적용할 점" rows={4} value={form.researchNotes ?? ""} onChange={(e) => setForm(current => ({ ...current, researchNotes: e.target.value }))} placeholder="예: 조선 시대 야간 통행 제도와 작품에서 바꿔 사용할 부분" />
          <Textarea label="참고 출처" rows={4} value={form.referenceSources ?? ""} onChange={(e) => setForm(current => ({ ...current, referenceSources: e.target.value }))} placeholder="책, 논문, 기사, 영상 제목이나 링크를 기록" />
        </div>
      </section>
      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">오른쪽 상담에서 생각을 충분히 정리한 뒤, 필요한 내용만 직접 입력하고 저장해주세요.</p>
      </Card>
    </div>
    <CreativeChat area="world" context={[form.era, form.mainPlaces, form.worldRules, form.moodTone].filter(Boolean).join(" / ")} />
  </div>;
}
