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
  { label: "계획", title: "회차 · 일정 관리", description: "연재 주기와 회차별 작업 상태를 기록하고, 다음 마감까지 남은 시간을 확인합니다." },
  { label: "예측", title: "마감 리스크 예측", description: "컷 수와 작업 조건을 바탕으로 완료 가능성과 우선 조정할 위험 요인을 보여줍니다." },
  { label: "검토", title: "설정 충돌 검사", description: "캐릭터 설정과 복선이 서로 어긋나는 지점을 찾아 작품 정보를 검토합니다." },
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
          <div className="identity-container hero-layout">
            <div className="identity-copy">
              <p className="identity-overline">웹툰 연재 일정 · 설정 관리</p>
              <h1>이번 화,<br />마감 지킬 수 있을까?</h1>
              <p className="identity-subhead">컷 수, 채색 방식, 작업 가능 시간을 입력하면<br />이번 회차의 마감 가능성과 위험 요인을 계산합니다.</p>
              <div className="identity-actions">
                <Link to={projectPath} className="identity-primary-action">{user ? "내 프로젝트 이어가기" : "무료로 프로젝트 만들기"}<ArrowRight size={17} aria-hidden="true" /></Link>
                {!user && <Link to="/login" className="identity-secondary-action">이미 계정이 있다면 로그인</Link>}
              </div>
              <p className="identity-note">AI는 그림을 생성하지 않습니다. 기획과 일정 관리만 돕습니다.</p>
            </div>

            <div id="product-preview" className="product-preview" aria-label="입력한 작업 조건으로 마감 성공 확률과 위험 요인을 계산하는 예시 화면">
              <div className="preview-toolbar">
                <div><span className="preview-project">검은 태양의 후계자</span><span className="preview-episode">18화 마감 점검</span></div>
                <span className="example-label">예시 데이터</span>
              </div>
              <div className="risk-calculator">
                <section className="input-panel" aria-label="작업 조건 예시">
                  <div className="panel-heading"><span className="panel-step">01</span><span className="panel-kicker">작업 조건</span></div>
                  <dl>
                    {workInputs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                  </dl>
                </section>
                <section className="result-panel" aria-label="마감 위험 계산 결과 예시">
                  <div className="panel-heading"><span className="panel-step">02</span><span className="panel-kicker">예측 결과</span></div>
                  <div className="probability" aria-label="마감 성공 확률 64퍼센트 (예시)">64%</div>
                  <p className="probability-label">마감 성공 확률</p>
                  <div className="probability-track" aria-hidden="true"><span /></div>
                  <div className="risk-list">
                    <div><span>주당 가능 시간 부족</span><strong className="risk-high">높음</strong></div>
                    <div><span>배경 작업 비중</span><strong className="risk-normal">보통</strong></div>
                  </div>
                  <p className="result-guidance">가능 시간을 먼저 조정하면 마감 위험을 줄일 수 있습니다.</p>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="identity-features">
          <div className="identity-container">
            <p className="section-overline">하나의 프로젝트에서</p>
            <h2>계획부터 마감 점검까지 이어서 관리합니다</h2>
            <div className="feature-ledger">
              {features.map(({ label, title, description }, index) => (
                <article key={title} className="feature-ledger-row">
                  <span aria-hidden="true">0{index + 1}</span><p className="feature-label">{label}</p><h3>{title}</h3><p className="feature-description">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="identity-footer"><div className="identity-container"><Brand /><div className="identity-footer-meta"><p>웹툰 창작과 일정 관리를 위한 프로젝트 관리 서비스</p><nav aria-label="정책"><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보처리방침</Link></nav></div></div></footer>
    </div>
  );
}
