import { clsx } from "clsx";

interface Props {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

export function ToggleSwitch({ label, description, checked, onChange, className }: Props) {
  return (
    <div className={clsx("flex items-center justify-between gap-4", className)}>
      {(label || description) && (
        <div className="flex-1">
          {label && <p className="text-sm font-medium text-foreground">{label}</p>}
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
          checked ? "bg-primary" : "bg-switch-background"
        )}
      >
        <span
          className={clsx(
            "absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
