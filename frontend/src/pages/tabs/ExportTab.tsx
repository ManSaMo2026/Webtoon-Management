import { useRef, useState, type ReactNode } from "react";
import { useOutletContext, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, FileDown } from "lucide-react";
import { charactersApi } from "../../api/characters";
import { scheduleApi } from "../../api/schedule";
import { storyApi } from "../../api/story";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { Project, RiskFactor } from "../../types";
import { getProjectGenreLabel, getProjectStatusLabel } from "../../utils/project";

const EXPORT_SECTIONS = [
  { key: "overview", label: "프로젝트 개요" },
  { key: "acts", label: "3막 구조" },
  { key: "episodes", label: "회차 목록" },
  { key: "characters", label: "캐릭터 설정" },
  { key: "foreshadows", label: "복선 관리" },
  { key: "schedule", label: "일정 리스크 요약" },
] as const;

type ExportSectionKey = (typeof EXPORT_SECTIONS)[number]["key"];

function PdfBlock({ title, children }: { title: string; children: ReactNode }) {
  return <section data-pdf-block className="border-t-4 border-primary bg-white px-10 py-8"><h2 className="mb-5 text-xl font-bold text-text">{title}</h2>{children}</section>;
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-muted px-4 py-5 text-sm text-text-muted">{children}</p>;
}

function formatDate(value?: string) {
  if (!value) return "미정";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "미정" : date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "만사모_프로젝트";
}

function riskLabel(severity: RiskFactor["severity"]) {
  return severity === "high" ? "높음" : severity === "medium" ? "보통" : "낮음";
}

async function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"));
  await Promise.race([
    Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    }))),
    new Promise<void>((resolve) => window.setTimeout(resolve, 5000)),
  ]);
}

export function ExportTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const { id: projectId } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<ExportSectionKey>>(new Set(EXPORT_SECTIONS.map((section) => section.key)));
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: episodes = [], isLoading: episodesLoading } = useQuery({ queryKey: ["episodes", projectId], queryFn: () => storyApi.getEpisodes(projectId!), enabled: !!projectId });
  const { data: acts, isLoading: actsLoading } = useQuery({ queryKey: ["acts", projectId], queryFn: () => storyApi.getActs(projectId!), enabled: !!projectId });
  const { data: characters = [], isLoading: charactersLoading } = useQuery({ queryKey: ["characters", projectId], queryFn: () => charactersApi.list(projectId!), enabled: !!projectId });
  const { data: foreshadows = [], isLoading: foreshadowsLoading } = useQuery({ queryKey: ["foreshadows", projectId], queryFn: () => storyApi.getForeshadows(projectId!), enabled: !!projectId });

  const calculatedDeadlineDays = Math.ceil((new Date(project.nextDeadline).getTime() - Date.now()) / 86_400_000);
  const deadlineDays = Number.isFinite(calculatedDeadlineDays) ? Math.max(1, calculatedDeadlineDays) : 7;
  const schedule = scheduleApi.calculateSync({ cuts: project.avgCuts, weeklyHours: project.weeklyHours, colorMode: project.colorMode, bgComplexity: project.bgComplexity, hasAssistant: project.hasAssistant, deadlineDays });
  const isDataLoading = episodesLoading || actsLoading || charactersLoading || foreshadowsLoading;

  const toggle = (key: ExportSectionKey) => setSelected((previous) => {
    const next = new Set(previous);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const handleExport = async () => {
    const report = reportRef.current;
    if (!report || selected.size === 0) return;
    setExporting(true);
    try {
      await document.fonts?.ready;
      await waitForImages(report);
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const blocks = Array.from(report.querySelectorAll<HTMLElement>("[data-pdf-block]"));
      let cursorY = margin;
      let hasContent = false;

      for (const block of blocks) {
        const canvas = await html2canvas(block, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (clonedDocument) => clonedDocument.documentElement.classList.remove("dark"),
        });
        const blockHeight = canvas.height * contentWidth / canvas.width;
        if (blockHeight <= contentHeight) {
          if (hasContent && cursorY + blockHeight > pageHeight - margin) {
            pdf.addPage();
            cursorY = margin;
          }
          pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", margin, cursorY, contentWidth, blockHeight, undefined, "FAST");
          cursorY += blockHeight + 4;
          hasContent = true;
          continue;
        }

        const pageSliceHeight = Math.floor(canvas.width * contentHeight / contentWidth);
        let sourceY = 0;
        while (sourceY < canvas.height) {
          if (hasContent) pdf.addPage();
          const sliceHeight = Math.min(pageSliceHeight, canvas.height - sourceY);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceHeight;
          slice.getContext("2d")?.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const renderedHeight = sliceHeight * contentWidth / canvas.width;
          pdf.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", margin, margin, contentWidth, renderedHeight, undefined, "FAST");
          sourceY += sliceHeight;
          cursorY = margin + renderedHeight + 4;
          hasContent = true;
        }
      }

      pdf.save(`${safeFileName(project.title)}_기획자료.pdf`);
      toast.success("PDF 파일을 내려받았습니다.");
    } catch (error) {
      console.error(error);
      toast.error("PDF를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Card>
        <CardHeader>
          <div><CardTitle>PDF 내보내기</CardTitle><p className="mt-1 text-xs leading-5 text-text-muted">팀 공유나 기획 검토에 필요한 항목만 골라 하나의 문서로 저장합니다.</p></div>
          <button type="button" onClick={() => setSelected(new Set(EXPORT_SECTIONS.map((section) => section.key)))} className="text-xs font-semibold text-primary hover:underline">전체 선택</button>
        </CardHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {EXPORT_SECTIONS.map(({ key, label }) => <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"><input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} className="h-4 w-4 accent-primary" /><span className="text-sm font-medium text-text">{label}</span></label>)}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setPreviewing((value) => !value)} disabled={selected.size === 0}><Eye size={15} />{previewing ? "미리보기 닫기" : "미리보기"}</Button>
        <Button loading={exporting} onClick={handleExport} disabled={selected.size === 0 || isDataLoading}><FileDown size={15} />{isDataLoading ? "자료 불러오는 중" : "PDF 생성"}</Button>
      </div>

      {previewing && <p className="text-xs text-text-muted">아래 내용과 선택한 항목이 PDF에 같은 순서로 포함됩니다.</p>}
      <div className={previewing ? "overflow-x-auto rounded-xl border border-border bg-muted/30 p-3" : "pointer-events-none fixed left-[-10000px] top-0"} aria-hidden={!previewing}>
        <div ref={reportRef} className="overflow-hidden bg-white text-text" style={{ width: 794 }}>
          <header data-pdf-block className="bg-primary px-10 py-10 text-white">
            <p className="text-xs font-bold tracking-[0.16em]" style={{ color: "#e0e7ff" }}>만사모 · 웹툰 프로젝트 기획 자료</p>
            <div className="mt-5 flex items-start gap-6">{project.coverImageUrl && <img src={project.coverImageUrl} alt="" className="h-32 w-24 shrink-0 rounded-md border border-white object-cover" />}<div className="min-w-0"><h1 className="break-words text-3xl font-bold leading-tight">{project.title}</h1><p className="mt-3 text-sm leading-6 text-white">{project.logline || "로그라인이 아직 작성되지 않았습니다."}</p><p className="mt-5 text-xs" style={{ color: "#c7d2fe" }}>생성일 {new Date().toLocaleDateString("ko-KR")}</p></div></div>
          </header>

          {selected.has("overview") && <PdfBlock title="프로젝트 개요"><div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">{[["장르", getProjectGenreLabel(project)], ["연재 플랫폼", project.platform || "미정"], ["연재 상태", getProjectStatusLabel(project)], ["연재 주기", project.cadence], ["목표 회차", `${project.totalEpisodes}화`], ["현재 진행", `${project.currentEpisode}화`], ["다음 마감일", formatDate(project.nextDeadline)], ["최종 완결일", formatDate(project.completionDate)], ["회차당 평균 컷", `${project.avgCuts}컷`]].map(([label, value]) => <div key={label} className="border-b border-border pb-3"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 font-semibold text-text">{value}</p></div>)}</div>{!!project.tags?.length && <div className="mt-5 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-primary">#{tag}</span>)}</div>}{project.conflict && <div className="mt-6 rounded-lg bg-muted p-4"><p className="text-xs font-bold text-text-muted">핵심 갈등</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">{project.conflict}</p></div>}</PdfBlock>}

          {selected.has("acts") && <PdfBlock title="3막 구조">{acts ? <div className="space-y-4">{[["1막 · 설정", acts.act1], ["2막 · 전개", acts.act2], ["3막 · 결말", acts.act3]].map(([label, value]) => <div key={label} className="rounded-lg border border-border p-4"><h3 className="text-sm font-bold text-primary">{label}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-body">{value || "미작성"}</p></div>)}</div> : <EmptyText>저장된 3막 구조가 없습니다.</EmptyText>}</PdfBlock>}

          {selected.has("episodes") && <PdfBlock title="회차 목록">{episodes.length ? <div className="space-y-3">{[...episodes].sort((a, b) => a.number - b.number).map((episode) => <div key={episode.id} className="border-b border-border pb-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-text">{episode.number}화</h3><span className="rounded bg-muted px-2 py-1 text-xs text-text-muted">{episode.purpose}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-body">{episode.summary || "줄거리 미작성"}</p>{episode.hook && <p className="mt-1 text-xs text-primary">후킹 포인트 · {episode.hook}</p>}</div>)}</div> : <EmptyText>저장된 회차가 없습니다.</EmptyText>}</PdfBlock>}

          {selected.has("characters") && <PdfBlock title="캐릭터 설정">{characters.length ? <div className="grid grid-cols-2 gap-4">{characters.map((character) => <article key={character.id} className="rounded-lg border border-border p-4"><div className="flex items-center gap-3">{character.imageUrl ? <img src={character.imageUrl} alt="" className="h-14 w-14 rounded-md object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-md bg-secondary text-lg font-bold text-primary">{character.name.charAt(0)}</span>}<div><h3 className="font-bold text-text">{character.name}</h3><p className="mt-1 text-xs text-text-muted">{character.roleGroup || "기타"} · {character.role || "역할 미정"}</p></div></div><div className="mt-3 space-y-1 text-xs leading-5 text-text-body"><p><strong>성격</strong> · {character.personality || "미작성"}</p><p><strong>목표</strong> · {character.goal || "미작성"}</p><p><strong>비밀</strong> · {character.secret || "미작성"}</p></div></article>)}</div> : <EmptyText>저장된 캐릭터가 없습니다.</EmptyText>}</PdfBlock>}

          {selected.has("foreshadows") && <PdfBlock title="복선 관리">{foreshadows.length ? <div className="space-y-3">{foreshadows.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-5 border-b border-border pb-3"><div><p className="text-sm font-semibold text-text">{item.content}</p><p className="mt-1 text-xs text-text-muted">등장 {item.appearEp}화 · 회수 {item.resolveEp ? `${item.resolveEp}화` : "미정"}{item.keyword ? ` · #${item.keyword}` : ""}</p></div><span className="h-fit rounded bg-muted px-2 py-1 text-xs font-semibold text-text-body">{item.status}</span></div>)}</div> : <EmptyText>저장된 복선이 없습니다.</EmptyText>}</PdfBlock>}

          {selected.has("schedule") && <PdfBlock title="일정 리스크 요약"><div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-lg bg-secondary p-4"><p className="text-xs text-text-muted">마감 가능성 참고값</p><p className="mt-2 text-2xl font-bold text-primary">{schedule.successRate}%</p></div><div className="rounded-lg bg-muted p-4"><p className="text-xs text-text-muted">예상 필요 시간</p><p className="mt-2 text-xl font-bold text-text">{schedule.requiredHours}시간</p></div><div className="rounded-lg bg-muted p-4"><p className="text-xs text-text-muted">확보 가능 시간</p><p className="mt-2 text-xl font-bold text-text">{schedule.availableHours}시간</p></div></div><div className="mt-5 space-y-3">{schedule.riskFactors.map((factor) => <div key={factor.label} className="rounded-lg border border-border p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-text">{factor.label}</h3><span className="text-xs font-semibold text-text-muted">위험도 {riskLabel(factor.severity)}</span></div><p className="mt-2 text-sm leading-6 text-text-body">{factor.detail}</p></div>)}</div><p className="mt-5 rounded-lg bg-muted p-4 text-sm leading-6 text-text-body">{schedule.recommendation}</p><p className="mt-3 text-xs text-text-muted">입력한 작업 조건을 바탕으로 계산한 참고값이며 실제 작업 결과를 보장하지 않습니다.</p></PdfBlock>}

          <footer data-pdf-block className="border-t border-border bg-muted px-10 py-5 text-xs text-text-muted">만사모에서 생성한 프로젝트 기획 자료입니다.</footer>
        </div>
      </div>
    </div>
  );
}
