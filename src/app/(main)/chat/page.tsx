"use client";

import { useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { ChatEnterIcon } from "@/components/icons";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
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
  const last = messages[messages.length - 1];

  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-light-gray">
        {first.avatar && (
          <img
            src={first.avatar}
            alt={first.sender ?? ""}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-2.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="w-fit rounded-xl bg-bubble-gray px-4 py-2 text-sm leading-relaxed text-black"
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] leading-relaxed text-dark-gray">
            {first.sender}
          </span>
          {last.time && (
            <span className="text-[10px] leading-relaxed text-dark-gray">
              {last.time}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MyMessageGroup({ messages }: { messages: ChatMessage[] }) {
  const last = messages[messages.length - 1];

  return (
    <div className="flex flex-col items-end gap-2.5">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="w-fit rounded-xl bg-brand-red px-4 py-2 text-sm leading-relaxed text-white"
        >
          {msg.text}
        </div>
      ))}
      {last.time && (
        <span className="text-[10px] leading-relaxed text-dark-gray">
          {last.time}
        </span>
      )}
    </div>
  );
}

function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center">
      <div className="rounded-xl bg-bubble-gray px-4 py-2 text-sm leading-relaxed text-muted-brown">
        {message.text}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const groups = groupConsecutiveMessages(MOCK_CHAT_MESSAGES);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const AI_PREFIX = "@AI ";

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
    <>
      <SetSectionMaxWidth value="400px" />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-6">
        <div className="flex flex-col gap-6">
          {groups.map((group, i) => {
            const type = group[0].type;
            if (type === "system") {
              return <SystemMessage key={i} message={group[0]} />;
            }
            if (type === "mine") {
              return <MyMessageGroup key={i} messages={group} />;
            }
            return <OtherMessageGroup key={i} messages={group} />;
          })}
        </div>
      </div>

      <div className="flex h-36 shrink-0 flex-col border-t border-gray-300">
        {/* 텍스트 입력 영역 */}
        <div className="relative min-h-0 flex-1 px-4 pt-3 pb-1">
          {aiEnabled && (
            <span className="pointer-events-none absolute left-4 top-3 text-sm text-blue-500">
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

        {/* 하단 툴바 */}
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
    </>
  );
}
