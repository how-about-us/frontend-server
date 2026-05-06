import type { ChatMessage } from "@/types/chat";
import { chatMessageChrome } from "@/components/chat/lib/chatMessageChrome";
import { chatTypography } from "@/components/chat/lib/chatTypography";
import { cn } from "@/lib/utils";

function BubbleMessageText({ msg }: { msg: ChatMessage }) {
  if (!msg.isAiRequest) return msg.text;
  return (
    <>
      <span className={chatTypography.aiRequestBubblePrefix}>@AI</span>
      {msg.text ? (
        <>
          {" "}
          <span className="whitespace-pre-wrap break-words">{msg.text}</span>
        </>
      ) : null}
    </>
  );
}

function GroupTimeStamp({
  time,
  className,
}: {
  time: string;
  className?: string;
}) {
  return <span className={cn(chatTypography.metaMuted, className)}>{time}</span>;
}

export function OtherMessageGroup({ messages }: { messages: ChatMessage[] }) {
  const first = messages[0];
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className={cn(chatMessageChrome.avatarSm, "bg-light-gray")}>
          {first.avatar && (
            <img
              src={first.avatar}
              alt={first.sender ?? ""}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <span className={chatTypography.metaMuted}>{first.sender}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                chatMessageChrome.bubbleBase,
                chatMessageChrome.otherBubble,
                chatTypography.bubble,
              )}
            >
              <BubbleMessageText msg={msg} />
            </div>
          ))}
        </div>
        {groupTime && <GroupTimeStamp time={groupTime} />}
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
          className={cn(
            chatMessageChrome.bubbleBase,
            chatMessageChrome.mineBubble,
            chatTypography.bubble,
          )}
        >
          <BubbleMessageText msg={msg} />
        </div>
      ))}
      {groupTime && <GroupTimeStamp time={groupTime} />}
    </div>
  );
}

export function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center px-2">
      <div
        className={cn(chatMessageChrome.systemPill, chatTypography.systemBody)}
        style={{ whiteSpace: "pre-line" }}
      >
        {message.text}
      </div>
    </div>
  );
}

export function AiMessageGroup({ messages }: { messages: ChatMessage[] }) {
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex gap-2">
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <div
          className={cn(chatMessageChrome.avatarSm, "bg-transparent")}
          role="img"
          aria-label="WOORI"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- public 정적 SVG */}
          <img
            src={chatMessageChrome.wooriIconSrc}
            alt="WOORI"
            className="h-full w-full object-contain"
          />
        </div>
        <span className={chatTypography.wooriSenderLabel}>WOORI</span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                chatMessageChrome.bubbleBase,
                chatMessageChrome.aiBubble,
                chatTypography.bubble,
              )}
              style={{ whiteSpace: "pre-line" }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {groupTime && (
          <GroupTimeStamp time={groupTime} className="mt-0.5 block" />
        )}
      </div>
    </div>
  );
}
