export type ChatMessage = {
  id: string;
  type: "other" | "mine" | "system" | "ai";
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
  {
    id: "14",
    type: "mine",
    text: "@AI 히코네 여행에서 꼭 가야 할 곳 추천해줘",
    time: "19:14",
  },
  {
    id: "15",
    type: "ai",
    text: "안녕하세요 WOORI입니다!\n\n히코네 여행 필수 코스를 안내해드릴게요.\n\n• 히코네성 — 일본 국보 천수각, 약 400년 역사\n• 겐큐엔 정원 — 성 바로 옆, 봄 벚꽃이 유명\n• 유메쿄바시 캐슬로드 — 레트로 상점가 산책\n• 비와코 유람선 — 비와코 호수 선셋 크루즈",
    time: "19:14",
  },
  {
    id: "16",
    type: "ai",
    text: "히코네성 입장료는 성인 800엔이에요. 오전 8시 30분부터 오후 5시까지 운영합니다.",
  },
  {
    id: "17",
    type: "mine",
    text: "완전 도움됐어 고마워!",
    time: "19:15",
  },
];
