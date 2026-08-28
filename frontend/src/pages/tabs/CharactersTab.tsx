import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ShieldAlert, X } from "lucide-react";
import { charactersApi } from "../../api/characters";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea } from "../../components/ui/FormField";
import { SkeletonList, EmptyState } from "../../components/ui/Skeleton";
import type { Character } from "../../types";

const EMPTY_CHAR: Omit<Character, "id"> = {
  projectId: "",
  name: "",
  role: "",
  personality: "",
  goal: "",
  speechStyle: "",
  taboo: "",
  secret: "",
  keywords: [],
};

function CharacterModal({
  open,
  onClose,
  projectId,
  character,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  character?: Character;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<Character, "id">>(
    character ? { ...character } : { ...EMPTY_CHAR, projectId }
  );
  const [kwInput, setKwInput] = useState("");

  /**
   * 카드 클릭으로 여러 캐릭터를 수정할 수 있게 되면서,
   * 선택된 캐릭터가 바뀔 때 모달 내부 form도 함께 갱신되도록 처리합니다.
   */
  useEffect(() => {
    if (!open) return;
    setForm(character ? { ...character } : { ...EMPTY_CHAR, projectId });
    setKwInput("");
  }, [open, character, projectId]);

  const mutation = useMutation({
    mutationFn: () =>
      character ? charactersApi.update(character.id, form) : charactersApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["characters", projectId] });
      toast.success(character ? "캐릭터가 수정되었습니다." : "캐릭터가 추가되었습니다.");
      onClose();
    },
    onError: () => toast.error("저장 실패"),
  });

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !form.keywords.includes(kw)) {
      setForm((f) => ({ ...f, keywords: [...f.keywords, kw] }));
      setKwInput("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={character ? "캐릭터 수정" : "캐릭터 추가"}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="이름"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 한서윤"
          />
          <Input
            label="역할"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="예: 주인공, 조력자, 라이벌, 악역"
          />
        </div>

        {/* 캐릭터 설정 충돌 체크에 사용될 수 있는 핵심 텍스트 정보 */}
        <Textarea
          label="성격"
          rows={2}
          value={form.personality}
          onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
          placeholder="예: 말수가 적지만 책임감이 강하고, 위기 상황에서는 먼저 행동함"
        />
        <Textarea
          label="목표"
          rows={2}
          value={form.goal}
          onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
          placeholder="예: 사라진 가족의 진실을 찾고 자신의 정체를 밝히는 것"
        />
        <Input
          label="말투/어투"
          value={form.speechStyle}
          onChange={(e) => setForm((f) => ({ ...f, speechStyle: e.target.value }))}
          placeholder="예: 짧고 단정한 문장 사용, 감정 표현을 잘 하지 않음"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="금기"
            value={form.taboo}
            onChange={(e) => setForm((f) => ({ ...f, taboo: e.target.value }))}
            placeholder="예: 가족 이야기, 배신, 과거 사건"
          />
          <Input
            label="비밀"
            value={form.secret}
            onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
            placeholder="예: 사실은 적 조직과 관련이 있음"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">키워드</label>
          <p className="text-xs text-muted-foreground mb-2">
            사전 정의된 키워드나 AI 제안 키워드를 넣을 수 있는 영역입니다. 현재는 직접 입력 방식으로 동작합니다.
          </p>
          <div className="flex gap-2 mb-2">
            <input
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="예: 냉정함, 죄책감, 복수, 성장"
              className="flex-1 text-sm rounded-md border border-border bg-input-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" variant="outline" onClick={addKeyword}>
              추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
              >
                {kw}
                <button
                  onClick={() =>
                    setForm((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }))
                  }
                  className="hover:text-destructive"
                  type="button"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CharacterCard({
  char,
  onEdit,
  onDelete,
}: {
  char: Character;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="group relative cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit();
      }}
      title="카드를 클릭하면 캐릭터 정보를 수정할 수 있습니다."
    >
      {/* 삭제 버튼만 별도로 동작하도록 이벤트 전파를 막습니다. */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-muted-foreground hover:text-destructive"
          aria-label="캐릭터 삭제"
          type="button"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {char.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{char.name}</h3>
          {char.role && <p className="text-xs text-muted-foreground">{char.role}</p>}
          <p className="text-[11px] text-muted-foreground mt-1">클릭하여 상세/수정</p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {char.personality && (
          <div>
            <span className="text-muted-foreground">성격 </span>
            <span>{char.personality}</span>
          </div>
        )}
        {char.goal && (
          <div>
            <span className="text-muted-foreground">목표 </span>
            <span>{char.goal}</span>
          </div>
        )}
        {char.taboo && (
          <div>
            <span className="text-muted-foreground">금기 </span>
            <span className="text-amber-600">{char.taboo}</span>
          </div>
        )}
      </div>

      {char.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
          {char.keywords.map((kw) => (
            <Badge key={kw} variant="neutral">
              {kw}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CharactersTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editChar, setEditChar] = useState<Character | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[] | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => charactersApi.list(projectId!),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: charactersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["characters", projectId] });
      toast.success("캐릭터가 삭제되었습니다.");
      setDeleteId(null);
    },
  });

  const checkConflicts = async () => {
    setCheckLoading(true);
    try {
      const result = await charactersApi.checkConflicts(projectId!);
      setConflicts(result);
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          캐릭터 <span className="text-muted-foreground font-normal ml-1">{characters?.length ?? 0}명</span>
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" loading={checkLoading} onClick={checkConflicts}>
            <ShieldAlert size={14} />설정 충돌 체크
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditChar(undefined);
              setModalOpen(true);
            }}
          >
            <Plus size={14} />캐릭터 추가
          </Button>
        </div>
      </div>

      {conflicts !== null && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 mb-2">설정 충돌 감지 결과</p>
              {conflicts.length === 0 ? (
                <p className="text-sm text-amber-700">충돌이 발견되지 않았습니다.</p>
              ) : (
                <ul className="space-y-1">
                  {conflicts.map((c, i) => (
                    <li key={i} className="text-sm text-amber-700">
                      • {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={() => setConflicts(null)} className="text-amber-500 hover:text-amber-700">
              <X size={14} />
            </button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : !characters?.length ? (
        <EmptyState
          title="등록된 캐릭터가 없습니다"
          description="첫 번째 캐릭터를 추가해보세요"
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditChar(undefined);
                setModalOpen(true);
              }}
            >
              <Plus size={14} />캐릭터 추가
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              char={char}
              onEdit={() => {
                setEditChar(char);
                setModalOpen(true);
              }}
              onDelete={() => setDeleteId(char.id)}
            />
          ))}
        </div>
      )}

      <CharacterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId!}
        character={editChar}
      />
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="캐릭터 삭제"
        message="이 캐릭터를 삭제하시겠습니까?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
