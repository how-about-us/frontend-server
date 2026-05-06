"use client";

import { useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { ChatEnterIcon } from "@/components/icons";

const AI_PREFIX = "@AI";

interface ChatInputBarProps {
  isMinimized: boolean;
  onSendChat: (content: string) => void;
  onSendAi: (content: string) => void;
  onPlusClick?: () => void;
  plusDisabled?: boolean;
}

export function ChatInputBar({
  isMinimized,
  onSendChat,
  onSendAi,
  onPlusClick,
  plusDisabled = false,
}: ChatInputBarProps) {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function toggleAi() {
    setAiEnabled((prev) => {
      const next = !prev;
      if (next) {
        setMessage(AI_PREFIX);
        setTimeout(() => {
          const el = inputRef.current;
          if (el) {
            el.focus();
            el.setSelectionRange(AI_PREFIX.length, AI_PREFIX.length);
          }
        });
      } else {
        setMessage((m) =>
          m.startsWith(AI_PREFIX) ? m.slice(AI_PREFIX.length) : m,
        );
      }
      return next;
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (aiEnabled && !val.startsWith(AI_PREFIX)) setAiEnabled(false);
    setMessage(val);
  }

  function handleSend() {
    // IME 조합 후 React state 반영 타이밍과 맞추려면 DOM 값이 더 정확할 수 있음
    const raw = inputRef.current?.value ?? message;

    if (aiEnabled) {
      const stripped = raw.startsWith(AI_PREFIX)
        ? raw.slice(AI_PREFIX.length)
        : raw;
      const trimmed = stripped.trim();
      if (!trimmed) return;
      onSendAi(trimmed);
    } else {
      const trimmed = raw.trim();
      if (!trimmed) return;
      onSendChat(trimmed);
    }

    setMessage("");
    setAiEnabled(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;

    // 한글 등 IME: Enter로 조합 확정 중일 때는 전송하지 않음 — 마지막 글자 중복 등 방지
    const ne = e.nativeEvent;
    if (ne.isComposing || ne.keyCode === 229) return;

    e.preventDefault();
    handleSend();
  }

  // 버튼 활성 상태(빨간 아이콘) 판단 — @AI prefix 제외한 실제 텍스트 기준
  const effectiveText = aiEnabled
    ? message.startsWith(AI_PREFIX)
      ? message.slice(AI_PREFIX.length)
      : message
    : message;
  const hasContent = effectiveText.trim().length > 0;

  return (
    <div
      className="flex shrink-0 flex-col border-t border-gray-300"
      style={{ height: isMinimized ? "100px" : "90px" }}
    >
      <div className="relative min-h-0 flex-1 px-4 pb-1 pt-3">
        {aiEnabled && (
          <span className="pointer-events-none absolute top-3 text-sm text-blue-500">
            @AI
          </span>
        )}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요."
          className={`h-full w-full resize-none bg-transparent text-sm leading-relaxed text-black outline-none placeholder:text-black/40 [scrollbar-color:rgba(0,0,0,0.2)_transparent] ${
            aiEnabled ? "text-transparent caret-black" : ""
          }`}
          style={
            aiEnabled
              ? {
                  background: `linear-gradient(90deg, transparent ${AI_PREFIX.length}ch, black ${AI_PREFIX.length}ch)`,
                  WebkitBackgroundClip: "text",
                }
              : undefined
          }
        />
      </div>
      <div className="flex shrink-0 items-center justify-between px-1 pb-2 pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={onPlusClick}
            disabled={plusDisabled || !onPlusClick}
            aria-label="장소 보내기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-light-gray disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-5 w-5 text-dark-gray" />
          </button>
          <button
            onClick={toggleAi}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
              aiEnabled
                ? "bg-brand-green text-white"
                : "bg-light-gray text-black/40"
            }`}
          >
            <span className="text-sm">@AI</span>
            {aiEnabled && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </button>
        </div>
        <button
          onClick={handleSend}
          className="flex items-center gap-2 px-2 py-2 transition hover:opacity-80"
        >
          <ChatEnterIcon
            className={hasContent ? "text-brand-red" : "text-light-gray"}
          />
        </button>
      </div>
    </div>
  );
}
