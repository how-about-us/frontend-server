import type { ChatMessage } from "@/types/chat";
import { getChatPanelLook } from "@/components/chat/lib/chatPanelLook";
import type { ChatMessageTextTypography } from "@/components/chat/lib/chatTypography";
import { cn } from "@/lib/utils";

function BubbleMessageText({
  msg,
  typo,
}: {
  msg: ChatMessage;
  typo: ChatMessageTextTypography;
}) {
  if (!msg.isAiRequest) return msg.text;
  return (
    <>
      <span className={typo.aiRequestBubblePrefix}>@AI</span>
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
  typo,
  className,
}: {
  time: string;
  typo: ChatMessageTextTypography;
  className?: string;
}) {
  return <span className={cn(typo.metaMuted, className)}>{time}</span>;
}

export function OtherMessageGroup({
  messages,
  isMinimized = false,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
}) {
  const { typo, chrome } = getChatPanelLook(isMinimized);
  const first = messages[0];
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className={cn(chrome.avatarSm, "bg-light-gray")}>
          {first.avatar && (
            <img
              src={first.avatar}
              alt={first.sender ?? ""}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <span className={typo.metaMuted}>{first.sender}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                chrome.bubbleBase,
                chrome.otherBubble,
                typo.bubble,
              )}
            >
              <BubbleMessageText msg={msg} typo={typo} />
            </div>
          ))}
        </div>
        {groupTime && (
          <GroupTimeStamp time={groupTime} typo={typo} />
        )}
      </div>
    </div>
  );
}

export function MyMessageGroup({
  messages,
  isMinimized = false,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
}) {
  const { typo, chrome } = getChatPanelLook(isMinimized);
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex flex-col items-end gap-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            chrome.bubbleBase,
            chrome.mineBubble,
            typo.bubble,
          )}
        >
          <BubbleMessageText msg={msg} typo={typo} />
        </div>
      ))}
      {groupTime && (
        <GroupTimeStamp time={groupTime} typo={typo} />
      )}
    </div>
  );
}

export function SystemMessage({
  message,
  isMinimized = false,
}: {
  message: ChatMessage;
  isMinimized?: boolean;
}) {
  const { typo, chrome } = getChatPanelLook(isMinimized);

  return (
    <div className="flex justify-center px-2">
      <div
        className={cn(chrome.systemPill, typo.systemBody)}
        style={{ whiteSpace: "pre-line" }}
      >
        {message.text}
      </div>
    </div>
  );
}

export function AiMessageGroup({
  messages,
  isMinimized = false,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
}) {
  const { typo, chrome } = getChatPanelLook(isMinimized);
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex gap-2">
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <div
          className={cn(chrome.avatarSm, "bg-transparent")}
          role="img"
          aria-label="WOORI"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- public 정적 SVG */}
          <img
            src={chrome.wooriIconSrc}
            alt="WOORI"
            className="h-full w-full object-contain"
          />
        </div>
        <span className={typo.wooriSenderLabel}>WOORI</span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                chrome.bubbleBase,
                chrome.aiBubble,
                typo.bubble,
              )}
              style={{ whiteSpace: "pre-line" }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {groupTime && (
          <GroupTimeStamp
            time={groupTime}
            typo={typo}
            className="mt-0.5 block"
          />
        )}
      </div>
    </div>
  );
}
