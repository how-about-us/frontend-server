"use client";

import { useState } from "react";
import Image from "next/image";

import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { MemberCard } from "./MemberCard";
import { AddMemberPanel } from "./AddMemberPanel";

export function RoomMembersSection() {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  const user = useSessionStore((s) => s.user);
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const inviteCode = useSessionStore((s) => s.currentRoomInviteCode);

  const { data: roomsData } = useRoomsList();
  const currentRoom = roomsData?.rooms.find((r) => r.id === currentRoomId);
  const isHost = currentRoom?.role === "HOST";

  function handleLeaveRoom() {
    setShowLeaveConfirm(false);
    // TODO: call leave-room API
    alert("방에서 나갔습니다.");
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

      {/* 나 (현재 유저) */}
      {user && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dark-gray">
            나
          </p>
          <div className="rounded-xl border border-gray-border bg-white">
            <MemberCard
              member={{
                id: String(user.id),
                name: user.nickname,
                avatarInitial: user.nickname.charAt(0),
                profileImageUrl: user.profileImageUrl,
                role: isHost ? "HOST" : "MEMBER",
                isCurrentUser: true,
              }}
              isViewerHost={isHost}
              onKick={() => {}}
              onTransfer={() => {}}
            />
          </div>
        </section>
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
                className="flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                나가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
