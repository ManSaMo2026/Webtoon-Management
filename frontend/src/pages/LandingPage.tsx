import { Link } from "react-router";
import {
  ArrowRight, BookOpen, CalendarClock, Check, Sparkles, PenTool,
} from "lucide-react";
import { PublicHeader, Brand } from "../components/layout/PublicHeader";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import webtoonWorkspace from "../assets/webtoon-workspace.png";

const coreFeatures = [
  {
    number: "01",
    icon: BookOpen,
    title: "창작 자료 통합 관리",
    text: "스토리, 캐릭터, 세계관과 회차 정보를 작품별로 연결해 관리합니다.",
  },
  {
    number: "02",
    icon: CalendarClock,
    title: "일정 리스크 예측",
    text: "작업량과 가용 시간을 바탕으로 마감 가능성과 주요 위험 요인을 보여줍니다.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "AI 창작 보조",
    text: "그림을 대신 만드는 것이 아니라 스토리 구조, 장면 구성과 설정 정리를 돕습니다.",
  },
];

export function LandingPage() {
  const { user } = useAuth();
  const startPath = user ? "/projects" : "/signup";

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />
      <main>
        <section id="about" className="relative overflow-hidden border-b border-border bg-bg">
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#18181b_1px,transparent_1px)] [background-size:18px_18px]" />
          <div aria-hidden="true" className="absolute -right-24 top-24 h-72 w-72 rounded-full border-[46px] border-primary/5" />
          <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pt-20 lg:pb-20 lg:pt-24">
            <div className="grid items-end gap-8 lg:grid-cols-[1.16fr_0.84fr] lg:gap-16">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-sm"><PenTool size={13} />WEBTOON CREATOR'S WORKSPACE</span>
                  <span className="hidden text-xs font-bold tracking-[0.16em] text-text-muted sm:inline">EP. 01</span>
                </div>
                <h1 className="text-[clamp(2.65rem,5.5vw,5rem)] font-bold leading-[1.12] tracking-[-0.04em] text-text">
                  웹툰 작업은 선명하게,<br /><span className="relative inline-block text-primary"><span className="relative z-10">마감은 예측 가능하게.</span><span aria-hidden="true" className="absolute inset-x-0 bottom-[0.08em] h-[0.18em] -rotate-1 bg-primary/14" /></span>
                </h1>
              </div>

              <div className="pb-1 lg:pb-2">
                <p className="text-[1.0625rem] leading-[1.75] tracking-[-0.01em] text-text-body">
                  작품 설정과 회차별 작업을 한곳에 정리하고,<br className="hidden xl:block" />
                  작업 데이터를 바탕으로 마감 위험을 미리 확인하세요.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to={startPath}>
                    <Button size="lg">
                      {user ? "내 프로젝트 보기" : "무료로 시작하기"}<ArrowRight size={17} />
                    </Button>
                  </Link>
                  <a href="#features"><Button size="lg" variant="outline" className="bg-white">핵심 기능 보기</Button></a>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-text-muted">
                  <Check size={15} className="text-primary" />AI는 이미지 생성이 아닌 기획 보조에 활용됩니다.
                </p>
              </div>
            </div>

            <figure className="relative mt-12 rounded-[1.4rem] border-[5px] border-text bg-text p-1.5 shadow-[10px_10px_0_0_rgba(79,70,229,0.16)] sm:p-2">
              <div className="relative overflow-hidden rounded-[0.9rem] bg-white">
                <img
                  src={webtoonWorkspace}
                  alt="태블릿으로 웹툰을 그리고 캘린더와 체크리스트로 제작 일정을 관리하는 작가"
                  className="aspect-[16/8] w-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-text/30 via-transparent to-white/5" />

                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border-2 border-text bg-white px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-text shadow-[3px_3px_0_0_#18181b] sm:left-6 sm:top-6 sm:text-xs">
                  ORIGINAL PROJECT <span className="text-primary">#01</span>
                </div>

                <div className="absolute right-[8%] top-[14%] hidden rounded-[50%] border-[3px] border-text bg-white px-5 py-3 text-sm font-bold text-text shadow-[4px_4px_0_0_#4f46e5] after:absolute after:-bottom-3 after:left-7 after:h-5 after:w-5 after:rotate-45 after:border-b-[3px] after:border-r-[3px] after:border-text after:bg-white md:block">
                  이번 화 콘티 완료!
                </div>

                <div className="absolute bottom-[10%] left-[7%] hidden -rotate-2 rounded-lg border-[3px] border-text bg-primary px-5 py-3 text-sm font-black text-white shadow-[5px_5px_0_0_#18181b] sm:block">
                  마감까지 D-5
                </div>

                <figcaption className="absolute bottom-3 right-3 border-l-4 border-primary bg-white/95 px-3 py-2 text-right shadow-md backdrop-blur-sm sm:bottom-6 sm:right-6 sm:px-5 sm:py-3">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-primary sm:text-xs">CREATE · PLAN · FINISH</p>
                  <p className="mt-0.5 text-sm font-black tracking-[-0.02em] text-text sm:text-lg">이야기와 마감을 한 컷에</p>
                </figcaption>
              </div>
            </figure>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                ["CUT 01", "작품 정보와 설정"],
                ["CUT 02", "작업 일정과 리스크"],
                ["CUT 03", "스토리와 장면 보조"],
              ].map(([label, text], index) => (
                <div key={label} className="relative flex items-center gap-4 overflow-hidden border-2 border-text bg-white px-4 py-4 shadow-[3px_3px_0_0_#18181b]">
                  <span className="text-xs font-black tracking-[0.1em] text-primary">{label}</span>
                  <span className="text-sm font-semibold text-text-body">{text}</span>
                  <span aria-hidden="true" className="absolute -right-2 -top-4 text-6xl font-black text-primary/[0.04]">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-sidebar text-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-sm font-semibold text-sidebar-primary">CORE FEATURES</p>
                <h2 className="mt-5 text-[clamp(2rem,3.5vw,3.4rem)] font-bold leading-[1.25] tracking-[-0.03em]">
                  창작의 흐름을<br />놓치지 않도록
                </h2>
                <p className="mt-5 max-w-sm text-base leading-7 text-sidebar-foreground">
                  웹툰 제작에 꼭 필요한 관리와 예측 기능만 하나의 작업 공간에 담았습니다.
                </p>
              </div>

              <div className="border-t border-white/15">
                {coreFeatures.map(({ number, icon: Icon, title, text }) => (
                  <article key={number} className="grid gap-5 border-b border-white/15 py-8 sm:grid-cols-[3rem_3rem_1fr] sm:items-start sm:gap-6 lg:py-10">
                    <span className="text-sm font-semibold text-sidebar-primary">{number}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sidebar-primary">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold tracking-[-0.02em] text-white">{title}</h3>
                      <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-sidebar-foreground">{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/15 pt-9 md:flex-row md:items-center">
              <div>
                <p className="text-xl font-bold">첫 웹툰 프로젝트를 시작해보세요.</p>
                <p className="mt-2 text-sm text-sidebar-foreground">창작 정보부터 마감 관리까지 한곳에서 이어집니다.</p>
              </div>
              <Link to={startPath}>
                <Button size="lg" variant="inverted">
                  {user ? "프로젝트로 이동" : "무료 회원가입"}<ArrowRight size={17} />
                </Button>
              </Link>
            </div>
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
