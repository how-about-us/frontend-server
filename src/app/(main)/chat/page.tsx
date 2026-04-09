"use client";

import { Plus, Send } from "lucide-react";
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

      <div className="shrink-0 px-6 py-6">
        <div className="flex items-center gap-3">
          <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gray-300">
            <Plus className="h-5 w-5 text-dark-gray" />
          </button>
          <div className="flex h-12 flex-1 items-center rounded-xl border-2 border-gray-300 bg-white">
            <div className="ml-3 flex shrink-0 items-center rounded-lg bg-light-gray px-2 py-1">
              <span className="text-sm text-black/40">@AI</span>
            </div>
            <input
              type="text"
              placeholder="메시지를 입력하세요."
              className="min-w-0 flex-1 px-3 text-sm text-black outline-none placeholder:text-black/40"
            />
            <button className="mr-3 shrink-0">
              <Send className="h-5 w-5 text-dark-gray" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
