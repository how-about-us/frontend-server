"use client";

import { useState } from "react";
import { MOCK_ROOM_MEMBERS, type RoomMember } from "@/mocks/members";
import { MemberCard } from "./MemberCard";
import { AddMemberPanel } from "./AddMemberPanel";

export function RoomMembersSection() {
  const [members, setMembers] = useState<RoomMember[]>(MOCK_ROOM_MEMBERS);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const currentUser = members.find((m) => m.isCurrentUser);
  const isViewerAdmin = currentUser?.role === "ADMIN";
  const onlineCount = members.filter((m) => m.status === "online").length;
  const onlineMembers = members.filter((m) => m.status === "online");
  const offlineMembers = members.filter((m) => m.status === "offline");

  function handleKick(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  function handleTransfer(memberId: string) {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.isCurrentUser) return { ...m, role: "MEMBER" };
        if (m.id === memberId) return { ...m, role: "ADMIN" };
        return m;
      }),
    );
  }

  function handleAddMember(name: string) {
    const avatarInitial = name.charAt(0);
    const newMember: RoomMember = {
      id: `user-${Date.now()}`,
      name,
      avatarInitial,
      role: "MEMBER",
      status: "offline",
    };
    setMembers((prev) => [...prev, newMember]);
    setShowAddPanel(false);
  }

  function handleLeaveRoom() {
    setShowLeaveConfirm(false);
    // TODO: call leave-room API
    alert("방에서 나갔습니다.");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">멤버 관리</h2>
        </div>
        {isViewerAdmin && (
          <button
            onClick={() => setShowAddPanel((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showAddPanel
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
            멤버 추가
          </button>
        )}
      </div>

      {/* 멤버 추가 패널 */}
      {showAddPanel && (
        <AddMemberPanel
          onAdd={handleAddMember}
          onClose={() => setShowAddPanel(false)}
        />
      )}

      {/* 현재 접속 중인 유저 */}
      {onlineMembers.length > 0 && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dark-gray">
            온라인 · {onlineMembers.length}
          </p>
          <div className="rounded-xl border border-gray-border bg-white">
            {onlineMembers.map((member, i) => (
              <div
                key={member.id}
                className={
                  i < onlineMembers.length - 1
                    ? "border-b border-gray-border"
                    : ""
                }
              >
                <MemberCard
                  member={member}
                  isViewerAdmin={isViewerAdmin}
                  onKick={handleKick}
                  onTransfer={handleTransfer}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 오프라인 유저 */}
      {offlineMembers.length > 0 && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dark-gray">
            오프라인 · {offlineMembers.length}
          </p>
          <div className="rounded-xl border border-gray-border bg-white">
            {offlineMembers.map((member, i) => (
              <div
                key={member.id}
                className={
                  i < offlineMembers.length - 1
                    ? "border-b border-gray-border"
                    : ""
                }
              >
                <MemberCard
                  member={member}
                  isViewerAdmin={isViewerAdmin}
                  onKick={handleKick}
                  onTransfer={handleTransfer}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 하단 버튼 영역 */}
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
              {isViewerAdmin && (
                <span className="mt-1 block font-medium text-brand-red">
                  ADMIN이 나가면 다른 멤버에게 권한이 이전됩니다.
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
