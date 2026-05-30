"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { useUpdateScheduleItem } from "@/hooks/useRooms";
import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

import { PlanCollapsibleField } from "./PlanPlaceCardParts";

const SCHEDULE_ITEM_MEMO_MAX_LENGTH = 2000;

type PlanItemMemoFormProps = {
  roomId: string;
  scheduleId: number;
  itemId: number;
  memo?: string;
};

function stopCardActivation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function normalizeMemoDraft(value: string): string {
  return value.trim();
}

function isLocallyDirty(draft: string, editStartMemo: string): boolean {
  return normalizeMemoDraft(draft) !== normalizeMemoDraft(editStartMemo);
}

function MemoOverwriteConfirmDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="memo-overwrite-dialog-title"
        aria-describedby="memo-overwrite-dialog-desc"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-gray-border bg-white p-5 shadow-lg"
      >
        <h2
          id="memo-overwrite-dialog-title"
          className="text-base font-semibold text-gray-900"
        >
          다른 사람의 입력을 덮어씁니다!
        </h2>
        <p
          id="memo-overwrite-dialog-desc"
          className="mt-2 text-sm leading-relaxed text-dark-gray"
        >
          다른 멤버가 메모를 수정했어요. 저장하면 그 내용 대신 지금 작성 중인
          메모로 바뀝니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-gray-border px-3 py-1.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-brand-green px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "저장 중…" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlanItemMemoReadOnly({ memo }: { memo: string }) {
  const text = memo.trim();
  if (!text.length) return null;

  return (
    <p className="line-clamp-2 whitespace-pre-wrap break-words text-[10px] leading-snug text-dark-gray/75">
      {text}
    </p>
  );
}

export function PlanItemMemoForm({
  roomId,
  scheduleId,
  itemId,
  memo,
}: PlanItemMemoFormProps) {
  const panelId = useId();
  const incomingMemo = memo ?? "";
  const editStartMemoRef = useRef(normalizeMemoDraft(incomingMemo));
  const [draft, setDraft] = useState(incomingMemo);
  const [expanded, setExpanded] = useState(false);
  const [hasRemoteConflict, setHasRemoteConflict] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const { mutateAsync, isPending } = useUpdateScheduleItem();

  useEffect(() => {
    const incoming = normalizeMemoDraft(incomingMemo);

    if (!isLocallyDirty(draft, editStartMemoRef.current)) {
      setDraft(incomingMemo);
      editStartMemoRef.current = incoming;
      setHasRemoteConflict(false);
      return;
    }

    if (incoming !== editStartMemoRef.current) {
      setHasRemoteConflict(true);
    }
  }, [incomingMemo, draft]);

  const dirty = isLocallyDirty(draft, editStartMemoRef.current);

  const collapsedHintSource =
    dirty ? normalizeMemoDraft(draft) : normalizeMemoDraft(incomingMemo);
  const collapsedHint =
    collapsedHintSource.length > 0 ? collapsedHintSource : undefined;

  const commitSave = useCallback(async () => {
    const next = normalizeMemoDraft(draft);
    if (next.length > SCHEDULE_ITEM_MEMO_MAX_LENGTH) {
      toast.error(
        `메모는 ${SCHEDULE_ITEM_MEMO_MAX_LENGTH}자 이하여야 해요.`,
      );
      return;
    }
    try {
      await mutateAsync({
        roomId,
        scheduleId,
        itemId,
        body: { memo: next.length > 0 ? next : "" },
      });
      editStartMemoRef.current = next;
      setHasRemoteConflict(false);
      setOverwriteDialogOpen(false);
      toast.success(next.length > 0 ? "메모를 저장했어요." : "메모를 삭제했어요.");
      setExpanded(false);
    } catch {
      toast.error("메모를 저장하지 못했어요.");
    }
  }, [draft, itemId, mutateAsync, roomId, scheduleId]);

  async function handleSave() {
    const next = normalizeMemoDraft(draft);
    if (next.length > SCHEDULE_ITEM_MEMO_MAX_LENGTH) {
      toast.error(
        `메모는 ${SCHEDULE_ITEM_MEMO_MAX_LENGTH}자 이하여야 해요.`,
      );
      return;
    }
    if (hasRemoteConflict) {
      setOverwriteDialogOpen(true);
      return;
    }
    await commitSave();
  }

  return (
    <>
      <PlanCollapsibleField
        label="메모"
        collapsedHint={collapsedHint}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        disabled={isPending}
        panelId={panelId}
      >
        <textarea
          aria-label="일정 메모"
          value={draft}
          maxLength={SCHEDULE_ITEM_MEMO_MAX_LENGTH}
          rows={2}
          placeholder="메모를 입력하세요"
          disabled={isPending}
          onMouseDown={stopCardActivation}
          onClick={stopCardActivation}
          onChange={(e) => setDraft(e.target.value)}
          className={cn(PLAN_PLACE_CARD_TW.memoTextarea, "select-text cursor-text")}
        />
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] tabular-nums text-dark-gray/55">
            {draft.length}/{SCHEDULE_ITEM_MEMO_MAX_LENGTH}
          </span>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isPending || !dirty}
            className={cn(
              "shrink-0 cursor-pointer rounded-md bg-brand-green font-medium text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-40",
              PLAN_PLACE_CARD_TW.timeSaveButtonCompact,
            )}
          >
            {isPending ? "…" : "저장"}
          </button>
        </div>
      </PlanCollapsibleField>

      <MemoOverwriteConfirmDialog
        open={overwriteDialogOpen}
        isPending={isPending}
        onCancel={() => setOverwriteDialogOpen(false)}
        onConfirm={() => void commitSave()}
      />
    </>
  );
}
