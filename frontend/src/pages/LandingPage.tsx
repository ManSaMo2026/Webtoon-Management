import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { PublicHeader, Brand } from "../components/layout/PublicHeader";
import { useAuth } from "../contexts/AuthContext";
import "../styles/hero-landing.css";

const workInputs = [
  ["회차당 컷 수", "60"],
  ["채색 방식", "풀컬러"],
  ["배경 복잡도", "보통"],
  ["주당 작업 가능 시간", "22시간"],
  ["어시스턴트", "없음"],
];

const features = [
  { title: "회차 · 일정 관리", description: "연재 주기와 회차별 진행 상태를 한곳에서 관리합니다." },
  { title: "마감 리스크 예측", description: "작업 데이터를 반복 계산해 완료 가능성을 확률로 보여줍니다." },
  { title: "설정 충돌 검사", description: "캐릭터 설정과 복선이 서로 어긋나는 지점을 찾아냅니다." },
];

export function LandingPage() {
  const { user } = useAuth();
  const projectPath = user ? "/projects" : "/login";

  return (
    <div className="identity-landing">
      <PublicHeader />
      <main>
        <section id="about" className="identity-hero">
          <div className="identity-container hero-layout">
            <div className="identity-copy">
              <p className="identity-overline">웹툰 연재 관리</p>
              <h1>이번 화,<br />마감 지킬 수 있을까?</h1>
              <p className="identity-subhead">작업량과 가능 시간을 입력하면<br />마감 성공 확률을 계산합니다.</p>
              <div className="identity-actions">
                <Link to={projectPath} className="identity-primary-action">내 프로젝트 보기<ArrowRight size={17} aria-hidden="true" /></Link>
                <a href="#features" className="identity-secondary-action">계산 방식 보기<ArrowRight size={15} aria-hidden="true" /></a>
              </div>
              <p className="identity-note">AI는 그림을 생성하지 않습니다. 기획과 일정 관리만 돕습니다.</p>
            </div>

            <div className="risk-calculator" aria-label="입력한 작업 조건으로 마감 성공 확률과 위험 요인을 계산하는 예시 화면">
              <section className="input-panel" aria-label="작업 조건 예시">
                <div className="panel-heading"><span className="panel-step">01</span><span className="panel-kicker">작업 조건 입력</span></div>
                <dl>
                  {workInputs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
              </section>
              <section className="result-panel" aria-label="마감 위험 계산 결과 예시">
                <div className="panel-heading"><span><span className="panel-step">02</span><span className="panel-kicker">계산 결과</span></span><span className="example-label">예시 데이터</span></div>
                <div className="probability" aria-label="마감 성공 확률 64퍼센트 (예시)">64%</div>
                <p className="probability-label">마감 성공 확률</p>
                <div className="probability-track" aria-hidden="true"><span /></div>
                <div className="risk-list">
                  <div><span>주당 가능 시간 부족</span><strong className="risk-high">높음</strong></div>
                  <div><span>배경 작업 비중</span><strong className="risk-normal">보통</strong></div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section id="features" className="identity-features">
          <div className="identity-container">
            <h2>웹툰 제작에 필요한 세 가지 관리</h2>
            <div className="identity-feature-grid">
              {features.map(({ title, description }, index) => (
                <article key={title} className="identity-feature-card">
                  <span aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="identity-footer"><div className="identity-container"><Brand /><p>웹툰 창작과 일정 관리를 위한 프로젝트 관리 서비스</p></div></footer>
    </div>
  );
}
