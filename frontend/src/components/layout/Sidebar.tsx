import { NavLink, useParams } from "react-router";
import { clsx } from "clsx";
import {
  LayoutDashboard, BookOpen, Users, Film, CalendarClock, Download,
  FolderKanban, PlusCircle, Pencil, Globe2,
} from "lucide-react";

const PROJECT_TABS = [
  { to: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "story", label: "스토리", icon: BookOpen },
  { to: "characters", label: "캐릭터", icon: Users },
  { to: "world", label: "세계관", icon: Globe2 },
  { to: "scenes", label: "장면 설계", icon: Film },
  { to: "schedule", label: "일정 리스크", icon: CalendarClock },
  { to: "export", label: "내보내기", icon: Download },
];

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: React.ElementType; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

function ProjectNav() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mt-2">
      {PROJECT_TABS.map(({ to, label, icon }) => (
        <NavItem key={to} to={`/projects/${id}/${to}`} label={label} icon={icon} />
      ))}
    </div>
  );
}

interface SidebarProps {
  projectMode?: boolean;
  projectTitle?: string;
}

export function Sidebar({ projectMode, projectTitle }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-sidebar flex flex-col z-30 border-r border-sidebar-border">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Pencil size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">웹툰메이커</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!projectMode ? (
          <>
            <NavItem to="/projects" label="프로젝트 목록" icon={FolderKanban} end />
            <NavItem to="/projects/new" label="새 프로젝트" icon={PlusCircle} />
          </>
        ) : (
          <>
            <div className="mb-3">
              <NavLink
                to="/projects"
                className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground px-3 py-1 transition-colors"
              >
                ← 프로젝트 목록
              </NavLink>
              {projectTitle && (
                <p className="px-3 py-1.5 text-xs font-semibold text-sidebar-accent-foreground truncate mt-1">
                  {projectTitle}
                </p>
              )}
            </div>
            <div className="border-t border-sidebar-border pt-2">
              <ProjectNav />
            </div>
          </>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">김</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">김웹툰</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">작가</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
