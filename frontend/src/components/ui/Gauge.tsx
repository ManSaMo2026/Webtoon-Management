import { clsx } from "clsx";

interface GaugeProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  colorize?: boolean;
}

function getColor(value: number) {
  if (value >= 70) return { stroke: "#10b981", text: "text-emerald-600", bg: "bg-emerald-100" };
  if (value >= 50) return { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-100" };
  return { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-100" };
}

const sizeMap = { sm: 72, md: 100, lg: 130 };

export function Gauge({ value, size = "md", showLabel = true, label, colorize = true }: GaugeProps) {
  const px = sizeMap[size];
  const r = (px - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = colorize ? getColor(value) : { stroke: "#4f46e5", text: "text-primary", bg: "bg-secondary" };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: px, height: px }}>
        <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="-rotate-90">
          <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted opacity-30" />
          <circle
            cx={px / 2} cy={px / 2} r={r}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx("font-mono font-extrabold tracking-[-0.04em]", size === "lg" ? "text-[2rem]" : size === "md" ? "text-[1.75rem]" : "text-xl", color.text)}>
            {value}%
          </span>
        </div>
      </div>
      {showLabel && label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  total: number;
  label?: string;
  colorize?: boolean;
}

export function ProgressBar({ value, total, label, colorize = true }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const color = colorize ? getColor(pct) : { stroke: "#4f46e5", text: "text-primary", bg: "bg-secondary" };
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-end justify-between gap-3 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={clsx("shrink-0 font-mono text-sm font-extrabold leading-none tracking-[-0.03em]", color.text)}>{value}/{total}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color.stroke }}
        />
      </div>
    </div>
  );
}
