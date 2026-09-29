import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Expand, Globe2, Image as ImageIcon, ImagePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { worldSettingsApi } from "../../api/worldSettings";
import { CreativeChat } from "../../components/ai/CreativeChat";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/FormField";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { optimizeReferenceImage } from "../../utils/image";
import type { WorldPlaceReference, WorldSetting } from "../../types";

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
  placeReferences: [],
});

export function WorldSettingTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [form, setForm] = useState<WorldSetting>(() => createEmptySetting(projectId ?? ""));
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<WorldPlaceReference | null>(null);

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

  const placeReferences = form.placeReferences ?? [];

  const handlePlaceImages = async (files?: FileList | null) => {
    if (!files?.length) return;
    const availableSlots = 3 - placeReferences.length;
    if (availableSlots <= 0) return toast.error("장소 이미지는 최대 3장까지 등록할 수 있습니다.");
    const selectedFiles = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) toast.info(`남은 ${availableSlots}장만 추가했습니다.`);
    setIsUploadingImages(true);
    try {
      const imageUrls = await Promise.all(selectedFiles.map(optimizeReferenceImage));
      const addedReferences = imageUrls.map((imageUrl, index) => ({
        id: `place-${Date.now()}-${index}`,
        imageUrl,
        memo: "",
      }));
      setForm((current) => ({ ...current, placeReferences: [...(current.placeReferences ?? []), ...addedReferences].slice(0, 3) }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "이미지를 등록하지 못했습니다.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const updatePlaceMemo = (id: string, memo: string) => {
    setForm((current) => ({ ...current, placeReferences: (current.placeReferences ?? []).map((reference) => reference.id === id ? { ...reference, memo } : reference) }));
  };

  const removePlaceImage = (id: string) => {
    setForm((current) => ({ ...current, placeReferences: (current.placeReferences ?? []).filter((reference) => reference.id !== id) }));
    if (previewImage?.id === id) setPreviewImage(null);
  };

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

      <section aria-labelledby="place-reference-title" className="mt-5 border-t border-border pt-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><h3 id="place-reference-title" className="text-sm font-semibold">장소 이미지 메모</h3><span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">{placeReferences.length}/3</span></div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">배경과 장소를 그릴 때 참고할 사진을 올리고 특징을 메모하세요.</p>
          </div>
          <label className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold transition-colors ${placeReferences.length >= 3 || isUploadingImages ? "cursor-not-allowed bg-muted text-muted-foreground opacity-60" : "cursor-pointer bg-white text-foreground hover:border-primary/40 hover:text-primary"}`}>
            <ImagePlus size={14} />{isUploadingImages ? "이미지 처리 중" : "사진 추가"}
            <input type="file" accept="image/*" multiple disabled={placeReferences.length >= 3 || isUploadingImages} className="sr-only" onChange={(event) => { handlePlaceImages(event.target.files); event.target.value = ""; }} />
          </label>
        </div>

        {placeReferences.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-input-background text-center">
            <ImageIcon size={28} className="text-muted-foreground/60" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-text">사진 없음</p>
            <p className="mt-1 text-xs text-muted-foreground">장소 참고 이미지는 최대 3장까지 등록할 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {placeReferences.map((reference, index) => (
              <article key={reference.id} className="overflow-hidden rounded-lg border border-border bg-input-background">
                <button type="button" onClick={() => setPreviewImage(reference)} className="group relative block aspect-[4/3] w-full overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`장소 이미지 ${index + 1} 크게 보기`}>
                  <img src={reference.imageUrl} alt={reference.memo.trim() || `세계관 장소 참고 이미지 ${index + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                  <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Expand size={15} /></span>
                </button>
                <div className="space-y-2 p-3">
                  <label className="block text-xs font-semibold text-foreground">장소 설명 메모
                    <textarea rows={3} maxLength={160} value={reference.memo} onChange={(event) => updatePlaceMemo(reference.id, event.target.value)} placeholder="예: 주인공의 작업실. 북향 창문과 오래된 목재 책상" className="mt-1.5 block w-full resize-none rounded-md border border-border bg-white px-2.5 py-2 text-xs font-normal leading-5 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
                  </label>
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">{reference.memo.length}/160자</span><button type="button" onClick={() => removePlaceImage(reference.id)} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={12} />삭제</button></div>
                </div>
              </article>
            ))}
          </div>
        )}
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
    <CreativeChat area="world" projectId={projectId!} />
    <Modal open={!!previewImage} onClose={() => setPreviewImage(null)} title="장소 이미지 미리보기" description={previewImage?.memo || "등록한 장소 참고 이미지를 크게 확인합니다."} size="xl">
      {previewImage && <img src={previewImage.imageUrl} alt={previewImage.memo.trim() || "세계관 장소 참고 이미지 미리보기"} className="mx-auto max-h-[68vh] w-auto max-w-full rounded-lg object-contain" />}
    </Modal>
  </div>;
}
