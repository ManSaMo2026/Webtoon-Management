import { useState } from "react";
import { useOutletContext, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Film, Plus, X, Sparkles } from "lucide-react";
import { scenesApi } from "../../api/scenes";
import { storyApi } from "../../api/story";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/FormField";
import { SkeletonCard } from "../../components/ui/Skeleton";
import type { Project, SceneRequest, SceneResult } from "../../types";

export function ScenesTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const { id: projectId } = useParams<{ id: string }>();

  const [form, setForm] = useState<Omit<SceneRequest, "projectId">>({
    episodeNumber: 1,
    purpose: "중요 대화",
    emotionKeywords: [],
    characters: [],
    location: "",
    timeOfDay: "낮",
    tone: "긴장감",
  });
  const [kwInput, setKwInput] = useState("");
  const [charInput, setCharInput] = useState("");
  const [result, setResult] = useState<SceneResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: episodes } = useQuery({
    queryKey: ["episodes", projectId],
    queryFn: () => storyApi.getEpisodes(projectId!),
    enabled: !!projectId,
  });

  const { data: characters } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => import("../../api/characters").then(m => m.charactersApi.list(projectId!)),
    enabled: !!projectId,
  });

  const addTag = (field: "emotionKeywords" | "characters", input: string, setInput: (v: string) => void) => {
    const val = input.trim();
    if (val && !form[field].includes(val)) {
      setForm(f => ({ ...f, [field]: [...f[field], val] }));
    }
    setInput("");
  };

  const removeTag = (field: "emotionKeywords" | "characters", val: string) => {
    setForm(f => ({ ...f, [field]: f[field].filter(v => v !== val) }));
  };

  const generate = async () => {
    if (!form.location) { toast.error("장소를 입력해주세요."); return; }
    setLoading(true);
    try {
      const res = await scenesApi.generate({ ...form, projectId: projectId! });
      setResult(res);
    } catch {
      toast.error("장면 설계 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>장면 설계 입력</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="회차 선택" value={form.episodeNumber}
              onChange={(e) => setForm(f => ({ ...f, episodeNumber: Number(e.target.value) }))}>
              {episodes?.map(ep => <option key={ep.id} value={ep.number}>{ep.number}화</option>)}
              {!episodes?.length && <option value={1}>1화</option>}
            </Select>
            <Input label="장면 목적" value={form.purpose}
              onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
              placeholder="중요 대화, 액션씬..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="시간대" value={form.timeOfDay}
              onChange={(e) => setForm(f => ({ ...f, timeOfDay: e.target.value }))}>
              {["새벽", "아침", "낮", "저녁", "밤"].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="톤" value={form.tone}
              onChange={(e) => setForm(f => ({ ...f, tone: e.target.value }))}
              placeholder="긴장감, 따뜻함, 유머..." />
          </div>

          <Input label="장소" required value={form.location}
            onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="왕궁 지하 감옥, 편의점 앞..." />

          {/* Emotion keywords */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">감정 키워드</label>
            <div className="flex gap-2 mb-2">
              <input value={kwInput} onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag("emotionKeywords", kwInput, setKwInput)}
                placeholder="키워드 입력 후 Enter"
                className="flex-1 text-sm rounded-md border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button size="sm" variant="outline" onClick={() => addTag("emotionKeywords", kwInput, setKwInput)}>추가</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.emotionKeywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                  {kw}<button onClick={() => removeTag("emotionKeywords", kw)} className="hover:text-destructive"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Characters */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">등장인물</label>
            <div className="flex gap-2 mb-2">
              <select
                className="flex-1 text-sm rounded-md border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                value={charInput} onChange={(e) => setCharInput(e.target.value)}
              >
                <option value="">캐릭터 선택</option>
                {characters?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => charInput && addTag("characters", charInput, setCharInput)}>추가</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.characters.map(c => (
                <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-xs font-medium">
                  {c}<button onClick={() => removeTag("characters", c)} className="hover:text-destructive"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          <Button className="w-full" loading={loading} onClick={generate}>
            <Sparkles size={15} />장면 설계 생성
          </Button>
        </div>
      </Card>

      {/* Result */}
      <div className="space-y-4">
        {loading && <SkeletonCard lines={5} />}
        {!loading && !result && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Film size={32} className="text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">장면 설계를 생성하면 결과가 여기에 표시됩니다.</p>
          </Card>
        )}
        {!loading && result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>컷 구성 ({result.cuts.length}컷)</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {result.cuts.map(cut => (
                  <div key={cut.number} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="font-mono text-xs font-bold text-muted-foreground w-6 shrink-0 pt-0.5">{cut.number}</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{cut.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{cut.viewpoint}</span>
                        <span className="text-xs text-primary">/ {cut.emotion}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader><CardTitle>연출 가이드</CardTitle></CardHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">시점 추천</p>
                  <p className="text-foreground">{result.viewpointRecommendation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">감정 포인트</p>
                  <p className="text-foreground">{result.emotionPoint}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">엔딩 훅 제안 (3안)</p>
                  <ul className="space-y-1">
                    {result.endingHooks.map((hook, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <span className="text-foreground">{hook}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
