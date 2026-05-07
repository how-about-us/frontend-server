import type { ChatMessage } from "@/types/chat";
import { AiHighlightedText } from "@/components/chat/lib/aiHighlightedText";
import { AiConversationSummaryContent } from "@/components/chat/messages/AiConversationSummaryContent";
import { AiRecommendedPlacesList } from "@/components/chat/messages/AiRecommendedPlacesList";
import type { ChatMessageTextTypography } from "@/components/chat/lib/chatTypography";
import { cn } from "@/lib/utils";
import { Reply } from "lucide-react";

function AiResponseBody({
  msg,
  isMinimized,
}: {
  msg: ChatMessage;
  isMinimized: boolean;
}) {
  return (
    <>
      <AiHighlightedText text={msg.text} />
      {msg.aiIntent === "place_recommendation" &&
      msg.aiRecommendedPlaces?.length ?
        <AiRecommendedPlacesList
          places={msg.aiRecommendedPlaces}
          heading={msg.aiPlaceRecommendationHeading}
          isMinimized={isMinimized}
        />
      : null}
      {msg.aiIntent === "conversation_summary" &&
      msg.aiConversationSummary ?
        <AiConversationSummaryContent
          summary={msg.aiConversationSummary}
          isMinimized={isMinimized}
        />
      : null}
    </>
  );
}

export function AiResponseBubble({
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
      <div className={cn(bubbleBase, aiBubble, typo.bubble)}>
        <AiResponseBody msg={msg} isMinimized={isMinimized} />
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
        <span className="flex min-w-0 items-center gap-1.5 py-1">
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
      >
        <AiResponseBody msg={msg} isMinimized={isMinimized} />
      </div>
    </div>
  );
}
