import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-muted text-muted-foreground",
};

interface Props {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: Props) {
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold", styles[variant], className)}>
      {children}
    </span>
  );
}
