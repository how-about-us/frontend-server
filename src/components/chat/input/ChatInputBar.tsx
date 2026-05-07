"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { ChatEnterIcon } from "@/components/icons";
import {
  chatAiLabelMotion,
  chatTapSoft,
  chatTapTransition,
} from "@/components/chat/lib/chat.animations";
import { chatTypography, resolveChatMessageTypography } from "@/components/chat/lib/chatTypography";
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
  const reduceMotion = useReducedMotion();

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

  function fillAiDraft(text: string) {
    setMessage(text);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        const end = text.length;
        el.setSelectionRange(end, end);
      }
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
  const typo = resolveChatMessageTypography(isMinimized);

  return (
    <div
      className="flex shrink-0 flex-col border-t border-gray-300"
      style={{ height: isMinimized ? "100px" : "90px" }}
    >
      <div className="relative min-h-0 flex-1 px-4 pb-1 pt-3">
        <AnimatePresence>
          {aiEnabled && (
            <motion.span
              key="ai-overlay"
              className={cn(
                "pointer-events-none absolute left-0 top-3",
                typo.inputAiLabel,
              )}
              style={{ paddingLeft: chatTypography.aiOverlayInset }}
              initial={reduceMotion ? false : chatAiLabelMotion.initial}
              animate={
                reduceMotion ?
                  { opacity: 1, x: 0 }
                : chatAiLabelMotion.animate
              }
              exit={reduceMotion ? { opacity: 0, x: 0 } : chatAiLabelMotion.exit}
              transition={
                reduceMotion ? { duration: 0 } : chatAiLabelMotion.transition
              }
            >
              {AI_LABEL}
            </motion.span>
          )}
        </AnimatePresence>
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요."
          className={cn(
            "h-full w-full resize-none bg-transparent text-black outline-none placeholder:text-black/40 [scrollbar-color:rgba(0,0,0,0.2)_transparent]",
            typo.input,
          )}
          style={
            aiEnabled
              ? { paddingLeft: chatTypography.aiInputPaddingLeft }
              : undefined
          }
        />
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center justify-between px-1 pb-2",
          isMinimized ? "pt-0.5" : "pt-1",
        )}
      >
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            onClick={onPlusClick}
            disabled={plusDisabled || !onPlusClick}
            aria-label="장소 보내기"
            whileTap={reduceMotion ? undefined : chatTapSoft}
            transition={chatTapTransition}
            className={cn(
              "flex items-center justify-center rounded-full transition hover:bg-light-gray disabled:cursor-not-allowed disabled:opacity-40",
              isMinimized ? "h-8 w-8" : "h-9 w-9",
            )}
          >
            <Plus
              className={cn(
                "text-dark-gray",
                isMinimized ? "h-4 w-4" : "h-5 w-5",
              )}
            />
          </motion.button>
          <motion.button
            type="button"
            onClick={toggleAi}
            whileTap={reduceMotion ? undefined : chatTapSoft}
            transition={chatTapTransition}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
              aiEnabled
                ? "bg-brand-green text-white"
                : "bg-light-gray text-black/40"
            }`}
          >
            <span className={typo.input}>{AI_LABEL}</span>
            {aiEnabled && (
              <Check
                className={cn(isMinimized ? "h-3 w-3" : "h-3.5 w-3.5")}
                strokeWidth={3}
              />
            )}
          </motion.button>
          {aiEnabled ?
            <>
              <motion.button
                type="button"
                onClick={() => fillAiDraft("장소 추천해줘.")}
                whileTap={reduceMotion ? undefined : chatTapSoft}
                transition={chatTapTransition}
                aria-label="입력란에 장소 추천 요청 문구 넣기"
                className={cn(
                  "shrink-0 rounded-lg border border-gray-border bg-white px-2 py-1 text-black/80 transition hover:bg-light-gray",
                  isMinimized ? "text-[10px]" : "text-[11px]",
                )}
              >
                장소 추천
              </motion.button>
              <motion.button
                type="button"
                onClick={() => fillAiDraft("대화 요약해줘.")}
                whileTap={reduceMotion ? undefined : chatTapSoft}
                transition={chatTapTransition}
                aria-label="입력란에 대화 요약 요청 문구 넣기"
                className={cn(
                  "shrink-0 rounded-lg border border-gray-border bg-white px-2 py-1 text-black/80 transition hover:bg-light-gray",
                  isMinimized ? "text-[10px]" : "text-[11px]",
                )}
              >
                대화 요약
              </motion.button>
            </>
          : null}
        </div>
        <motion.button
          type="button"
          onClick={handleSend}
          whileTap={reduceMotion ? undefined : chatTapSoft}
          transition={chatTapTransition}
          className="flex items-center gap-2 px-2 py-2 transition hover:opacity-80"
        >
          <ChatEnterIcon
            className={hasContent ? "text-brand-red" : "text-light-gray"}
          />
        </motion.button>
      </div>
    </div>
  );
}
