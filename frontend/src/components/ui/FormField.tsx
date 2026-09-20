import { clsx } from "clsx";
import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";

const inputBase = "w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50";

interface LabeledProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

function FieldWrapper({ label, required, error, hint, className, children }: LabeledProps & { children: React.ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}{required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

type InputProps = LabeledProps & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, required, error, hint, className, ...props }: InputProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint} className={className}>
      <input className={clsx(inputBase, error && "border-destructive focus:ring-destructive")} {...props} />
    </FieldWrapper>
  );
}

type TextareaProps = LabeledProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, required, error, hint, className, ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint} className={className}>
      <textarea className={clsx(inputBase, "resize-none min-h-[80px]", error && "border-destructive")} {...props} />
    </FieldWrapper>
  );
}

type SelectProps = LabeledProps & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ label, required, error, hint, className, children, ...props }: SelectProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint} className={className}>
      <select className={clsx(inputBase, "cursor-pointer", error && "border-destructive")} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}

interface SliderProps extends LabeledProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: number;
}

export function Slider({ label, min, max, value, onChange, unit = "", step = 1, className, hint }: SliderProps) {
  return (
    <FieldWrapper label={label} hint={hint} className={className}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary h-1.5"
        />
        <span className="text-sm font-semibold text-primary min-w-[3rem] text-right font-mono">
          {value}{unit}
        </span>
      </div>
    </FieldWrapper>
  );
}
