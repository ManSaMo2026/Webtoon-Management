import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { clsx } from "clsx";

interface Props {
  children: ReactNode;
  projectMode?: boolean;
  projectTitle?: string;
  pageTitle?: string;
  actions?: ReactNode;
}

export function MainLayout({ children, projectMode, projectTitle, pageTitle, actions }: Props) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar projectMode={projectMode} projectTitle={projectTitle} />
      <div className={clsx("flex-1 flex flex-col min-w-0", "ml-56")}>
        {pageTitle && (
          <header className="sticky top-0 z-20 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
        )}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
