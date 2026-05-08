"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeleteConfirmModal } from "@/app/home/_components/DeleteConfirmModal";
import type { RoomMember } from "@/lib/api/rooms";
import { useKickMember, useLeaveRoom, useRoomMembers, useRoomsList, useTransferHost } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import { AddMemberPanel } from "./AddMemberPanel";
import { MemberCard } from "./MemberCard";

/** 방장 나가기 시 위임 대상: 멤버 목록에서 나를 제외한 첫 멤버(목록상 바로 아래에 가까운 순) */
function pickNextHost(
  members: RoomMember[],
  hostUserId: number,
): { userId: number; nickname: string } | null {
  const others = members.filter((m) => m.userId !== hostUserId);
  if (others.length === 0) return null;
  const m = others[0];
  return { userId: m.userId, nickname: m.nickname };
}

export function RoomMembersSection() {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [invitePanelKey, setInvitePanelKey] = useState(0);
  const [kickTargetId, setKickTargetId] = useState<number | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);

  const user = useSessionStore((s) => s.user);
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const clearCurrentRoomId = useSessionStore((s) => s.clearCurrentRoomId);
  const clearCurrentRoomInviteCode = useSessionStore((s) => s.clearCurrentRoomInviteCode);
  const clearCurrentRoomMeta = useSessionStore((s) => s.clearCurrentRoomMeta);
  const { data: roomsData } = useRoomsList();
  const currentRoom = roomsData?.rooms.find((r) => r.id === currentRoomId);
  const isHost = currentRoom?.role === "HOST";

  const { mutate: kick, isPending: isKicking } = useKickMember();
  const { mutateAsync: leaveAsync, isPending: isLeaving } = useLeaveRoom();
  const { mutate: transfer, mutateAsync: transferAsync, isPending: isTransferring } =
    useTransferHost();

  const { data: membersData, isLoading: isMembersLoading } =
    useRoomMembers(currentRoomId);
  const members = membersData?.members ?? [];

  const me = members.find((m) => m.userId === user?.id);
  const others = members.filter((m) => m.userId !== user?.id);
  const nextHost =
    user && isHost && !isMembersLoading ? pickNextHost(members, user.id) : null;
  const hostCannotLeaveAlone = Boolean(
    isHost && user && !isMembersLoading && others.length === 0,
  );

  function finishLeaveSession() {
    clearCurrentRoomId();
    clearCurrentRoomInviteCode();
    clearCurrentRoomMeta();
    router.replace("/home");
  }

  async function handleLeaveRoom() {
    if (!currentRoomId || !user) return;
    if (isHost && hostCannotLeaveAlone) {
      toast.error(
        "다른 멤버가 없어 방장을 넘길 수 없습니다. 여행 삭제를 이용해 주세요.",
      );
      return;
    }
    try {
      if (isHost) {
        const picked = pickNextHost(members, user.id);
        if (picked == null) {
          toast.error(
            "방장을 넘길 멤버가 없습니다. 여행 삭제를 이용해 주세요.",
          );
          return;
        }
        await transferAsync({
          roomId: currentRoomId,
          targetUserId: picked.userId,
        });
      }
      await leaveAsync(currentRoomId);
      finishLeaveSession();
    } catch {
      // useHttpError / 글로벌 처리 또는 서버 메시지
    }
  }

  return (
    <div className="relative flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">멤버 관리</h2>
        {isHost && (
          <button
            onClick={() => {
              setShowInvitePanel((open) => {
                if (!open) setInvitePanelKey((k) => k + 1);
                return !open;
              });
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showInvitePanel
                ? "border-brand-red bg-brand-red/5 text-brand-red"
                : "border-gray-border text-dark-gray hover:border-gray-400"
            }`}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5.5 1v9M1 5.5h9" />
            </svg>
            멤버 초대
          </button>
        )}
      </div>

      {/* 멤버 초대 패널 */}
      {showInvitePanel && currentRoomId && (
        <AddMemberPanel
          key={`${currentRoomId}-${invitePanelKey}`}
          roomId={currentRoomId}
          onClose={() => setShowInvitePanel(false)}
        />
      )}

      {/* 로딩 */}
      {isMembersLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
        </div>
      )}

      {/* 나 */}
      {!isMembersLoading && me && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dark-gray">
            나
          </p>
          <div className="rounded-xl border border-gray-border bg-white">
            <MemberCard
              member={{
                id: String(me.userId),
                name: me.nickname,
                avatarInitial: me.nickname.charAt(0),
                profileImageUrl: me.profileImageUrl,
                role: me.role,
                isCurrentUser: true,
                connectionStatus: me.isOnline ? "online" : "offline",
              }}
              isViewerHost={isHost}
              onKick={() => {}}
              onTransfer={() => {}}
            />
          </div>
        </section>
      )}

      {/* 다른 멤버 */}
      {!isMembersLoading && others.length > 0 && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dark-gray">
            멤버 · {others.length}
          </p>
          <div className="rounded-xl border border-gray-border bg-white">
            {others.map((member, i) => (
              <div key={member.userId}>
                <div
                  className={
                    i < others.length - 1 && kickTargetId !== member.userId
                      ? "border-b border-gray-border"
                      : ""
                  }
                >
                  <MemberCard
                    member={{
                      id: String(member.userId),
                      name: member.nickname,
                      avatarInitial: member.nickname.charAt(0),
                      profileImageUrl: member.profileImageUrl,
                      role: member.role,
                      isCurrentUser: false,
                      connectionStatus: member.isOnline ? "online" : "offline",
                    }}
                    isViewerHost={isHost}
                    onKick={() => {
                      setTransferTargetId(null);
                      setKickTargetId(member.userId);
                    }}
                    onTransfer={() => {
                      setKickTargetId(null);
                      setTransferTargetId(member.userId);
                    }}
                  />
                </div>

                {/* 방장 위임 확인 인라인 UI */}
                {transferTargetId === member.userId && (
                  <div className="border-b border-gray-border bg-brand-red/5 px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-gray-800">
                      <span className="font-semibold">{member.nickname}</span>님에게 방장을 위임하시겠어요?
                    </p>
                    <p className="mb-3 text-[11px] text-dark-gray">
                      위임 후 당신은 일반 멤버가 됩니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTransferTargetId(null)}
                        disabled={isTransferring}
                        className="flex-1 rounded-lg border border-gray-border py-1.5 text-xs font-medium text-dark-gray transition-colors hover:border-gray-400 disabled:opacity-40"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (!currentRoomId) return;
                          transfer(
                            { roomId: currentRoomId, targetUserId: member.userId },
                            { onSuccess: () => setTransferTargetId(null) },
                          );
                        }}
                        disabled={isTransferring}
                        className="flex-1 rounded-lg bg-brand-red py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {isTransferring ? "처리 중…" : "위임"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 추방 확인 인라인 UI */}
                {kickTargetId === member.userId && (
                  <div className="border-b border-gray-border bg-brand-red/5 px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-gray-800">
                      <span className="font-semibold">{member.nickname}</span>님을 추방하시겠어요?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setKickTargetId(null)}
                        disabled={isKicking}
                        className="flex-1 rounded-lg border border-gray-border py-1.5 text-xs font-medium text-dark-gray transition-colors hover:border-gray-400 disabled:opacity-40"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (!currentRoomId) return;
                          kick(
                            { roomId: currentRoomId, userId: member.userId },
                            { onSuccess: () => setKickTargetId(null) },
                          );
                        }}
                        disabled={isKicking}
                        className="flex-1 rounded-lg bg-brand-red py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {isKicking ? "처리 중…" : "추방"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-2 border-t border-gray-border pt-4">
        {!showLeaveConfirm ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {isHost && currentRoom && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-xl border border-brand-red/40 py-2.5 text-sm font-medium text-brand-red transition-colors hover:bg-brand-red/5"
              >
                여행 삭제
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="w-full rounded-xl border border-gray-border py-2.5 text-sm font-medium text-dark-gray transition-colors hover:border-brand-red hover:text-brand-red"
            >
              방 나가기
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 p-4">
            <p className="mb-3 text-sm font-medium text-gray-800">
              정말 방에서 나가시겠어요?
            </p>
            <p className="mb-4 text-xs leading-5 text-dark-gray">
              방을 나가면 현재 여행 플랜에 접근할 수 없게 됩니다.
              {isHost && !hostCannotLeaveAlone && nextHost && (
                <span className="mt-1 block font-medium text-brand-red">
                  방장 권한이{" "}
                  <span className="font-semibold">{nextHost.nickname}</span>님에게
                  넘어간 뒤 나가요.
                </span>
              )}
              {isHost && hostCannotLeaveAlone && (
                <span className="mt-1 block font-medium text-brand-red">
                  다른 멤버가 없으면 나갈 수 없습니다. 여행 삭제를 이용해 주세요.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLeaving || isTransferring}
                className="flex-1 rounded-xl border border-gray-border py-2.5 text-sm font-medium text-dark-gray transition-colors hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleLeaveRoom();
                }}
                disabled={
                  isLeaving ||
                  isTransferring ||
                  hostCannotLeaveAlone ||
                  (isHost && isMembersLoading)
                }
                className="flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLeaving || isTransferring ? "처리 중…" : "나가기"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && currentRoom && (
        <DeleteConfirmModal
          room={currentRoom}
          onClose={() => setShowDeleteConfirm(false)}
          onDeleted={finishLeaveSession}
        />
      )}
    </div>
  );
}
