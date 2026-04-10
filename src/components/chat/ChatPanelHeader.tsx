import { Minus } from "lucide-react";

interface ChatPanelHeaderProps {
  isMinimized: boolean;
  onMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function ChatPanelHeader({
  isMinimized,
  onMaximize,
  onMinimize,
  onClose,
}: ChatPanelHeaderProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between px-3 py-2 ${isMinimized ? "cursor-pointer" : ""}`}
      onClick={isMinimized ? onMaximize : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 overflow-hidden rounded-[8px] bg-light-gray transition-all duration-300 ${isMinimized ? "h-7 w-7" : "h-10 w-10"}`}
        >
          <img
            src="https://picsum.photos/seed/chat-avatar/80/80"
            alt="trip"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h2
            className={`font-semibold leading-tight transition-all duration-300 ${isMinimized ? "text-sm" : "text-xl"}`}
          >
            히코네여행
          </h2>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full bg-[#68D391] transition-all duration-300 ${isMinimized ? "h-1.5 w-1.5" : "h-2.5 w-2.5"}`}
            />
            <span className="text-xs font-semibold text-black/60">
              3 Online
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={isMinimized ? onMaximize : onMinimize}
          className="rounded-full p-1.5 text-dark-gray transition hover:bg-light-gray"
          aria-label={isMinimized ? "최대화" : "최소화"}
        >
          <img
            src={isMinimized ? "/icons/maximize.svg" : "/icons/minimize.svg"}
            alt={isMinimized ? "maximize" : "minimize"}
            className="h-4 w-4"
          />
        </button>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-dark-gray transition hover:bg-light-gray"
          aria-label="채팅 닫기"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
