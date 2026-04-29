"use client";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useSessionStore } from "@/stores/session-store";
import { useKickMember, useLeaveRoom, useRoomMembers, useRoomsList } from "@/hooks/useRooms";
import { MemberCard } from "./MemberCard";
import { AddMemberPanel } from "./AddMemberPanel";

export function RoomMembersSection() {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [kickTargetId, setKickTargetId] = useState<number | null>(null);

  const user = useSessionStore((s) => s.user);
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const clearCurrentRoomId = useSessionStore((s) => s.clearCurrentRoomId);
  const clearCurrentRoomInviteCode = useSessionStore((s) => s.clearCurrentRoomInviteCode);
  const inviteCode = useSessionStore((s) => s.currentRoomInviteCode);

  const { data: roomsData } = useRoomsList();
  const currentRoom = roomsData?.rooms.find((r) => r.id === currentRoomId);
  const isHost = currentRoom?.role === "HOST";

  const { mutate: kick, isPending: isKicking } = useKickMember();
  const { mutate: leave, isPending: isLeaving } = useLeaveRoom();

  const { data: membersData, isLoading: isMembersLoading } =
    useRoomMembers(currentRoomId);
  const members = membersData?.members ?? [];

  const me = members.find((m) => m.userId === user?.id);
  const others = members.filter((m) => m.userId !== user?.id);

  function handleLeaveRoom() {
    if (!currentRoomId) return;
    leave(currentRoomId, {
      onSuccess: () => {
        clearCurrentRoomId();
        clearCurrentRoomInviteCode();
        router.replace("/home");
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">멤버 관리</h2>
        {isHost && (
          <button
            onClick={() => setShowInvitePanel((v) => !v)}
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
          roomId={currentRoomId}
          inviteCode={inviteCode}
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
                    }}
                    isViewerHost={isHost}
                    onKick={() => setKickTargetId(member.userId)}
                    onTransfer={() => {
                      // TODO: transfer API
                    }}
                  />
                </div>

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

      {/* 멤버 없음 (방 미선택 등) */}
      {!isMembersLoading && members.length === 0 && !currentRoomId && (
        <p className="py-4 text-center text-sm text-dark-gray">
          방을 선택하면 멤버 목록이 표시됩니다.
        </p>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-2 border-t border-gray-border pt-4">
        {!showLeaveConfirm ? (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full rounded-xl border border-gray-border py-2.5 text-sm font-medium text-dark-gray transition-colors hover:border-brand-red hover:text-brand-red"
          >
            방 나가기
          </button>
        ) : (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 p-4">
            <p className="mb-3 text-sm font-medium text-gray-800">
              정말 방에서 나가시겠어요?
            </p>
            <p className="mb-4 text-xs leading-5 text-dark-gray">
              방을 나가면 현재 여행 플랜에 접근할 수 없게 됩니다.
              {isHost && (
                <span className="mt-1 block font-medium text-brand-red">
                  HOST가 나가면 다른 멤버에게 권한이 이전됩니다.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-xl border border-gray-border py-2.5 text-sm font-medium text-dark-gray transition-colors hover:border-gray-400 hover:text-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={isLeaving}
                className="flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLeaving ? "처리 중…" : "나가기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
