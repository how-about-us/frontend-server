/**
 * Chat UI layout (extend inside these buckets):
 * - panel/     — shell: docked panel, header, chrome
 * - messages/  — scroll list, bubbles, grouping
 * - input/     — composer, attachments, @mentions
 * - lib/       — pure helpers & motion (no React tree roots)
 *
 * Cross-cutting: types in `@/types/chat`, realtime/data in `@/hooks/useChatMessages`,
 * open/minimize/close in `@/contexts/ChatContext`. Page-specific wrappers stay next
 * to routes (e.g. `app/(main)/plan/_components/chat/`).
 */

export { ChatPanel } from "./panel/ChatPanel";
