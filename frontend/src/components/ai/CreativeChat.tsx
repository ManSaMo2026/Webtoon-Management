import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Copy, MessageCircle, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { aiApi, type CreativeChatArea, type CreativeChatMessage } from "../../api/ai.api";
import { Button } from "../ui/Button";

const areaContent: Record<CreativeChatArea, { title: string; greeting: string; prompts: string[] }> = {
  story: {
    title: "스토리 상담",
    greeting: "줄거리나 회차 전개를 함께 정리해볼까요? 떠오른 장면, 주인공의 목표, 막히는 부분 중 하나부터 편하게 말해주세요.",
    prompts: ["주인공의 목표 정리하기", "중반 전개 함께 고민하기", "엔딩 훅 점검하기"],
  },
  character: {
    title: "캐릭터 상담",
    greeting: "캐릭터의 성격을 바로 확정하지 않고 질문을 통해 함께 구체화할게요. 인물의 역할이나 가장 먼저 떠오른 특징을 알려주세요.",
    prompts: ["성격과 행동 연결하기", "목표와 약점 정리하기", "관계 갈등 만들기"],
  },
  world: {
    title: "세계관 상담",
    greeting: "세계관의 규칙과 분위기를 대화로 정리해볼까요? 시대, 장소, 능력 체계 중 가장 선명한 것부터 알려주세요.",
    prompts: ["세계의 핵심 규칙 정하기", "능력의 대가 고민하기", "조직 관계 정리하기"],
  },
};

export function CreativeChat({ area, context }: { area: CreativeChatArea; context?: string }) {
  const content = areaContent[area];
  const initialMessages = useMemo<CreativeChatMessage[]>(() => [{ role: "assistant", content: content.greeting }], [content.greeting]);
  const [messages, setMessages] = useState<CreativeChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setMessages(initialMessages);
    setInput("");
    inputRef.current?.focus();
  };

  const send = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;
    const history = messages;
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const answer = await aiApi.chatCreativeAssistant({ area, message, history, context });
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch {
      toast.error("상담 답변을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("상담 내용을 복사했습니다. 필요한 입력란에 다듬어 붙여넣어 주세요.");
    } catch {
      toast.error("상담 내용을 복사하지 못했습니다.");
    }
  };

  return (
    <aside className="self-start overflow-hidden rounded-lg border border-border bg-card shadow-sm xl:sticky xl:top-0" aria-label={`${content.title} AI 채팅`}>
      <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/30 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><MessageCircle size={16} aria-hidden="true" /></span>
          <div><h2 className="text-sm font-semibold text-foreground">{content.title}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">AI 연결 전 대화 UI 데모</p></div>
        </div>
        <button type="button" onClick={reset} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="대화 새로 시작"><RotateCcw size={14} /></button>
      </div>

      <div className="max-h-[420px] min-h-[300px] space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`group max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-5 ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-muted/50 text-foreground"}`}>
              {message.content}
              {message.role === "assistant" && index > 0 && <button type="button" onClick={() => copyMessage(message.content)} className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Copy size={11} />내용 복사</button>}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">생각을 정리하고 있어요…</p></div>}
      </div>

      {messages.length === 1 && <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">{content.prompts.map((prompt) => <button key={prompt} type="button" onClick={() => void send(prompt)} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-text-body hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{prompt}</button>)}</div>}

      <div className="border-t border-border p-3">
        <label htmlFor={`creative-chat-${area}`} className="sr-only">{content.title} 메시지</label>
        <textarea ref={inputRef} id={`creative-chat-${area}`} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} rows={3} placeholder="생각이나 고민을 입력하세요" className="w-full resize-none rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">Enter 전송 · Shift+Enter 줄바꿈</p><Button type="button" size="sm" disabled={!input.trim()} loading={loading} onClick={() => void send()}><Send size={13} />전송</Button></div>
      </div>
      <p className="border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] leading-4 text-muted-foreground">AI가 입력란을 자동으로 바꾸지 않습니다. 대화 후 필요한 내용만 직접 반영하고 저장하세요.</p>
    </aside>
  );
}
