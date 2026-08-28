import { clsx } from "clsx";

interface Props {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  className?: string;
}

export function NumberInput({ label, value, onChange, min = 0, max = 9999, step = 1, unit, hint, className }: Props) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="inline-flex items-center border border-border rounded-md overflow-hidden bg-input-background w-full">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold select-none"
        >
          −
        </button>
        <div className="flex-1 flex items-center justify-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            className="w-full text-center text-sm font-mono font-semibold bg-transparent border-none outline-none text-foreground py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit && <span className="text-xs text-muted-foreground pr-2 shrink-0">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold select-none"
        >
          +
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
