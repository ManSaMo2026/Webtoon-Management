import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="identity-brand" aria-label="웹툰메이커 홈">
      <span className="identity-brand-mark">
        <Pencil size={15} className="text-white" />
      </span>
      <span className={light ? "text-white" : ""}>웹툰메이커</span>
    </Link>
  );
}

export function PublicHeader() {
  const { user } = useAuth();
  return (
    <header className="identity-public-header">
      <div className="identity-header-inner">
        <div className="identity-header-left">
          <Brand />
          <nav className="identity-public-nav" aria-label="주요 메뉴">
            <a href="#about">서비스</a>
            <a href="#features">핵심 기능</a>
          </nav>
        </div>
        <Link to={user ? "/projects" : "/login"} className="identity-header-action">내 프로젝트</Link>
      </div>
    </header>
  );
}
