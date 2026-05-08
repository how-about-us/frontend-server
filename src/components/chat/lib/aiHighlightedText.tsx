import { cn } from "@/lib/utils";
import { chatAiBubbleEmphasisClass } from "@/components/chat/lib/chatTypography";

/** `**강조**` 구간을 분리 — 구분자는 짝수 개만 강조로 처리(마크다운과 동일). */
function splitDoubleStars(text: string): Array<{
  text: string;
  emphasized: boolean;
}> {
  const chunks = text.split(/\*\*/);
  const out: Array<{ text: string; emphasized: boolean }> = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk === "") continue;
    out.push({ text: chunk, emphasized: i % 2 === 1 });
  }
  return out;
}

export function AiHighlightedText({
  text,
  className,
  emphasisClassName,
}: {
  text: string;
  className?: string;
  /** 기본: 채팅 녹색 말풍선용 은은한 크림 강조 (`chatAiBubbleEmphasisClass`) */
  emphasisClassName?: string;
}) {
  const parts = splitDoubleStars(text);
  const emphasisCls = emphasisClassName ?? chatAiBubbleEmphasisClass;

  if (parts.length === 0) {
    return (
      <span className={cn("whitespace-pre-wrap break-words", className)}>
        {text === "" ? null : text}
      </span>
    );
  }

  return (
    <span className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((p, index) =>
        p.emphasized ? (
          <span key={index} className={emphasisCls}>
            {p.text}
          </span>
        ) : (
          <span key={index}>{p.text}</span>
        ),
      )}
    </span>
  );
}
