/**
 * HTML5 D&D 고스트 이미지를 포인터 위치와 맞춥니다.
 * 스크롤 컨테이너·레이아웃 변형(scale 등)으로 기본 고스트가 어긋날 때 사용합니다.
 */
export function setHtmlDragImageFromPointer(
  event: DragEvent,
  source: HTMLElement,
): void {
  const rect = source.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  clone.style.width = `${rect.width}px`;
  clone.style.boxSizing = "border-box";
  clone.style.position = "fixed";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.opacity = "1";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "-1";

  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return;

  document.body.appendChild(clone);
  dataTransfer.setDragImage(clone, offsetX, offsetY);

  document.addEventListener(
    "dragend",
    () => {
      clone.remove();
    },
    { once: true },
  );
}
