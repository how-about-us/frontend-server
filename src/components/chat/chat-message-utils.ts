import type { ChatMessage } from "@/types/chat";

/** 과거 메시지 prepend 직후 리스트 스냅샷(스크롤·모션 분기용) */
export function isChatHistoryPrependSnapshot(
  prevCount: number,
  prevFirstId: string | undefined,
  nextCount: number,
  nextFirstId: string | undefined,
): boolean {
  return (
    nextCount > prevCount &&
    prevCount > 0 &&
    nextFirstId !== undefined &&
    nextFirstId !== prevFirstId
  );
}

/** 하단에 메시지가 append된 직후 리스트 스냅샷(스크롤 위치 유지용) */
export function isChatHistoryAppendSnapshot(
  prevCount: number,
  prevFirstId: string | undefined,
  nextCount: number,
  nextFirstId: string | undefined,
): boolean {
  return (
    nextCount > prevCount &&
    prevCount > 0 &&
    nextFirstId !== undefined &&
    nextFirstId === prevFirstId
  );
}

export function groupConsecutiveMessages(
  messages: ChatMessage[],
): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.type === "place") {
      if (current.length) {
        groups.push(current);
        current = [];
      }
      groups.push([msg]);
      continue;
    }

    if (msg.type === "system") {
      if (current.length) {
        groups.push(current);
        current = [];
      }
      const tail = groups[groups.length - 1];
      if (tail && tail[0]?.type === "system") {
        tail.push(msg);
      } else {
        groups.push([msg]);
      }
      continue;
    }

    const prev = current[current.length - 1];
    const sameSenderGroup =
      prev &&
      prev.type === msg.type &&
      ((msg.type === "mine" || msg.type === "other") &&
      prev.senderUserId != null &&
      msg.senderUserId != null
        ? prev.senderUserId === msg.senderUserId
        : prev.sender === msg.sender);

    if (sameSenderGroup) {
      current.push(msg);
    } else {
      if (current.length) groups.push(current);
      current = [msg];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}
