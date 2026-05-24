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

/** 하단 고정이면 맨 아래, 아니면 마지막 스크롤 시점의 하단 거리(px) 유지 */
function applyScrollAnchor(
  root: HTMLDivElement,
  followTail: boolean,
  distFromBottom: number,
) {
  if (followTail) {
    scrollRootToBottomInstant(root);
    return;
  }
  root.scrollTop = Math.max(
    0,
    root.scrollHeight - root.clientHeight - distFromBottom,
  );
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
  onAtBottom,
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
  /** 스크롤이 하단 근처일 때 읽음 처리 */
  onAtBottom?: () => void;
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
  /** 패널 리사이즈·최소화 전환 시 하단에서 떨어진 거리(px) 복원용 */
  const distFromBottomRef = useRef(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  /** 하단으로 부드럽게 이동 중 상태 정리용 */
  const [smoothJumpToBottom, setSmoothJumpToBottom] = useState(false);

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
      setSmoothJumpToBottom(true);
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
    distFromBottomRef.current = dist;
    const near = dist < NEAR_BOTTOM_PX;
    followTailRef.current = near;
    setIsAtBottom(near);
    if (near) onAtBottom?.();
  }, [onAtBottom]);

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

  useEffect(() => {
    if (!smoothJumpToBottom) return;
    const root = scrollRootRef.current;
    if (!root) return;
    const finish = () => setSmoothJumpToBottom(false);
    root.addEventListener("scrollend", finish);
    const t = window.setTimeout(finish, 800);
    return () => {
      root.removeEventListener("scrollend", finish);
      window.clearTimeout(t);
    };
  }, [smoothJumpToBottom]);

  /** 최소화↔확대·패널 높이 변경 시 scrollTop만 유지되면 위로 밀려 보이므로 앵커 복원 */
  useLayoutEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;

    const restore = () => {
      applyScrollAnchor(root, followTailRef.current, distFromBottomRef.current);
      const dist =
        root.scrollHeight - root.scrollTop - root.clientHeight;
      const near = dist < NEAR_BOTTOM_PX;
      followTailRef.current = near;
      setIsAtBottom(near);
      scrollPreserveRef.current = { sh: root.scrollHeight, st: root.scrollTop };
    };

    restore();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      restore();
      raf2 = requestAnimationFrame(restore);
    });
    const t = window.setTimeout(restore, 320);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t);
    };
  }, [isMinimized]);

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;

    const lastClientHeightRef = { current: root.clientHeight };

    const ro = new ResizeObserver(() => {
      const ch = root.clientHeight;
      if (ch === lastClientHeightRef.current) return;
      lastClientHeightRef.current = ch;

      applyScrollAnchor(
        root,
        followTailRef.current,
        distFromBottomRef.current,
      );
      const dist = root.scrollHeight - root.scrollTop - root.clientHeight;
      const near = dist < NEAR_BOTTOM_PX;
      followTailRef.current = near;
      setIsAtBottom(near);
      scrollPreserveRef.current = { sh: root.scrollHeight, st: root.scrollTop };
    });

    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRootRef}
        onScroll={handleScroll}
        className={cn(
          "chat-message-list-scroll min-h-0 flex-1 bg-white",
          isMinimized && "chat-message-list-scroll--minimized",
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            isMinimized ? "gap-2 px-2 py-1.5" : "gap-3 px-3 py-2",
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
                <div
                  className={cn(
                    "flex flex-col items-center",
                    isMinimized ? "gap-0.5" : "gap-1",
                  )}
                >
                  {group.map((m) => (
                    <SystemMessage
                      key={m.id}
                      message={m}
                      isMinimized={isMinimized}
                    />
                  ))}
                </div>
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
          <div ref={bottomRef} />
        </div>
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
