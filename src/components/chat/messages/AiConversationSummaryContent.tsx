"use client";

import { AiHighlightedText } from "@/components/chat/chat-ai-highlighted-text";
import {
  chatAiBubbleListTextClass,
  chatAiBubbleMutedListClass,
  chatAiBubbleOverviewBodyClass,
  chatAiBubbleSectionLabelClass,
  chatAiBubbleBlockTitleClass,
} from "@/components/chat/chat-typography";
import type { AiConversationSummaryPayload } from "@/types/chat";
import { cn } from "@/lib/utils";

export function AiConversationSummaryContent({
  summary,
  isMinimized,
}: {
  summary: AiConversationSummaryPayload;
  isMinimized: boolean;
}) {
  const titleCls = chatAiBubbleBlockTitleClass(isMinimized);
  const bodyCls = chatAiBubbleOverviewBodyClass(isMinimized);
  const sectionTitleCls = chatAiBubbleSectionLabelClass(isMinimized);
  const listCls = chatAiBubbleListTextClass(isMinimized);
  const mentionListCls = chatAiBubbleMutedListClass(isMinimized);

  return (
    <div className="mt-2 space-y-3 border-t border-slate-300/80 pt-2">
      <div className={titleCls}>
        <AiHighlightedText text={summary.title} />
      </div>
      <div className={bodyCls}>
        <AiHighlightedText text={summary.overview} />
      </div>

      {summary.sections?.map((sec) => {
        if (!sec.items?.length) return null;
        return (
          <div key={`${sec.type}-${sec.title}`} className="space-y-1">
            <div className={sectionTitleCls}>{sec.title}</div>
            <ul className={cn("list-disc space-y-0.5 pl-4", listCls)}>
              {sec.items.map((item, idx) => (
                <li key={idx}>
                  <AiHighlightedText text={item} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {summary.mentionedPlaces?.length ? (
        <div className="space-y-1">
          <div className={sectionTitleCls}>언급된 장소</div>
          <ul className={mentionListCls}>
            {summary.mentionedPlaces.map((mp, idx) => (
              <li key={`${mp.name}-${idx}`}>
                <span className="font-medium text-gray-900">{mp.name}</span>
                {mp.source ? (
                  <span className="text-[9px] text-gray-500">
                    {" "}
                    · {mp.source}
                  </span>
                ) : null}
                {mp.note ? (
                  <span className="mt-0.5 block text-gray-600">
                    <AiHighlightedText text={mp.note} />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
