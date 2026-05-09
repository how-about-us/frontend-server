import type { ChatMessage } from "@/types/chat";

export function groupConsecutiveMessages(
  messages: ChatMessage[],
): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.type === "system" || msg.type === "place") {
      if (current.length) {
        groups.push(current);
        current = [];
      }
      groups.push([msg]);
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
