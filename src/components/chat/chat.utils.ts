import type { ChatMessage } from "@/mocks";

export function groupConsecutiveMessages(
  messages: ChatMessage[],
): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    const prev = current[current.length - 1];
    if (prev && prev.type === msg.type && prev.sender === msg.sender) {
      current.push(msg);
    } else {
      if (current.length) groups.push(current);
      current = [msg];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}
