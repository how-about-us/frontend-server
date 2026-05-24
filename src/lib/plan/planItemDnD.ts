import { setHtmlDragImageFromPointer } from "@/lib/dnd/setHtmlDragImageFromPointer";

export const PLAN_ITEM_DND_INDEX_MIME = "application/x-plan-item-index";

export function beginPlanItemDrag(
  event: DragEvent,
  source: HTMLElement,
  fromIndex: number,
): void {
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return;

  setHtmlDragImageFromPointer(event, source);
  dataTransfer.effectAllowed = "move";
  dataTransfer.setData(PLAN_ITEM_DND_INDEX_MIME, String(fromIndex));
  dataTransfer.setData("text/plain", String(fromIndex));
}

export function readPlanItemDragIndex(dataTransfer: DataTransfer): number {
  const raw =
    dataTransfer.getData(PLAN_ITEM_DND_INDEX_MIME) ||
    dataTransfer.getData("text/plain");
  return parseInt(raw, 10);
}
