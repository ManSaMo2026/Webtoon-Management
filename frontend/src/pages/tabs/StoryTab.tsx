import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles, Filter } from "lucide-react";
import { storyApi } from "../../api/story";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea, Select } from "../../components/ui/FormField";
import { SkeletonList, EmptyState } from "../../components/ui/Skeleton";
import type { Episode, Foreshadow, Act, EpisodePurpose, ForeshadowStatus } from "../../types";

const PURPOSE_OPTIONS: EpisodePurpose[] = ["설정", "전개", "클라이맥스", "반전", "여운"];
const purposeColor: Record<EpisodePurpose, "info" | "default" | "danger" | "warning" | "neutral"> = {
  설정: "info", 전개: "default", 클라이맥스: "danger", 반전: "warning", 여운: "neutral",
};
const foreshadowBadge: Record<ForeshadowStatus, "warning" | "success" | "info"> = {
  미회수: "warning", 회수완료: "success", 진행중: "info",
};

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
    onError: () => toast.error("저장 실패"),
  });

  const aiMutation = useMutation({
    mutationFn: () => storyApi.getAiActSuggestion(projectId),
    onSuccess: (data) => { setForm({ act1: data.act1, act2: data.act2, act3: data.act3 }); toast.success("AI 제안이 반영되었습니다."); },
    onError: () => toast.error("AI 제안을 불러오지 못했습니다."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>3막 구조</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" loading={aiMutation.isPending} onClick={() => aiMutation.mutate()}>
            <Sparkles size={12} />AI 제안
          </Button>
          <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>저장</Button>
        </div>
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

function EpisodeModal({ open, onClose, projectId, episode }: {
  open: boolean; onClose: () => void; projectId: string; episode?: Episode;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(episode ?? { ...EMPTY_EP, projectId });

  const mutation = useMutation({
    mutationFn: () => episode
      ? storyApi.updateEpisode(episode.id, form)
      : storyApi.createEpisode({ ...form, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["episodes", projectId] });
      toast.success(episode ? "회차가 수정되었습니다." : "회차가 추가되었습니다.");
      onClose();
    },
    onError: () => toast.error("저장 실패"),
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
          <Input label="화 번호" type="number" min={1} value={form.number}
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
function EpisodesSection({ projectId }: { projectId: string }) {
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
        <CardTitle>회차 목록</CardTitle>
        <Button size="sm" onClick={() => { setEditEp(undefined); setModalOpen(true); }}>
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
      <EpisodeModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} episode={editEp} />
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="회차 삭제" message="이 회차를 삭제하시겠습니까?"
        loading={deleteMutation.isPending} />
    </Card>
  );
}

// --- Foreshadow Section ---
const EMPTY_F = { content: "", appearEp: 1, resolveEp: null as number | null, status: "미회수" as ForeshadowStatus };

function ForeshadowModal({ open, onClose, projectId, item }: {
  open: boolean; onClose: () => void; projectId: string; item?: Foreshadow;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(item ?? { ...EMPTY_F, projectId });

  const mutation = useMutation({
    mutationFn: () => item
      ? storyApi.updateForeshadow(item.id, form)
      : storyApi.createForeshadow({ ...form, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foreshadows", projectId] });
      toast.success(item ? "복선이 수정되었습니다." : "복선이 추가되었습니다.");
      onClose();
    },
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
        <Textarea label="복선 내용" rows={2} value={form.content}
          onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="복선의 내용이나 장면을 설명하세요." />
        <div className="grid grid-cols-2 gap-4">
          <Input label="등장화" type="number" min={1} value={form.appearEp}
            onChange={(e) => setForm(f => ({ ...f, appearEp: Number(e.target.value) }))} />
          <Input label="회수화" type="number" min={1} value={form.resolveEp ?? ""}
            onChange={(e) => setForm(f => ({ ...f, resolveEp: e.target.value ? Number(e.target.value) : null }))}
            placeholder="미정" />
        </div>
        <Select label="상태" value={form.status}
          onChange={(e) => setForm(f => ({ ...f, status: e.target.value as ForeshadowStatus }))}>
          {(["미회수", "진행중", "회수완료"] as ForeshadowStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
    </Modal>
  );
}

function ForeshadowSection({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Foreshadow | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterUnresolved, setFilterUnresolved] = useState(false);

  const { data: foreshadows, isLoading } = useQuery({
    queryKey: ["foreshadows", projectId],
    queryFn: () => storyApi.getForeshadows(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: storyApi.deleteForeshadow,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["foreshadows", projectId] }); toast.success("복선이 삭제되었습니다."); setDeleteId(null); },
  });

  const list = filterUnresolved ? foreshadows?.filter(f => f.status === "미회수") : foreshadows;

  return (
    <Card>
      <CardHeader>
        <CardTitle>복선 관리</CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterUnresolved(f => !f)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1 ${filterUnresolved ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            <Filter size={11} />미회수만
          </button>
          <Button size="sm" onClick={() => { setEditItem(undefined); setModalOpen(true); }}>
            <Plus size={14} />복선 추가
          </Button>
        </div>
      </CardHeader>
      {isLoading ? <SkeletonList count={2} /> : (
        <>
          {!list?.length ? (
            <EmptyState title={filterUnresolved ? "미회수 복선이 없습니다" : "등록된 복선이 없습니다"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">복선 내용</th>
                    <th className="text-center pb-2 font-medium w-16">등장화</th>
                    <th className="text-center pb-2 font-medium w-16">회수화</th>
                    <th className="text-center pb-2 font-medium w-20">상태</th>
                    <th className="w-16 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {list.sort((a, b) => a.appearEp - b.appearEp).map(f => (
                    <tr key={f.id} className="border-b border-border/50 group hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 text-foreground">{f.content}</td>
                      <td className="py-2.5 text-center font-mono text-muted-foreground">{f.appearEp}화</td>
                      <td className="py-2.5 text-center font-mono text-muted-foreground">{f.resolveEp ? `${f.resolveEp}화` : "—"}</td>
                      <td className="py-2.5 text-center"><Badge variant={foreshadowBadge[f.status]}>{f.status}</Badge></td>
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
      <ForeshadowModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} item={editItem} />
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="복선 삭제" message="이 복선을 삭제하시겠습니까?"
        loading={deleteMutation.isPending} />
    </Card>
  );
}

export function StoryTab() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <div className="space-y-5">
      <ActsSection projectId={id} />
      <EpisodesSection projectId={id} />
      <ForeshadowSection projectId={id} />
    </div>
  );
}
