"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { ChatMessage } from "@/types/chat";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import {
  groupConsecutiveMessages,
  isChatHistoryPrependSnapshot,
} from "../chat-message-utils";
import { getChatMessageMotion } from "../chat-animations";
import {
  OtherMessageGroup,
  MyMessageGroup,
  SystemMessage,
  AiMessageGroup,
} from "./ChatMessageGroup";
import { PlaceShareCard } from "./PlaceShareCard";
import { JumpToBottomButton } from "./JumpToBottomButton";

const NEAR_BOTTOM_PX = 80;

function syncFollowTailFromScrollRoot(
  root: HTMLDivElement,
  followTailRef: MutableRefObject<boolean>,
) {
  const dist = root.scrollHeight - root.scrollTop - root.clientHeight;
  followTailRef.current = dist < NEAR_BOTTOM_PX;
}

function scrollRootToBottomInstant(root: HTMLDivElement) {
  root.scrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
}

export function ChatMessageList({
  messages,
  isMinimized = false,
  onCancelAiRequest,
  onLoadOlder,
  hasMoreOlder = false,
  isLoadingOlder = false,
  hasMoreNewer = false,
  onJumpToLatest,
  initialScrollAnchorId,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
  onCancelAiRequest?: (requestMessageId: string) => void;
  onLoadOlder?: () => void;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
  hasMoreNewer?: boolean;
  onJumpToLatest?: () => void;
  /** 최초 로드 시 이 메시지로 스크롤 정렬 (없으면 최하단) */
  initialScrollAnchorId?: string;
}) {
  const groups = groupConsecutiveMessages(messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const myId = useSessionStore((s) => s.user?.id);
  const reduceMotion = useReducedMotion();

  const prevCountRef = useRef(0);
  const prevFirstIdRef = useRef<string | undefined>(undefined);
  const scrollPreserveRef = useRef({ sh: 0, st: 0 });
  const didInitialScrollRef = useRef(false);
  /** 사용자가 직접 스크롤할 때만 갱신. 레이아웃만 바뀌어 dist가 커져도 끊기지 않게 함 */
  const followTailRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const firstId = messages[0]?.id;
  const count = messages.length;
  /** 레이아웃 이펙트가 ref를 갱신하기 전에는 직전 스냅샷 → 과거 prepend 프레임만 집어냄 */
  const isHistoryPrepend = isChatHistoryPrependSnapshot(
    prevCountRef.current,
    prevFirstIdRef.current,
    count,
    firstId,
  );

  const scrollToBottomSmooth = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const handleJumpClick = useCallback(() => {
    followTailRef.current = true;
    if (hasMoreNewer && onJumpToLatest) {
      onJumpToLatest();
    } else {
      scrollToBottomSmooth();
    }
  }, [hasMoreNewer, onJumpToLatest, scrollToBottomSmooth]);

  const scrollToMessage = useCallback((messageId: string) => {
    const root = scrollRootRef.current;
    if (!root) return;
    const el = root.querySelector(
      `[data-chat-anchor="${CSS.escape(messageId)}"]`,
    );
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    scrollPreserveRef.current = {
      sh: root.scrollHeight,
      st: root.scrollTop,
    };
    const dist = root.scrollHeight - root.scrollTop - root.clientHeight;
    const near = dist < NEAR_BOTTOM_PX;
    followTailRef.current = near;
    setIsAtBottom(near);
  }, []);

  useLayoutEffect(() => {
    const root = scrollRootRef.current;
    const bottom = bottomRef.current;
    if (!root) return;

    const prevSh = scrollPreserveRef.current.sh;
    const prevSt = scrollPreserveRef.current.st;

    const prevCount = prevCountRef.current;
    const prevFirst = prevFirstIdRef.current;

    const firstId = messages[0]?.id;
    const count = messages.length;

    if (prevCount > 0 && count === 0) {
      didInitialScrollRef.current = false;
    }

    const prepended = isChatHistoryPrependSnapshot(
      prevCount,
      prevFirst,
      count,
      firstId,
    );

    if (prepended && prevSh > 0) {
      const newSh = root.scrollHeight;
      root.scrollTop = newSh - prevSh + prevSt;
    } else if (prevCount === 0 && count > 0 && !didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      if (initialScrollAnchorId) {
        const el = root.querySelector(
          `[data-chat-anchor="${CSS.escape(initialScrollAnchorId)}"]`,
        );
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
        } else {
          bottom?.scrollIntoView({ behavior: "auto", block: "end" });
        }
      } else {
        bottom?.scrollIntoView({ behavior: "auto", block: "end" });
      }
      syncFollowTailFromScrollRoot(root, followTailRef);
    } else if (followTailRef.current && !prepended && count > 0) {
      scrollRootToBottomInstant(root);
    }

    prevCountRef.current = count;
    prevFirstIdRef.current = firstId;
    scrollPreserveRef.current = {
      sh: root.scrollHeight,
      st: root.scrollTop,
    };
    const distAfter = root.scrollHeight - root.scrollTop - root.clientHeight;
    setIsAtBottom(distAfter < NEAR_BOTTOM_PX);
    requestAnimationFrame(() => {
      const r = scrollRootRef.current;
      if (!r) return;
      const d = r.scrollHeight - r.scrollTop - r.clientHeight;
      setIsAtBottom(d < NEAR_BOTTOM_PX);
      scrollPreserveRef.current = { sh: r.scrollHeight, st: r.scrollTop };
    });
  }, [messages, initialScrollAnchorId]);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || !onLoadOlder || !hasMoreOlder) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit && !isLoadingOlder) {
          onLoadOlder();
        }
      },
      { root, rootMargin: "48px 0px 0px 0px", threshold: 0 },
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [onLoadOlder, hasMoreOlder, isLoadingOlder]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRootRef}
        onScroll={handleScroll}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto bg-brand-green/8 px-3 py-2 [scrollbar-color:#d9d9d9_transparent]",
          isMinimized && "px-2 py-1.5",
        )}
      >
        <div
          ref={topSentinelRef}
          className={cn("shrink-0", isMinimized ? "min-h-1" : "min-h-2")}
          aria-hidden
        />
        {isLoadingOlder ? (
          <div
            className={cn(
              "mb-2 flex min-h-[1.25rem] items-center justify-center text-center text-xs text-black/45",
              isMinimized && "mb-1.5 min-h-4 text-[10px]",
            )}
            aria-live="polite"
          >
            이전 메시지 불러오는 중…
          </div>
        ) : null}
        <div className={cn("flex flex-col", isMinimized ? "gap-2" : "gap-3")}>
          {groups.map((group) => {
            const type = group[0].type;
            const placeIsMine =
              type === "place" &&
              myId != null &&
              group[0].senderUserId != null &&
              group[0].senderUserId === myId;
            const motionCfg = getChatMessageMotion(type, { placeIsMine });

            const inner =
              type === "system" ? (
                <SystemMessage message={group[0]} isMinimized={isMinimized} />
              ) : type === "place" ? (
                <PlaceShareCard message={group[0]} isMinimized={isMinimized} />
              ) : type === "mine" ? (
                <MyMessageGroup
                  messages={group}
                  isMinimized={isMinimized}
                  onCancelAiRequest={onCancelAiRequest}
                />
              ) : type === "ai" ? (
                <AiMessageGroup
                  messages={group}
                  isMinimized={isMinimized}
                  onReplyTargetClick={scrollToMessage}
                />
              ) : (
                <OtherMessageGroup messages={group} isMinimized={isMinimized} />
              );

            const skipEnterMotion = Boolean(reduceMotion || isHistoryPrepend);

            return (
              <motion.div
                key={group[0].id}
                data-chat-anchor={group[0].id}
                initial={skipEnterMotion ? false : motionCfg.initial}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                transition={
                  skipEnterMotion ? { duration: 0 } : motionCfg.transition
                }
              >
                {inner}
              </motion.div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>
      <AnimatePresence>
        {!isAtBottom && (
          <JumpToBottomButton
            key="jump-bottom"
            isMinimized={isMinimized}
            onClick={handleJumpClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
