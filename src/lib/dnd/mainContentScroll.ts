export const MAIN_CONTENT_SCROLL_SELECTOR = "[data-main-content-scroll]";

export function resolveMainContentScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MAIN_CONTENT_SCROLL_SELECTOR);
}

export function readMainContentScrollTop(): number {
  return resolveMainContentScrollRoot()?.scrollTop ?? 0;
}
