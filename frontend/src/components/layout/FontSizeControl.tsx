import { useState } from "react";
import { Type } from "lucide-react";
import { clsx } from "clsx";
import {
  applyFontSizePreference,
  FONT_SIZE_OPTIONS,
  getFontSizePreference,
  type FontSizePreference,
} from "../../utils/fontSize";

export function FontSizeControl({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const [selected, setSelected] = useState<FontSizePreference>(getFontSizePreference);

  const select = (value: FontSizePreference) => {
    setSelected(value);
    applyFontSizePreference(value);
  };

  return (
    <div
      className={clsx(
        "flex items-center rounded-md border p-1",
        compact ? "gap-0.5" : "justify-between gap-2",
        dark ? "border-sidebar-border bg-white/5" : "border-border bg-card",
      )}
      role="group"
      aria-label="글자 크기 선택"
    >
      {!compact && (
        <span className={clsx("flex items-center gap-1.5 pl-1 text-xs", dark ? "text-sidebar-foreground/70" : "text-muted-foreground")}>
          <Type size={13} aria-hidden="true" />
          글자 크기
        </span>
      )}
      <div className="flex items-center gap-0.5">
        {FONT_SIZE_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => select(option.value)}
              className={clsx(
                "rounded px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? dark
                    ? "bg-sidebar-primary text-white"
                    : "bg-primary text-primary-foreground"
                  : dark
                    ? "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
