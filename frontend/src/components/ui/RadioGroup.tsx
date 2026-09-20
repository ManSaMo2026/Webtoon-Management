import { clsx } from "clsx";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface Props<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  layout?: "row" | "col";
  hint?: string;
  className?: string;
}

export function RadioGroup<T extends string>({ label, options, value, onChange, layout = "row", hint, className }: Props<T>) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className={clsx("flex gap-2", layout === "col" && "flex-col")}>
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-all select-none",
                layout === "row" ? "flex-1" : "w-full",
                checked
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-input-background text-foreground hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <span className={clsx(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                checked ? "border-primary" : "border-muted-foreground"
              )}>
                {checked && <span className="w-2 h-2 rounded-full bg-primary block" />}
              </span>
              <input type="radio" value={opt.value} checked={checked} onChange={() => onChange(opt.value)} className="sr-only" />
              <div>
                <span className="text-sm font-medium">{opt.label}</span>
                {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
              </div>
            </label>
          );
        })}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
