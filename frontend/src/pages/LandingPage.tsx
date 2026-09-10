import { Link } from "react-router";
import {
  ArrowRight, BarChart3, BookOpenCheck, CalendarDays,
  Check, ClipboardCheck, FolderKanban, PenTool,
} from "lucide-react";
import { PublicHeader, Brand } from "../components/layout/PublicHeader";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import webtoonWorkspace from "../assets/webtoon-workspace.png";

const features = [
  { icon: FolderKanban, title: "작품 자료를 한곳에", text: "스토리, 캐릭터, 세계관과 장면 자료를 작품별로 정리하세요." },
  { icon: CalendarDays, title: "제작 일정을 한눈에", text: "회차별 할 일과 마감일을 확인하고 작업 순서를 놓치지 마세요." },
  { icon: BarChart3, title: "마감 위험을 미리", text: "남은 작업량과 시간을 바탕으로 일정 위험도를 빠르게 확인하세요." },
];

const steps = [
  { icon: PenTool, title: "작품 등록", text: "연재할 작품과 기본 정보를 등록합니다." },
  { icon: BookOpenCheck, title: "창작 정보 정리", text: "스토리와 인물, 회차별 작업을 채웁니다." },
  { icon: ClipboardCheck, title: "진행 상황 확인", text: "대시보드에서 일정과 위험도를 확인합니다." },
];

export function LandingPage() {
  const { user } = useAuth();
  const startPath = user ? "/projects" : "/signup";

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />
      <main>
        <section id="about" className="overflow-hidden border-b border-border bg-bg">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-20">
            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold text-primary">웹툰 창작자를 위한 작업 관리 서비스</p>
              <h1 className="text-[clamp(2.25rem,4vw,3.25rem)] font-bold leading-[1.3] tracking-[-0.02em] text-text">
                웹툰 작업과 마감,<br />이제 한곳에서 관리하세요
              </h1>
              <p className="mt-6 text-[1.0625rem] leading-[1.7] tracking-[-0.01em] text-text-body">
                작품 설정부터 회차별 일정까지 흩어진 창작 정보를 정리하고,<br className="hidden sm:block" /> 마감 위험을 미리 확인하는 웹툰 프로젝트 관리 서비스입니다.
              </p>
              <ul className="mt-6 space-y-2.5 text-[0.9375rem] leading-[1.6] text-text-body sm:text-base">
                {["작품 설정과 캐릭터 자료 정리", "회차별 일정과 작업 진행률 관리", "마감 일정 위험도 확인"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-primary/60"><Check size={13} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={startPath}>
                  <Button size="lg">
                    {user ? "내 프로젝트 보기" : "무료로 시작하기"}<ArrowRight size={17} />
                  </Button>
                </Link>
                <a href="#features"><Button size="lg" variant="outline" className="bg-white">기능 살펴보기</Button></a>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-xl">
                <img
                  src={webtoonWorkspace}
                  alt="태블릿으로 웹툰을 그리고 달력과 작업 목록으로 마감을 관리하는 작가"
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 left-5 flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-lg sm:left-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary"><CalendarDays size={18} /></span>
                <div><p className="text-xs text-text-muted">웹툰 제작 일정</p><p className="text-sm font-bold text-text">작업과 마감을 한눈에</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">웹툰메이커가 필요한 이유</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">창작에 집중할 수 있도록<br />관리는 더 간단하게</h2>
              <p className="mt-4 text-sm leading-6 text-text-body">메모, 문서, 캘린더에 나뉜 작업 정보를 하나의 프로젝트로 관리할 수 있습니다.</p>
            </div>
            <div className="mt-10 grid border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="border-b border-border px-1 py-7 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0">
                  <Icon size={24} className="text-primary" />
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-body">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-muted/60 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-primary">이용 방법</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">처음이어도 어렵지 않습니다</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="rounded-xl border border-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Icon size={20} /></span>
                    <span className="text-xs font-bold text-text-muted/50">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-body">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 rounded-2xl bg-sidebar px-6 py-10 text-center sm:px-10 md:flex-row md:text-left">
            <div><h2 className="text-2xl font-bold text-white">내 웹툰 프로젝트를 시작해보세요</h2><p className="mt-2 text-sm text-sidebar-foreground">작품 기록부터 마감 관리까지 한 번에 정리할 수 있습니다.</p></div>
            <Link to={startPath}><Button size="lg" className="shrink-0 bg-white text-primary hover:bg-accent">{user ? "내 프로젝트 보기" : "무료로 시작하기"}<ArrowRight size={17} /></Button></Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Brand />
          <p className="text-xs text-text-muted">웹툰 창작과 일정 관리를 위한 프로젝트 관리 서비스</p>
        </div>
      </footer>
    </div>
  );
}
