import { Link } from "react-router";
import { Brand } from "../components/layout/PublicHeader";
import "../styles/hero-landing.css";

const termsSections = [
  { title: "1. 서비스의 목적", body: "만사모는 작품 설정, 회차 진행 상태와 작업 일정을 정리하고 마감 가능성을 참고할 수 있도록 돕는 프로젝트 관리 서비스입니다." },
  { title: "2. 계정 이용", body: "회원은 본인의 이메일과 비밀번호로 계정을 관리합니다. 계정 정보가 다른 사람에게 노출되지 않도록 직접 관리해야 합니다." },
  { title: "3. 입력한 작품 정보", body: "현재 작품 정보와 표지 이미지는 사용 중인 브라우저에 저장됩니다. 다른 기기나 브라우저에서는 동일한 정보가 자동으로 나타나지 않을 수 있습니다." },
  { title: "4. 일정 예측 결과", body: "마감 성공 확률과 위험 요인은 입력값을 기준으로 계산한 참고 정보이며, 실제 연재 완료나 마감 준수를 보장하지 않습니다." },
];

const privacySections = [
  { title: "수집하는 정보", body: "회원가입 시 이메일, 이름, 작가명과 비밀번호를 입력받습니다. 비밀번호는 원문이 아니라 해시값으로 저장되며, 로그인 세션 식별 정보와 가입·수정 시간이 함께 저장됩니다." },
  { title: "이용 목적", body: "수집한 회원정보는 회원가입, 로그인, 본인 계정 확인과 프로필 수정 기능을 제공하기 위해 사용합니다." },
  { title: "현재 저장 방식", body: "회원정보와 세션 해시는 실행 중인 로컬 서버의 SQLite 데이터베이스에 저장됩니다. 로그인 토큰과 작품·캐릭터·일정 데이터는 현재 브라우저의 localStorage에 저장됩니다." },
  { title: "보관 및 삭제", body: "로그인 세션은 생성 후 7일간 유효합니다. 회원 탈퇴 기능과 회원정보 보관·파기 기간은 아직 구현 및 확정되지 않았습니다." },
  { title: "제3자 제공", body: "현재 구현에는 개인정보를 외부 제3자에게 전송하는 기능이 없습니다. 향후 외부 AI API나 배포 서비스를 연결할 경우 실제 처리 방식에 맞춰 이 문서를 갱신해야 합니다." },
];

export function LegalPage({ type }: { type: "terms" | "privacy" }) {
  const isTerms = type === "terms";
  const sections = isTerms ? termsSections : privacySections;

  return (
    <div className="identity-landing legal-page">
      <header className="legal-header"><div className="identity-container"><Brand /><Link to="/">메인으로 돌아가기</Link></div></header>
      <main className="identity-container legal-main">
        <p className="legal-status">운영 전 검토용 초안</p>
        <h1>{isTerms ? "이용약관" : "개인정보처리방침"}</h1>
        <p className="legal-intro">현재 구현된 기능을 기준으로 작성했습니다. 정식 서비스 운영 전 아래 미정 정보를 담당자가 검토하고 확정해야 합니다.</p>
        <div className="legal-sections">{sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div>
        <aside className="legal-required"><strong>운영 전 입력 필요</strong><ul><li>서비스 운영 주체 및 사업자·학교·팀 정보</li><li>문의 및 개인정보 보호 담당자 연락처</li><li>정식 시행일과 회원 탈퇴·데이터 파기 절차</li><li>배포 환경과 외부 API 연결 후 실제 데이터 전송 내역</li></ul></aside>
      </main>
      <footer className="identity-footer"><div className="identity-container"><Brand /><p>웹툰 창작과 일정 관리를 위한 프로젝트 관리 서비스</p></div></footer>
    </div>
  );
}
