import type { AiRequestStatus, ChatMessage } from "@/types/chat";
import { getChatPanelLook } from "@/components/chat/lib/chatPanelLook";
import type { ChatMessageTextTypography } from "@/components/chat/lib/chatTypography";
import { cn } from "@/lib/utils";
import { Loader2, Reply } from "lucide-react";

function labelForAiStatus(status: AiRequestStatus): string {
  const labels: Record<AiRequestStatus, string> = {
    QUEUED: "다른 요청 처리 중",
    PROCESSING: "AI 처리 중",
    CANCELED: "취소됨",
  };
  return labels[status];
}

function AiRequestMetaRow({
  msg,
  typo,
  onCancelRequest,
  /** 내 AI 요청이면 상태·취소됨 우측 정렬, 상대방이면 좌측 정렬 */
  isOwnMessage = false,
}: {
  msg: ChatMessage;
  typo: ChatMessageTextTypography;
  onCancelRequest?: (requestMessageId: string) => void;
  isOwnMessage?: boolean;
}) {
  const ar = msg.aiRequest;
  if (!ar?.aiStatus) return null;

  const showCancel =
    onCancelRequest != null &&
    ar.cancelable &&
    (ar.aiStatus === "QUEUED" || ar.aiStatus === "PROCESSING");

  if (ar.aiStatus === "CANCELED") {
    return (
      <div
        className={cn(
          "mt-1 flex w-full max-w-full text-xs",
          isOwnMessage ? "justify-end" : "justify-start",
          typo.metaMuted,
        )}
      >
        <span>{labelForAiStatus(ar.aiStatus)}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-1 flex w-full max-w-full flex-row flex-wrap items-center gap-x-2 gap-y-1 text-xs",
        isOwnMessage ? "justify-between" : "justify-start",
        typo.metaMuted,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {ar.aiStatus === "PROCESSING" ? (
          <span className="inline-flex items-center gap-1.5">
            <span>{labelForAiStatus(ar.aiStatus)}</span>
            <Loader2
              className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-green"
              aria-hidden
            />
          </span>
        ) : (
          <span>{labelForAiStatus(ar.aiStatus)}</span>
        )}
      </div>
      {showCancel ? (
        <button
          type="button"
          className={cn(
            "shrink-0 underline underline-offset-2 hover:opacity-90",
            "text-neutral-700",
          )}
          onClick={() => onCancelRequest(ar.requestMessageId)}
        >
          취소
        </button>
      ) : null}
    </div>
  );
}

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
              className="max-w-full"
              {...(msg.isAiRequest ? { "data-chat-anchor": msg.id } : {})}
            >
              <div
                className={cn(
                  chrome.bubbleBase,
                  chrome.otherBubble,
                  typo.bubble,
                )}
              >
                <BubbleMessageText msg={msg} typo={typo} />
              </div>
              {msg.isAiRequest ? (
                <AiRequestMetaRow
                  msg={msg}
                  typo={typo}
                  isOwnMessage={false}
                />
              ) : null}
            </div>
          ))}
        </div>
        {groupTime && <GroupTimeStamp time={groupTime} typo={typo} />}
      </div>
    </div>
  );
}

export function MyMessageGroup({
  messages,
  isMinimized = false,
  onCancelAiRequest,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
  /** 내 AI_REQUEST 만 — `cancelable`·상태 조건 충족 시 취소 STOMP 발행 */
  onCancelAiRequest?: (requestMessageId: string) => void;
}) {
  const { typo, chrome } = getChatPanelLook(isMinimized);
  const groupTime = messages.findLast((m) => m.time)?.time;

  return (
    <div className="flex flex-col items-end gap-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="max-w-full"
          {...(msg.isAiRequest ? { "data-chat-anchor": msg.id } : {})}
        >
          <div
            className={cn(chrome.bubbleBase, chrome.mineBubble, typo.bubble)}
          >
            <BubbleMessageText msg={msg} typo={typo} />
          </div>
          {msg.isAiRequest ? (
            <div className="w-full">
              <AiRequestMetaRow
                msg={msg}
                typo={typo}
                onCancelRequest={onCancelAiRequest}
                isOwnMessage
              />
            </div>
          ) : null}
        </div>
      ))}
      {groupTime && <GroupTimeStamp time={groupTime} typo={typo} />}
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

function AiResponseBubble({
  msg,
  bubbleBase,
  aiBubble,
  typo,
  isMinimized,
  onReplyTargetClick,
}: {
  msg: ChatMessage;
  bubbleBase: string;
  aiBubble: string;
  typo: ChatMessageTextTypography;
  isMinimized: boolean;
  onReplyTargetClick?: (requestMessageId: string) => void;
}) {
  const reply = msg.aiRepliesTo;

  if (!reply) {
    return (
      <div
        className={cn(bubbleBase, aiBubble, typo.bubble)}
        style={{ whiteSpace: "pre-line" }}
      >
        {msg.text}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-fit max-w-full flex-col overflow-hidden",
        isMinimized ? "rounded-lg" : "rounded-xl",
        aiBubble,
      )}
    >
      <button
        type="button"
        className={cn(
          "w-full max-w-full border-b bg-black/15 border-white/70 text-left text-white/95 hover:bg-black/25",
          isMinimized ? "rounded-t-lg px-2.5 py-1" : "rounded-t-xl px-3 py-1.5",
        )}
        onClick={() => onReplyTargetClick?.(reply.requestMessageId)}
        aria-label="원본 질문으로 이동"
      >
        <span className="flex min-w-0 py-1 items-center gap-1.5">
          <Reply
            className={cn(
              "shrink-0 text-white/90",
              isMinimized ? "h-3 w-3" : "h-3.5 w-3.5",
            )}
            strokeWidth={2}
            aria-hidden
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-medium",
              isMinimized
                ? "text-[9px] leading-snug"
                : "text-[10px] leading-snug",
            )}
          >
            {reply.quotePreview}
          </span>
        </span>
      </button>
      <div
        className={cn(
          typo.bubble,
          isMinimized ? "rounded-b-lg px-3 py-1.5" : "rounded-b-xl px-4 py-2",
        )}
        style={{ whiteSpace: "pre-line" }}
      >
        {msg.text}
      </div>
    </div>
  );
}

export function AiMessageGroup({
  messages,
  isMinimized = false,
  onReplyTargetClick,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
  onReplyTargetClick?: (requestMessageId: string) => void;
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
            <AiResponseBubble
              key={msg.id}
              msg={msg}
              bubbleBase={chrome.bubbleBase}
              aiBubble={chrome.aiBubble}
              typo={typo}
              isMinimized={isMinimized}
              onReplyTargetClick={onReplyTargetClick}
            />
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
