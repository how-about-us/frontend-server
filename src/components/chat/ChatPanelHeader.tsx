import { Minus } from "lucide-react";

interface ChatPanelHeaderProps {
  roomTitle: string;
  onlineCount: number;
  isMinimized: boolean;
  onMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function ChatPanelHeader({
  roomTitle,
  onlineCount,
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
      <div className="min-w-0 flex-1">
        <h2
          className={`truncate font-semibold leading-tight transition-all duration-300 ${isMinimized ? "text-xs" : "text-xl"}`}
        >
          {roomTitle}
        </h2>
        <div className="flex items-center gap-1.5">
          <span
            className={`shrink-0 rounded-full bg-[#68D391] transition-all duration-300 ${isMinimized ? "h-1.5 w-1.5" : "h-2.5 w-2.5"}`}
          />
          <span
            className={`font-semibold text-black/60 transition-all duration-300 ${isMinimized ? "text-[10px] leading-tight" : "text-xs"}`}
          >
            {onlineCount}명 접속중
          </span>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={isMinimized ? onMaximize : onMinimize}
          className="rounded-full p-1.5 text-dark-gray transition hover:bg-light-gray"
          aria-label={isMinimized ? "최대화" : "최소화"}
        >
          <img
            src={isMinimized ? "/maximize.svg" : "/minimize.svg"}
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
