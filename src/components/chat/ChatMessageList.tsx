import type { ChatMessage } from "@/mocks";
import { groupConsecutiveMessages } from "./chat.utils";
import {
  OtherMessageGroup,
  MyMessageGroup,
  SystemMessage,
} from "./ChatMessageGroup";

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  const groups = groupConsecutiveMessages(messages);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-3 py-2 [scrollbar-color:rgba(0,0,0,0.2)_transparent]">
      <div className="flex flex-col gap-1">
        {groups.map((group, i) => {
          const type = group[0].type;
          if (type === "system")
            return <SystemMessage key={i} message={group[0]} />;
          if (type === "mine")
            return <MyMessageGroup key={i} messages={group} />;
          return <OtherMessageGroup key={i} messages={group} />;
        })}
      </div>
    </div>
  );
}
