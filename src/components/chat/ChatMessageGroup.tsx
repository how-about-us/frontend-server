import type { ChatMessage } from "@/types/chat";

const AI_AVATAR_SRC = "https://picsum.photos/seed/woori-ai/80/80";

export function OtherMessageGroup({ messages }: { messages: ChatMessage[] }) {
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

export function MyMessageGroup({ messages }: { messages: ChatMessage[] }) {
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

export function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center">
      <div className="my-3 rounded-xl bg-bubble-gray px-4 py-1 text-sm leading-relaxed text-muted-brown">
        {message.text}
      </div>
    </div>
  );
}

export function AiMessageGroup({ messages }: { messages: ChatMessage[] }) {
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex gap-3">
      {/* AI 아바타 — 그린 그라디언트 테두리 */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div
          className="h-10 w-10 shrink-0 rounded-[10px] p-[2px]"
          style={{
            background:
              "linear-gradient(180deg, #74FE72 0%, #13A410 100%)",
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-[8px]">
            <img
              src={AI_AVATAR_SRC}
              alt="WOORI AI"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <span className="text-[10px] leading-relaxed text-dark-gray">
          WOORI
        </span>
      </div>

      {/* 메시지 버블들 */}
      <div className="min-w-0">
        {/* @AI 배지 */}
        <div className="mb-1.5 flex items-center gap-1">
          <span className="rounded-md bg-[#D9D9D9] px-1.5 py-0.5 text-[8.5px] font-medium leading-none text-black/40">
            @AI
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="w-fit rounded-xl bg-brand-green px-4 py-2 text-sm leading-relaxed text-white"
              style={{ whiteSpace: "pre-line" }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {groupTime && (
          <span className="mt-0.5 block text-[10px] leading-relaxed text-dark-gray">
            {groupTime}
          </span>
        )}
      </div>
    </div>
  );
}
