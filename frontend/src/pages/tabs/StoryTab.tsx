import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles, Filter, Network } from "lucide-react";
import { storyApi } from "../../api/story";
import { projectsApi } from "../../api/projects";
import { charactersApi } from "../../api/characters";
import { aiApi } from "../../api/ai.api";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea, Select } from "../../components/ui/FormField";
import { SkeletonList, EmptyState } from "../../components/ui/Skeleton";
import { CreativeChat } from "../../components/ai/CreativeChat";
import type { Character, Episode, Foreshadow, Act, EpisodePurpose, ForeshadowImportance, ForeshadowStatus } from "../../types";
import { MAX_EPISODES } from "../../config/limits";

const PURPOSE_OPTIONS: EpisodePurpose[] = ["설정", "전개", "클라이맥스", "반전", "여운"];
const purposeColor: Record<EpisodePurpose, "info" | "default" | "danger" | "warning" | "neutral"> = {
  설정: "info", 전개: "default", 클라이맥스: "danger", 반전: "warning", 여운: "neutral",
};
const foreshadowBadge: Record<ForeshadowStatus, "warning" | "success" | "info"> = {
  미회수: "warning", 회수완료: "success", 진행중: "info",
};

function StoryWorkflowGuide() {
  const steps = [
    ["01", "큰 줄기", "시작·전개·결말의 방향을 먼저 정합니다."],
    ["02", "회차 전개", "큰 줄기를 독자가 읽을 회차로 나눕니다."],
    ["03", "복선 점검", "심은 단서와 회수할 시점을 연결합니다."],
  ];
  return <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="story-workflow-title">
    <div className="mb-4"><p className="text-xs font-semibold text-primary">추천 작성 순서</p><h2 id="story-workflow-title" className="mt-1 text-base font-bold text-foreground">처음이라면 위에서 아래로 작성하세요</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">모든 내용을 한 번에 완성하지 않아도 됩니다. 큰 방향을 정한 뒤 회차와 복선을 구체화하면 수정 범위를 줄일 수 있습니다.</p></div>
    <ol className="grid overflow-hidden rounded-md border border-border md:grid-cols-3">{steps.map(([number, title, description], index) => <li key={number} className={`p-3.5 ${index > 0 ? "border-t border-border md:border-t-0 md:border-l" : ""}`}><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-primary">{number}</span><strong className="text-sm text-foreground">{title}</strong></div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p></li>)}</ol>
  </section>;
}

// --- Acts Section ---
function ActsSection({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: act, isLoading } = useQuery({
    queryKey: ["acts", projectId],
    queryFn: () => storyApi.getActs(projectId),
  });
  const [form, setForm] = useState<{ act1: string; act2: string; act3: string }>({ act1: "", act2: "", act3: "" });
  const [initialized, setInitialized] = useState(false);

  if (!initialized && act !== undefined) {
    if (act) setForm({ act1: act.act1 ?? "", act2: act.act2 ?? "", act3: act.act3 ?? "" });
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => storyApi.saveActs({ projectId, ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["acts", projectId] }); toast.success("3막 구조가 저장되었습니다."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "저장 실패"),
  });

  return (
    <Card>
      <CardHeader>
        <div><CardTitle>1. 이야기의 큰 줄기</CardTitle><p className="mt-1 text-xs text-muted-foreground">각 막에서 인물이 무엇을 선택하고 어떻게 달라지는지만 먼저 적어보세요.</p></div>
        <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>저장</Button>
      </CardHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([["1막 (설정)", "act1"], ["2막 (전개)", "act2"], ["3막 (결말)", "act3"]] as const).map(([label, key]) => (
          <div key={key}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
            <textarea
              value={form[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={`${label} 내용을 입력하세요...`}
              rows={5}
              className="w-full text-sm rounded-md border border-border bg-input-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// --- Episode Form ---
const EMPTY_EP = { number: 1, summary: "", purpose: "전개" as EpisodePurpose, hook: "" };

function EpisodeModal({ open, onClose, projectId, episode, maxEpisode }: {
  open: boolean; onClose: () => void; projectId: string; episode?: Episode; maxEpisode: number;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(episode ?? { ...EMPTY_EP, projectId });

  useEffect(() => {
    if (!open) return;
    setForm(episode ?? { ...EMPTY_EP, projectId });
  }, [open, episode, projectId]);

  const mutation = useMutation({
    mutationFn: () => episode
      ? storyApi.updateEpisode(episode.id, form)
      : storyApi.createEpisode({ ...form, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["episodes", projectId] });
      toast.success(episode ? "회차가 수정되었습니다." : "회차가 추가되었습니다.");
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "저장 실패"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={episode ? "회차 수정" : "회차 추가"}
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>저장</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="화 번호" type="number" min={1} max={maxEpisode} value={form.number} hint={`이 작품의 완결 목표: ${maxEpisode}화`}
            onChange={(e) => setForm(f => ({ ...f, number: Number(e.target.value) }))} />
          <Select label="회차 목적" value={form.purpose}
            onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value as EpisodePurpose }))}>
            {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <Textarea label="줄거리 요약" rows={3} value={form.summary}
          onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))}
          placeholder="이번 화의 주요 내용을 요약해주세요." />
        <Input label="엔딩 훅" value={form.hook}
          onChange={(e) => setForm(f => ({ ...f, hook: e.target.value }))}
          placeholder="독자를 다음 화로 이끄는 마지막 장면이나 반전" />
      </div>
    </Modal>
  );
}

// --- Episodes Section ---
function EpisodesSection({ projectId, maxEpisode }: { projectId: string; maxEpisode: number }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editEp, setEditEp] = useState<Episode | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["episodes", projectId],
    queryFn: () => storyApi.getEpisodes(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: storyApi.deleteEpisode,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["episodes", projectId] }); toast.success("회차가 삭제되었습니다."); setDeleteId(null); },
  });

  return (
    <Card>
      <CardHeader>
        <div><CardTitle>2. 회차별 전개</CardTitle><p className="mt-1 text-xs text-muted-foreground">한 회차의 목적, 핵심 사건, 다음 화를 보게 할 마지막 장면을 기록합니다.</p></div>
        <Button size="sm" disabled={(episodes?.length ?? 0) >= maxEpisode} title={(episodes?.length ?? 0) >= maxEpisode ? `최대 ${maxEpisode}개 회차까지 등록할 수 있습니다.` : undefined} onClick={() => { setEditEp(undefined); setModalOpen(true); }}>
          <Plus size={14} />회차 추가
        </Button>
      </CardHeader>
      {isLoading ? <SkeletonList count={3} /> : (
        <>
          {!episodes?.length ? (
            <EmptyState title="등록된 회차가 없습니다" description="첫 번째 회차를 추가해보세요" />
          ) : (
            <div className="space-y-2">
              {episodes.sort((a, b) => a.number - b.number).map(ep => (
                <div key={ep.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors group">
                  <span className="font-mono font-bold text-sm text-muted-foreground w-8 shrink-0 pt-0.5">{ep.number}화</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={purposeColor[ep.purpose]}>{ep.purpose}</Badge>
                    </div>
                    {ep.summary && <p className="text-sm text-foreground">{ep.summary}</p>}
                    {ep.hook && <p className="text-xs text-muted-foreground mt-1 italic">"{ep.hook}"</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditEp(ep); setModalOpen(true); }} className="p-1 text-muted-foreground hover:text-primary">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteId(ep.id)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <EpisodeModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} episode={editEp} maxEpisode={maxEpisode} />
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="회차 삭제" message="이 회차를 삭제하시겠습니까?"
        loading={deleteMutation.isPending} />
    </Card>
  );
}

// --- Foreshadow Section ---
const EMPTY_F = {
  content: "",
  keyword: "",
  importance: "medium" as ForeshadowImportance,
  relatedCharacterIds: [] as string[],
  appearEp: 1,
  resolveEp: null as number | null,
  status: "미회수" as ForeshadowStatus,
};

const importanceLabel: Record<ForeshadowImportance, string> = { low: "낮음", medium: "보통", high: "높음" };
const importanceBadge: Record<ForeshadowImportance, "neutral" | "info" | "danger"> = { low: "neutral", medium: "info", high: "danger" };

function ForeshadowModal({ open, onClose, projectId, item, maxEpisode }: {
  open: boolean; onClose: () => void; projectId: string; item?: Foreshadow; maxEpisode: number;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(item ? { ...item, relatedCharacterIds: item.relatedCharacterIds ?? [] } : { ...EMPTY_F, projectId });
  const { data: characters } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => charactersApi.list(projectId),
  });

  // 수정 대상을 바꾸거나 새 항목을 열 때 이전 모달의 입력값이 남지 않도록 합니다.
  useEffect(() => {
    if (!open) return;
    setForm(item ? { ...item, relatedCharacterIds: item.relatedCharacterIds ?? [] } : { ...EMPTY_F, projectId });
  }, [open, item, projectId]);

  const mutation = useMutation({
    mutationFn: () => item
      ? storyApi.updateForeshadow(item.id, form)
      : storyApi.createForeshadow({ ...form, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foreshadows", projectId] });
      toast.success(item ? "복선이 수정되었습니다." : "복선이 추가되었습니다.");
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "복선을 저장하지 못했습니다."),
  });

  return (
    <Modal open={open} onClose={onClose} title={item ? "복선 수정" : "복선 추가"} size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>저장</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="핵심 키워드" value={form.keyword ?? ""}
            onChange={(e) => setForm(f => ({ ...f, keyword: e.target.value }))}
            placeholder="예: 황제의 반지, 붉은 달" />
          <Select label="중요도" value={form.importance ?? "medium"}
            onChange={(e) => setForm(f => ({ ...f, importance: e.target.value as ForeshadowImportance }))}>
            {(Object.keys(importanceLabel) as ForeshadowImportance[]).map(level => <option key={level} value={level}>{importanceLabel[level]}</option>)}
          </Select>
        </div>
        <Textarea label="복선 내용" rows={2} value={form.content}
          onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="복선의 내용이나 장면을 설명하세요." />
        <div className="grid grid-cols-2 gap-4">
          <Input label="등장화" type="number" min={1} max={maxEpisode} value={form.appearEp} hint={`최대 ${maxEpisode}화`}
            onChange={(e) => setForm(f => ({ ...f, appearEp: Number(e.target.value) }))} />
          <Input label="회수화" type="number" min={form.appearEp || 1} max={maxEpisode} value={form.resolveEp ?? ""} hint="등장화 이후로 입력"
            onChange={(e) => setForm(f => ({ ...f, resolveEp: e.target.value ? Number(e.target.value) : null }))}
            placeholder="미정" />
        </div>
        <Select label="상태" value={form.status}
          onChange={(e) => setForm(f => ({ ...f, status: e.target.value as ForeshadowStatus }))}>
          {(["미회수", "진행중", "회수완료"] as ForeshadowStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <div>
          <p className="text-sm font-medium text-foreground mb-2">관련 캐릭터</p>
          {!characters?.length ? <p className="text-xs text-muted-foreground">먼저 캐릭터를 등록하면 복선과 연결할 수 있습니다.</p> :
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {characters.map(character => {
                const checked = (form.relatedCharacterIds ?? []).includes(character.id);
                return <label key={character.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/30">
                  <input type="checkbox" checked={checked} className="accent-primary"
                    onChange={() => setForm(current => ({
                      ...current,
                      relatedCharacterIds: checked
                        ? (current.relatedCharacterIds ?? []).filter(id => id !== character.id)
                        : [...(current.relatedCharacterIds ?? []), character.id],
                    }))} />
                  {character.name}<span className="text-xs text-muted-foreground">{character.role}</span>
                </label>;
              })}
            </div>}
        </div>
      </div>
    </Modal>
  );
}

function ForeshadowSection({ projectId, maxEpisode }: { projectId: string; maxEpisode: number }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Foreshadow | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterUnresolved, setFilterUnresolved] = useState(false);
  const [filterHigh, setFilterHigh] = useState(false);
  const [review, setReview] = useState("");

  const { data: foreshadows, isLoading } = useQuery({
    queryKey: ["foreshadows", projectId],
    queryFn: () => storyApi.getForeshadows(projectId),
  });
  const { data: characters } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => charactersApi.list(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: storyApi.deleteForeshadow,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["foreshadows", projectId] }); toast.success("복선이 삭제되었습니다."); setDeleteId(null); },
  });

  const reviewMutation = useMutation({
    mutationFn: () => aiApi.reviewForeshadows(foreshadows ?? []),
    onSuccess: setReview,
    onError: () => toast.error("복선 점검 결과를 불러오지 못했습니다."),
  });

  const list = (foreshadows ?? []).filter(item =>
    (!filterUnresolved || item.status !== "회수완료") && (!filterHigh || item.importance === "high")
  );
  const characterNames = new Map((characters ?? []).map(character => [character.id, character.name]));
  const summary = {
    all: foreshadows?.length ?? 0,
    unresolved: foreshadows?.filter(item => item.status !== "회수완료").length ?? 0,
    high: foreshadows?.filter(item => item.importance === "high").length ?? 0,
    completed: foreshadows?.filter(item => item.status === "회수완료").length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[["전체 복선", summary.all], ["미회수 복선", summary.unresolved], ["중요도 높음", summary.high], ["회수 완료", summary.completed]].map(([label, value]) =>
          <Card key={label} padding="sm"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold font-mono mt-1">{value}</p></Card>)}
      </div>
      <Card>
      <CardHeader>
        <div><CardTitle>3. 복선과 회수</CardTitle><p className="mt-1 text-xs text-muted-foreground">중요한 단서가 언제 등장하고 언제 회수되는지 놓치지 않도록 연결합니다.</p></div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => setFilterUnresolved(f => !f)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1 ${filterUnresolved ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            <Filter size={11} />미회수만 보기
          </button>
          <button onClick={() => setFilterHigh(value => !value)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1 ${filterHigh ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
            <Filter size={11} />중요도 높음만 보기
          </button>
          <Button size="sm" onClick={() => { setEditItem(undefined); setModalOpen(true); }}>
            <Plus size={14} />복선 추가
          </Button>
        </div>
      </CardHeader>
      {isLoading ? <SkeletonList count={2} /> : (
        <>
          {!list.length ? (
            <EmptyState title={filterUnresolved || filterHigh ? "조건에 맞는 복선이 없습니다" : "등록된 복선이 없습니다"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">키워드 / 복선 내용</th>
                    <th className="text-center pb-2 font-medium w-20">중요도</th>
                    <th className="text-center pb-2 font-medium w-16">등장화</th>
                    <th className="text-center pb-2 font-medium w-16">회수화</th>
                    <th className="text-center pb-2 font-medium w-20">상태</th>
                    <th className="text-left pb-2 font-medium min-w-32">관련 캐릭터</th>
                    <th className="w-16 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {[...list].sort((a, b) => a.appearEp - b.appearEp).map(f => (
                    <tr key={f.id} className="border-b border-border/50 group hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 text-foreground">
                        {f.keyword && <Badge variant="default" className="mb-1">{f.keyword}</Badge>}
                        <p className="text-sm">{f.content}</p>
                      </td>
                      <td className="py-2.5 text-center"><Badge variant={importanceBadge[f.importance ?? "medium"]}>{importanceLabel[f.importance ?? "medium"]}</Badge></td>
                      <td className="py-2.5 text-center font-mono text-muted-foreground">{f.appearEp}화</td>
                      <td className="py-2.5 text-center font-mono text-muted-foreground">{f.resolveEp ? `${f.resolveEp}화` : "—"}</td>
                      <td className="py-2.5 text-center"><Badge variant={foreshadowBadge[f.status]}>{f.status}</Badge></td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {(f.relatedCharacterIds ?? []).map(id => characterNames.get(id)).filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button onClick={() => { setEditItem(f); setModalOpen(true); }} className="p-1 text-muted-foreground hover:text-primary"><Pencil size={12} /></button>
                          <button onClick={() => setDeleteId(f.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <ForeshadowModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} item={editItem} maxEpisode={maxEpisode} />
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="복선 삭제" message="이 복선을 삭제하시겠습니까?"
        loading={deleteMutation.isPending} />
      </Card>

      <Card className="border-dashed">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0"><Network size={19} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">복선 구조 보기 준비 영역</p>
            <p className="text-xs text-muted-foreground mt-1">추후 복선, 캐릭터, 회차 간 관계를 마인드맵 형태로 확장할 수 있습니다.</p>
            {review && <p className="text-xs text-foreground mt-2 rounded-md bg-muted/50 p-2">{review}</p>}
          </div>
          <Button size="sm" variant="outline" loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}><Sparkles size={13} />AI로 복선 점검</Button>
        </div>
      </Card>
    </div>
  );
}

export function StoryTab() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useQuery({ queryKey: ["project", id], queryFn: () => projectsApi.get(id!), enabled: !!id });
  if (!id) return null;
  const maxEpisode = Math.min(project?.totalEpisodes ?? MAX_EPISODES, MAX_EPISODES);
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <StoryWorkflowGuide />
        <ActsSection projectId={id} />
        <EpisodesSection projectId={id} maxEpisode={maxEpisode} />
        <ForeshadowSection projectId={id} maxEpisode={maxEpisode} />
      </div>
      <CreativeChat area="story" context={`프로젝트 ${id}의 스토리, 회차, 복선을 정리하는 중`} />
    </div>
  );
}
