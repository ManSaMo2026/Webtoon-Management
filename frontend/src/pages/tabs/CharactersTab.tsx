import { useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { charactersApi } from "../../api/characters";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/FormField";
import { ConfirmModal, Modal } from "../../components/ui/Modal";
import { EmptyState, SkeletonList } from "../../components/ui/Skeleton";
import type { Character } from "../../types";

const EMPTY_CHAR: Omit<Character, "id"> = {
  projectId: "", name: "", role: "", personality: "", goal: "", speechStyle: "", taboo: "", secret: "", keywords: [],
  imageUrl: "", gender: "", age: "", origin: "", occupation: "", likes: "", dislikes: "", backstory: "", relationships: "",
};

function CharacterAvatar({ character, size = "md" }: { character: Pick<Character, "name" | "imageUrl">; size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : "h-14 w-14 text-lg";
  if (character.imageUrl) {
    return <img src={character.imageUrl} alt={`${character.name || "캐릭터"} 참고 이미지`} className={`${sizeClass} rounded-xl object-cover border border-border shrink-0`} />;
  }
  return <div className={`${sizeClass} rounded-xl bg-secondary flex items-center justify-center text-primary font-bold shrink-0`}>{character.name.trim().charAt(0) || "?"}</div>;
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border p-4 space-y-3"><div><h3 className="text-sm font-semibold text-foreground">{title}</h3>{description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}</div>{children}</section>;
}

function CharacterModal({ open, onClose, projectId, character }: { open: boolean; onClose: () => void; projectId: string; character?: Character }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<Character, "id">>(character ? { ...character } : { ...EMPTY_CHAR, projectId });
  const [kwInput, setKwInput] = useState("");

  // 선택된 카드가 바뀔 때 모달 입력값과 이미지 미리보기를 함께 초기화합니다.
  useEffect(() => {
    if (!open) return;
    setForm(character ? { ...character } : { ...EMPTY_CHAR, projectId });
    setKwInput("");
  }, [open, character, projectId]);

  const mutation = useMutation({
    mutationFn: () => character ? charactersApi.update(character.id, form) : charactersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters", projectId] }); toast.success(character ? "캐릭터가 수정되었습니다." : "캐릭터가 추가되었습니다."); onClose(); },
    onError: () => toast.error("캐릭터를 저장하지 못했습니다."),
  });

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 등록할 수 있습니다."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("localStorage 저장을 위해 2MB 이하 이미지를 선택해주세요."); return; }
    // FileReader 결과를 data URL로 저장해 백엔드 없이도 새로고침 후 미리보기가 유지됩니다.
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imageUrl: String(reader.result) }));
    reader.onerror = () => toast.error("이미지를 읽지 못했습니다.");
    reader.readAsDataURL(file);
  };

  const addKeyword = () => {
    const keyword = kwInput.trim();
    if (keyword && !form.keywords.includes(keyword)) { setForm((current) => ({ ...current, keywords: [...current.keywords, keyword] })); setKwInput(""); }
  };

  return <Modal open={open} onClose={onClose} title={character ? "캐릭터 수정" : "캐릭터 추가"} size="xl"
    description="참고 이미지와 설정을 한 곳에서 정리할 수 있습니다."
    footer={<><Button variant="outline" size="sm" onClick={onClose}>취소</Button><Button size="sm" loading={mutation.isPending} disabled={!form.name.trim()} onClick={() => mutation.mutate()}>저장</Button></>}>
    <div className="space-y-4">
      <FormSection title="캐릭터 이미지" description="직접 준비한 참고 이미지를 선택적으로 등록할 수 있습니다.">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <CharacterAvatar character={{ name: form.name, imageUrl: form.imageUrl }} size="lg" />
          <div className="space-y-2"><div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors"><ImagePlus size={15} />참고 이미지 업로드<input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} /></label>
            {form.imageUrl && <Button type="button" variant="outline" size="sm" onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}><Trash2 size={14} />이미지 삭제</Button>}
          </div><p className="text-xs text-muted-foreground">PNG, JPG 등 이미지 파일 · 최대 2MB · 선택 입력</p></div>
        </div>
      </FormSection>

      <FormSection title="기본 정보"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="이름" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 한서윤" />
        <Input label="역할" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="예: 주인공, 조력자, 라이벌, 악역" />
        <Input label="성별" value={form.gender ?? ""} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} placeholder="예: 여성, 남성, 비공개, 기타" />
        <Input label="나이" value={form.age ?? ""} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="예: 24세, 고등학생, 나이 불명" />
        <Input label="직업/소속" value={form.occupation ?? ""} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} placeholder="예: 웹툰 작가 지망생, 왕실 기사, 연구원" />
        <Input label="출신/배경" value={form.origin ?? ""} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} placeholder="예: 항구 도시 출신, 몰락한 귀족 가문" />
      </div></FormSection>

      <FormSection title="성격과 목표"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Textarea label="성격" rows={2} value={form.personality} onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))} placeholder="예: 말수가 적지만 책임감이 강함" />
        <Textarea label="목표" rows={2} value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} placeholder="예: 사라진 가족의 진실을 찾는 것" />
        <Input label="좋아하는 것" value={form.likes ?? ""} onChange={(e) => setForm((f) => ({ ...f, likes: e.target.value }))} placeholder="예: 조용한 장소, 단 음식" />
        <Input label="싫어하는 것" value={form.dislikes ?? ""} onChange={(e) => setForm((f) => ({ ...f, dislikes: e.target.value }))} placeholder="예: 거짓말, 갑작스러운 변화" />
      </div></FormSection>

      <FormSection title="말투와 비밀"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="말투" value={form.speechStyle} onChange={(e) => setForm((f) => ({ ...f, speechStyle: e.target.value }))} placeholder="예: 짧고 단정한 문장 사용" />
        <Input label="금기" value={form.taboo} onChange={(e) => setForm((f) => ({ ...f, taboo: e.target.value }))} placeholder="예: 가족 이야기, 배신, 과거 사건" />
        <Input label="비밀" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} placeholder="예: 사실은 적 조직과 관련이 있음" />
        <Textarea label="과거/생애 요약" rows={2} value={form.backstory ?? ""} onChange={(e) => setForm((f) => ({ ...f, backstory: e.target.value }))} placeholder="예: 어린 시절 사건으로 인해 사람을 쉽게 믿지 못함" />
      </div></FormSection>

      <FormSection title="관계와 키워드">
        <Textarea label="다른 캐릭터와의 관계" rows={2} value={form.relationships ?? ""} onChange={(e) => setForm((f) => ({ ...f, relationships: e.target.value }))} placeholder="예: 주인공과 소꿉친구, 라이벌과 과거 동료 관계" />
        <div><label className="text-sm font-medium text-foreground block mb-1.5">키워드</label><div className="flex gap-2 mb-2">
          <input value={kwInput} onChange={(e) => setKwInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }} placeholder="예: 냉정함, 죄책감, 복수, 성장" className="flex-1 text-sm rounded-md border border-border bg-input-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button type="button" size="sm" variant="outline" onClick={addKeyword}>추가</Button>
        </div><div className="flex flex-wrap gap-1.5">{form.keywords.map((keyword) => <span key={keyword} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">{keyword}<button type="button" aria-label={`${keyword} 키워드 삭제`} onClick={() => setForm((f) => ({ ...f, keywords: f.keywords.filter((item) => item !== keyword) }))} className="hover:text-destructive"><X size={10} /></button></span>)}</div></div>
      </FormSection>
    </div>
  </Modal>;
}

function CharacterCard({ char, onEdit, onDelete }: { char: Character; onEdit: () => void; onDelete: () => void }) {
  return <Card className="group relative cursor-pointer transition-all hover:border-primary/40 hover:shadow-md" onClick={onEdit} role="button" tabIndex={0}
    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEdit(); }} title="카드를 클릭하면 캐릭터 정보를 확인하고 수정할 수 있습니다.">
    <button type="button" aria-label="캐릭터 삭제" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 size={14} /></button>
    <div className="flex items-start gap-3 mb-3 pr-6"><CharacterAvatar character={char} /><div className="min-w-0 pt-1"><h3 className="font-semibold text-sm truncate">{char.name}</h3>{char.role && <p className="text-xs text-muted-foreground mt-0.5">{char.role}</p>}<p className="text-[11px] text-muted-foreground mt-1">클릭하여 상세 정보 보기</p></div></div>
    <div className="space-y-2 text-xs">{char.personality && <p className="line-clamp-2"><span className="text-muted-foreground">성격 </span>{char.personality}</p>}{char.goal && <p className="line-clamp-2"><span className="text-muted-foreground">목표 </span>{char.goal}</p>}</div>
    {char.keywords.length > 0 && <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">{char.keywords.slice(0, 5).map((keyword) => <Badge key={keyword} variant="neutral">{keyword}</Badge>)}</div>}
  </Card>;
}

export function CharactersTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editChar, setEditChar] = useState<Character>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[] | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const { data: characters, isLoading } = useQuery({ queryKey: ["characters", projectId], queryFn: () => charactersApi.list(projectId!), enabled: !!projectId });
  const deleteMutation = useMutation({ mutationFn: charactersApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters", projectId] }); toast.success("캐릭터가 삭제되었습니다."); setDeleteId(null); } });
  const checkConflicts = async () => { setCheckLoading(true); try { setConflicts(await charactersApi.checkConflicts(projectId!)); } finally { setCheckLoading(false); } };
  const openCreate = () => { setEditChar(undefined); setModalOpen(true); };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">캐릭터 <span className="text-muted-foreground font-normal ml-1">{characters?.length ?? 0}명</span></h2><div className="flex gap-2"><Button size="sm" variant="outline" loading={checkLoading} onClick={checkConflicts}><ShieldAlert size={14} />설정 충돌 체크</Button><Button size="sm" onClick={openCreate}><Plus size={14} />캐릭터 추가</Button></div></div>
    {conflicts !== null && <Card className="border-amber-200 bg-amber-50"><div className="flex items-start gap-2"><ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" /><div className="flex-1"><p className="text-sm font-semibold text-amber-800 mb-2">설정 충돌 점검 결과</p>{conflicts.length === 0 ? <p className="text-sm text-amber-700">현재 입력된 설정에서 확인할 충돌이 없습니다.</p> : <ul className="space-y-1">{conflicts.map((item) => <li key={item} className="text-sm text-amber-700">• {item}</li>)}</ul>}</div><button type="button" aria-label="점검 결과 닫기" onClick={() => setConflicts(null)} className="text-amber-500 hover:text-amber-700"><X size={14} /></button></div></Card>}
    {isLoading ? <SkeletonList count={3} /> : !characters?.length ? <EmptyState title="등록된 캐릭터가 없습니다" description="첫 번째 캐릭터의 설정과 참고 이미지를 등록해보세요" action={<Button size="sm" onClick={openCreate}><Plus size={14} />캐릭터 추가</Button>} /> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{characters.map((char) => <CharacterCard key={char.id} char={char} onEdit={() => { setEditChar(char); setModalOpen(true); }} onDelete={() => setDeleteId(char.id)} />)}</div>}
    <CharacterModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId!} character={editChar} />
    <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="캐릭터 삭제" message="이 캐릭터를 삭제하시겠습니까?" loading={deleteMutation.isPending} />
  </div>;
}
