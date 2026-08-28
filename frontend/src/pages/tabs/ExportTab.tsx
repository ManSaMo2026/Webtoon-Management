import { useState } from "react";
import { useOutletContext, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, Eye } from "lucide-react";
import { storyApi } from "../../api/story";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { Project } from "../../types";

const EXPORT_SECTIONS = [
  { key: "overview", label: "프로젝트 개요" },
  { key: "acts", label: "3막 구조" },
  { key: "episodes", label: "회차 목록" },
  { key: "characters", label: "캐릭터 설정" },
  { key: "foreshadows", label: "복선 관리" },
  { key: "schedule", label: "일정 리스크 요약" },
];

export function ExportTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const { id: projectId } = useParams<{ id: string }>();
  const [selected, setSelected] = useState<Set<string>>(new Set(EXPORT_SECTIONS.map(s => s.key)));
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: episodes } = useQuery({ queryKey: ["episodes", projectId], queryFn: () => storyApi.getEpisodes(projectId!) });
  const { data: acts } = useQuery({ queryKey: ["acts", projectId], queryFn: () => storyApi.getActs(projectId!) });

  const toggle = (key: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const handleExport = async () => {
    setExporting(true);
    await new Promise<void>((r) => setTimeout(r, 1500));
    setExporting(false);
    toast.success("PDF 생성이 완료되었습니다. (데모 — 실제 파일은 생성되지 않습니다)");
  };

  const previewText = `
# ${project.title}

## 프로젝트 개요
- 장르: ${project.genre}
- 연재 주기: ${project.cadence}
- 목표 회차: ${project.totalEpisodes}화
- 현재 진행: ${project.currentEpisode}화
- 로그라인: ${project.logline}

${selected.has("acts") && acts ? `## 3막 구조\n\n### 1막\n${acts.act1}\n\n### 2막\n${acts.act2}\n\n### 3막\n${acts.act3}` : ""}

${selected.has("episodes") && episodes?.length ? `## 회차 목록\n${episodes.sort((a, b) => a.number - b.number).map(ep => `- ${ep.number}화: ${ep.summary || "(미작성)"} [${ep.purpose}]`).join("\n")}` : ""}
  `.trim();

  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>내보낼 항목 선택</CardTitle>
          <button onClick={() => setSelected(new Set(EXPORT_SECTIONS.map(s => s.key)))}
            className="text-xs text-primary hover:underline">전체 선택</button>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3">
          {EXPORT_SECTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => toggle(key)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setPreviewing(p => !p)}>
          <Eye size={15} />{previewing ? "미리보기 닫기" : "미리보기"}
        </Button>
        <Button loading={exporting} onClick={handleExport} disabled={selected.size === 0}>
          <FileDown size={15} />PDF 생성
        </Button>
      </div>

      {previewing && (
        <Card className="bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">미리보기</p>
          <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {previewText}
          </pre>
        </Card>
      )}
    </div>
  );
}
