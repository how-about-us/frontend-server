"use client";

import { useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { ChatEnterIcon } from "@/components/icons";

const AI_PREFIX = "@AI";

export function ChatInputBar({ isMinimized }: { isMinimized: boolean }) {
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
          <button className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-light-gray">
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
        <button className="flex items-center gap-2 px-2 py-2 transition hover:opacity-80">
          <ChatEnterIcon
            className={message.trim() ? "text-brand-red" : "text-light-gray"}
          />
        </button>
      </div>
    </div>
  );
}
