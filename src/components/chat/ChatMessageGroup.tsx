import type { ChatMessage } from "@/mocks";

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
