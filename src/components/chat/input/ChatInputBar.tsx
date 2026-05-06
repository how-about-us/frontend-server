"use client";

import { useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { ChatEnterIcon } from "@/components/icons";
import { chatTypography } from "@/components/chat/lib/chatTypography";
import { cn } from "@/lib/utils";

/** UI 오버레이 전용 — 실제 textarea value 에는 넣지 않음 */
const AI_LABEL = "@AI";

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
        setTimeout(() => {
          const el = inputRef.current;
          if (el) {
            el.focus();
            const end = el.value.length;
            el.setSelectionRange(end, end);
          }
        });
      }
      return next;
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
  }

  function handleSend() {
    // IME 조합 후 React state 반영 타이밍과 맞추려면 DOM 값이 더 정확할 수 있음
    const raw = inputRef.current?.value ?? message;
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (aiEnabled) onSendAi(trimmed);
    else onSendChat(trimmed);

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

  const hasContent = message.trim().length > 0;

  return (
    <div
      className="flex shrink-0 flex-col border-t border-gray-300"
      style={{ height: isMinimized ? "100px" : "90px" }}
    >
      <div className="relative min-h-0 flex-1 px-4 pb-1 pt-3">
        {aiEnabled && (
          <span
            className={cn(
              "pointer-events-none absolute left-0 top-3",
              chatTypography.inputAiLabel,
            )}
            style={{ paddingLeft: chatTypography.aiOverlayInset }}
          >
            {AI_LABEL}
          </span>
        )}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요."
          className={cn(
            "h-full w-full resize-none bg-transparent text-black outline-none placeholder:text-black/40 [scrollbar-color:rgba(0,0,0,0.2)_transparent]",
            chatTypography.input,
          )}
          style={
            aiEnabled
              ? { paddingLeft: chatTypography.aiInputPaddingLeft }
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
            <span className={chatTypography.input}>{AI_LABEL}</span>
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
