import { Link } from "react-router";
import { ArrowRight, BookOpen, Clock3, Network, UserRound } from "lucide-react";
import { PublicHeader, Brand } from "../components/layout/PublicHeader";
import { useAuth } from "../contexts/AuthContext";
import heroProductShowcaseImage from "../assets/landing/hero-product-showcase.png";
import "../styles/hero-landing.css";

const features = [
  { icon: BookOpen, title: "작품 관리", description: "여러 작품의 연재 현황을 한눈에" },
  { icon: UserRound, title: "캐릭터 설계", description: "AI와 대화하며 입체적인 캐릭터 구축" },
  { icon: Network, title: "인물관계도", description: "캐릭터 관계를 시각적으로 연결" },
  { icon: Clock3, title: "마감 진단", description: "작업 조건을 바탕으로 일정 위험 확인" },
];

export function LandingPage() {
  const { user } = useAuth();
  const projectPath = user ? "/projects" : "/signup";

  return (
    <div className="identity-landing">
      <a className="identity-skip-link" href="#main-content">본문으로 바로가기</a>
      <PublicHeader />
      <main id="main-content">
        <section id="about" className="identity-hero">
          <div className="identity-hero-orb identity-hero-orb-one" aria-hidden="true" />
          <div className="identity-hero-orb identity-hero-orb-two" aria-hidden="true" />
          <div className="identity-container hero-layout">
            <div className="identity-copy">
              <p className="identity-overline">웹툰 창작자를 위한 제작 관리 도구</p>
              <h1>웹툰 기획부터<br />마감까지, <span>한곳에서</span></h1>
              <p className="identity-subhead">작품과 캐릭터 설정을 정리하고, 인물관계를 설계하세요.<br />작업 조건을 입력하면 이번 화의 마감 가능성과 위험 요인도 확인할 수 있어요.</p>
              <div className="identity-actions">
                <Link to={projectPath} className="identity-primary-action">{user ? "내 프로젝트 이어가기" : "무료로 프로젝트 만들기"}<ArrowRight size={19} aria-hidden="true" /></Link>
              </div>
              <p className="identity-note">그림을 대신 만드는 AI가 아니라, 창작 과정과 일정 관리를 돕습니다.</p>
            </div>

            <div id="product-preview" className="product-showcase" aria-label="만사모 실제 서비스 화면 미리보기">
              <img
                className="product-showcase-image"
                src={heroProductShowcaseImage}
                alt="작품 연재 현황, AI 캐릭터 상담, 인물관계도, 마감 가능성 진단을 한눈에 보여주는 만사모 서비스 화면"
              />
            </div>
          </div>

          <div id="features" className="identity-container identity-feature-strip" aria-label="만사모 핵심 기능">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span className="identity-feature-icon"><Icon size={23} aria-hidden="true" /></span>
                <div><h2>{title}</h2><p>{description}</p></div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="identity-footer"><div className="identity-container"><Brand /><div className="identity-footer-meta"><p>웹툰 창작과 일정 관리를 위한 프로젝트 관리 서비스</p><nav aria-label="정책"><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보처리방침</Link></nav></div></div></footer>
    </div>
  );
}
