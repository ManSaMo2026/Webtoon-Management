import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="identity-brand" aria-label="만사모 홈">
      <span className="identity-brand-mark">
        <Pencil size={15} className="text-white" />
      </span>
      <span className={light ? "text-white" : ""}>만사모</span>
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
        </div>
        <div className="identity-header-actions">
          {!user && <Link to="/login" className="identity-header-login">로그인</Link>}
          <Link to={user ? "/projects" : "/signup"} className="identity-header-action">{user ? "내 프로젝트" : "무료로 시작하기"}</Link>
        </div>
      </div>
    </header>
  );
}
