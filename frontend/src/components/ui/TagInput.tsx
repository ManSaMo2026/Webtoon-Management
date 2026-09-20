import { useState, type KeyboardEvent } from "react";
import { Hash, X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export function TagInput({ value, onChange, maxTags = 8 }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (rawValue = draft) => {
    const tag = rawValue.trim().replace(/^#+/, "");
    if (!tag || value.includes(tag) || value.length >= maxTags) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="project-tags" className="text-sm font-medium text-foreground">작품 태그 <span className="font-normal text-muted-foreground">선택</span></label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-border bg-input-background px-2.5 py-2 focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
            #{tag}<button type="button" aria-label={`${tag} 태그 삭제`} onClick={() => onChange(value.filter((item) => item !== tag))} className="text-muted-foreground hover:text-destructive"><X size={11} /></button>
          </span>
        ))}
        {value.length < maxTags && (
          <span className="flex min-w-[9rem] flex-1 items-center gap-1 text-muted-foreground">
            <Hash size={13} aria-hidden="true" />
            <input id="project-tags" value={draft} onChange={(event) => setDraft(event.target.value.replace(/,/g, ""))} onKeyDown={handleKeyDown} onBlur={() => addTag()} placeholder="피폐물, 힐링물" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Enter 또는 쉼표로 추가 · 최대 {maxTags}개</p>
    </div>
  );
}
