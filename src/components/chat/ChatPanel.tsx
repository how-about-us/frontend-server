"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import { ChatEnterIcon } from "@/components/icons";
import { useChat } from "@/contexts/ChatContext";
import { MOCK_CHAT_MESSAGES, type ChatMessage } from "@/mocks";

function groupConsecutiveMessages(messages: ChatMessage[]) {
  const groups: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    const prev = current[current.length - 1];
    if (prev && prev.type === msg.type && prev.sender === msg.sender) {
      current.push(msg);
    } else {
      if (current.length) groups.push(current);
      current = [msg];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function OtherMessageGroup({ messages }: { messages: ChatMessage[] }) {
  const first = messages[0];
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-light-gray">
          {first.avatar && (
            <img
              src={first.avatar}
              alt={first.sender ?? ""}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <span className="text-[10px] leading-relaxed text-dark-gray">
          {first.sender}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="w-fit rounded-xl bg-bubble-gray px-4 py-2 text-sm leading-relaxed text-black"
            >
              {msg.text}
            </div>
          ))}
        </div>
        {groupTime && (
          <span className="text-[10px] leading-relaxed text-dark-gray">
            {groupTime}
          </span>
        )}
      </div>
    </div>
  );
}

function MyMessageGroup({ messages }: { messages: ChatMessage[] }) {
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex flex-col items-end gap-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="w-fit rounded-xl bg-brand-red px-4 py-2 text-sm leading-relaxed text-white"
        >
          {msg.text}
        </div>
      ))}
      {groupTime && (
        <span className="text-[10px] leading-relaxed text-dark-gray">
          {groupTime}
        </span>
      )}
    </div>
  );
}

function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center">
      <div className="my-3 rounded-xl bg-bubble-gray px-4 py-1 text-sm leading-relaxed text-muted-brown">
        {message.text}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { chatState, openChat, minimizeChat, closeChat } = useChat();
  const groups = groupConsecutiveMessages(MOCK_CHAT_MESSAGES);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const AI_PREFIX = "@AI";
  const isMinimized = chatState === "minimized";

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
    if (aiEnabled && !val.startsWith(AI_PREFIX)) {
      setAiEnabled(false);
    }
    setMessage(val);
  }

  return (
    <AnimatePresence>
      {chatState !== "closed" && (
        <motion.div
          key="chat-panel"
          layout
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            borderRadius: isMinimized ? 16 : 0,
            boxShadow: isMinimized
              ? "0 20px 40px -8px rgba(0,0,0,0.18)"
              : "0 0 0 0 rgba(0,0,0,0)",
          }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{
            layout: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
            y: { duration: 0.2 },
            borderRadius: { type: "spring", stiffness: 300, damping: 30 },
            boxShadow: { duration: 0.25 },
          }}
          className={
            isMinimized
              ? "absolute bottom-6 right-6 z-20 flex h-[460px] w-72 flex-col overflow-hidden border border-gray-border bg-white"
              : "absolute top-0 left-0 w-[400px] z-10 flex flex-col overflow-hidden bg-white"
          }
        >
          {/* 헤더 */}
          <div
            className={`flex shrink-0 items-center justify-between px-3 py-2 ${isMinimized ? "cursor-pointer" : ""}`}
            onClick={isMinimized ? openChat : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className={`shrink-0 overflow-hidden rounded-[8px] bg-light-gray transition-all duration-300 ${isMinimized ? "h-7 w-7" : "h-10 w-10"}`}
              >
                <img
                  src="https://picsum.photos/seed/chat-avatar/80/80"
                  alt="trip"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h2
                  className={`font-semibold leading-tight transition-all duration-300 ${isMinimized ? "text-sm" : "text-xl"}`}
                >
                  히코네여행
                </h2>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full bg-[#68D391] transition-all duration-300 ${isMinimized ? "h-1.5 w-1.5" : "h-2.5 w-2.5"}`}
                  />
                  <span className="text-xs font-semibold text-black/60">
                    3 Online
                  </span>
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={isMinimized ? openChat : minimizeChat}
                className="rounded-full p-1.5 text-dark-gray transition hover:bg-light-gray"
                aria-label={isMinimized ? "최대화" : "최소화"}
              >
                {isMinimized ? (
                  <img
                    src="/icons/maximize.svg"
                    alt="maximize"
                    className="h-4 w-4"
                  />
                ) : (
                  <img
                    src="/icons/minimize.svg"
                    alt="minimize"
                    className="h-4 w-4"
                  />
                )}
              </button>
              <button
                onClick={closeChat}
                className="rounded-full p-1.5 text-dark-gray transition hover:bg-light-gray"
                aria-label="채팅 닫기"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-px bg-black/[0.08]" />

          {/* 메시지 목록 */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-3 py-2 [scrollbar-color:rgba(0,0,0,0.2)_transparent]">
            <div className="flex flex-col gap-1">
              {groups.map((group, i) => {
                const type = group[0].type;
                if (type === "system")
                  return <SystemMessage key={i} message={group[0]} />;
                if (type === "mine")
                  return <MyMessageGroup key={i} messages={group} />;
                return <OtherMessageGroup key={i} messages={group} />;
              })}
            </div>
          </div>

          {/* 입력 영역 */}
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
                  {aiEnabled && (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  )}
                </button>
              </div>
              <button className="flex items-center gap-2 px-2 py-2 transition hover:opacity-80">
                <ChatEnterIcon
                  className={
                    message.trim() ? "text-brand-red" : "text-light-gray"
                  }
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
