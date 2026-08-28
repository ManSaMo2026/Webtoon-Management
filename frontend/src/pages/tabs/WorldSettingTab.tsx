import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "../../api/ai.api";
import { worldSettingsApi } from "../../api/worldSettings";
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

  const organizeMutation = useMutation({
    mutationFn: () => aiApi.organizeWorldSetting(form),
    onSuccess: (organized) => {
      setForm(organized);
      toast.success("작성한 내용을 바탕으로 세계관 정리 초안을 반영했습니다.");
    },
    onError: () => toast.error("세계관 정리 도움을 불러오지 못했습니다."),
  });

  if (isLoading) return <SkeletonCard lines={8} />;

  return <div className="space-y-5 max-w-5xl">
    <Card className="bg-secondary/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0"><Globe2 size={19} /></div>
        <div><h2 className="text-sm font-semibold">세계관과 배경 설정</h2><p className="text-xs text-muted-foreground mt-1">장소, 시대, 규칙을 미리 정리해 회차와 캐릭터 설정의 일관성을 유지하세요.</p></div>
      </div>
    </Card>

    <Card>
      <CardHeader className="flex-wrap gap-3">
        <CardTitle>배경 설정 문서</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" loading={organizeMutation.isPending} onClick={() => organizeMutation.mutate()}><Sparkles size={13} />AI로 세계관 정리 도움받기</Button>
          <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}><Save size={13} />저장</Button>
        </div>
      </CardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="시대/시간적 배경" value={form.era} onChange={(e) => setForm(current => ({ ...current, era: e.target.value }))} placeholder="예: 현대 한국, 근미래, 중세 판타지, 조선 시대" />
        <Input label="작품 분위기 톤" value={form.moodTone} onChange={(e) => setForm(current => ({ ...current, moodTone: e.target.value }))} placeholder="예: 어둡지만 따뜻한 성장물, 가볍고 코믹한 학원물" />
        <Textarea label="주요 장소" rows={3} value={form.mainPlaces} onChange={(e) => setForm(current => ({ ...current, mainPlaces: e.target.value }))} placeholder="예: 항구 도시, 왕립 아카데미, 폐쇄된 연구소" />
        <Textarea label="주요 조직" rows={3} value={form.organizations} onChange={(e) => setForm(current => ({ ...current, organizations: e.target.value }))} placeholder="예: 왕실, 반란군, 대기업, 학생회" />
        <Textarea label="세계관 규칙" rows={3} value={form.worldRules} onChange={(e) => setForm(current => ({ ...current, worldRules: e.target.value }))} placeholder="예: 마법은 계약을 통해서만 사용할 수 있음" />
        <Textarea label="문화/사회 분위기" rows={3} value={form.culture} onChange={(e) => setForm(current => ({ ...current, culture: e.target.value }))} placeholder="예: 계급 차이가 뚜렷하고 외부인을 경계함" />
        <Textarea label="기술/마법/능력 체계" rows={3} value={form.technologyOrMagic} onChange={(e) => setForm(current => ({ ...current, technologyOrMagic: e.target.value }))} placeholder="예: 감정을 에너지로 바꾸는 기술이 존재함" />
        <Textarea label="금지 설정/주의할 설정" rows={3} value={form.forbiddenSettings} onChange={(e) => setForm(current => ({ ...current, forbiddenSettings: e.target.value }))} placeholder="예: 시간여행 설정은 사용하지 않음, 특정 인물은 죽지 않음" />
      </div>
      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">AI 정리 도움은 현재 입력값을 유지하면서 비어 있는 항목에 초안을 제안합니다. 결과를 검토한 뒤 저장해주세요.</p>
    </Card>
  </div>;
}
