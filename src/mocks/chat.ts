export type ChatMessage = {
  id: string;
  type: "other" | "mine" | "system";
  sender?: string;
  avatar?: string;
  text: string;
  time?: string;
};

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    type: "other",
    sender: "홍길동",
    avatar: "https://picsum.photos/seed/hong/80/80",
    text: "omg, this is amazing",
    time: "19:13",
  },
  {
    id: "2",
    type: "other",
    sender: "홍길동",
    avatar: "https://picsum.photos/seed/hong/80/80",
    text: "perfect! ✅",
  },
  {
    id: "3",
    type: "other",
    sender: "홍길동",
    avatar: "https://picsum.photos/seed/hong/80/80",
    text: "Wow, this is really epic",
  },
  {
    id: "4",
    type: "mine",
    text: "How are you?",
    time: "19:13",
  },
  {
    id: "5",
    type: "other",
    sender: "김철수",
    avatar: "https://picsum.photos/seed/kim/80/80",
    text: "just ideas for next time",
    time: "19:13",
  },
  {
    id: "6",
    type: "other",
    sender: "김철수",
    avatar: "https://picsum.photos/seed/kim/80/80",
    text: "I'll be there in 2 mins ⏰",
  },
  {
    id: "7",
    type: "system",
    text: "홍길동이 채팅에 새로 참여했습니다.",
  },
  {
    id: "8",
    type: "mine",
    text: "woohoooo",
  },
  {
    id: "9",
    type: "mine",
    text: "Haha oh man",
  },
  {
    id: "10",
    type: "mine",
    text: "Haha that's terrifying 😂",
    time: "19:13",
  },
  {
    id: "11",
    type: "other",
    sender: "김민수",
    avatar: "https://picsum.photos/seed/minsu/80/80",
    text: "aww",
  },
  {
    id: "12",
    type: "other",
    sender: "김민수",
    avatar: "https://picsum.photos/seed/minsu/80/80",
    text: "omg, this is amazing",
  },
  {
    id: "13",
    type: "other",
    sender: "김민수",
    avatar: "https://picsum.photos/seed/minsu/80/80",
    text: "woohoooo 🔥",
    time: "19:13",
  },
];
