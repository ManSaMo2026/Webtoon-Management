import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="웹툰메이커 홈">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
        <Pencil size={15} className="text-white" />
      </span>
      <span className={`text-sm font-bold tracking-tight ${light ? "text-white" : "text-foreground"}`}>웹툰메이커</span>
    </Link>
  );
}

export function PublicHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm text-text-muted md:flex">
            <a href="#about" className="transition-colors hover:text-text">서비스 소개</a>
            <a href="#features" className="transition-colors hover:text-text">주요 기능</a>
            <a href="#workflow" className="transition-colors hover:text-text">이용 방법</a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/projects"><Button size="sm">내 프로젝트</Button></Link>
          ) : (
            <>
              <Link to="/login"><Button size="sm" variant="ghost">로그인</Button></Link>
              <Link to="/signup"><Button size="sm">무료로 시작하기</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
