type LoginErrorAlertProps = {
  message: string;
  onDismiss?: () => void;
};

export function LoginErrorAlert({ message, onDismiss }: LoginErrorAlertProps) {
  return (
    <div
      role="alert"
      className="flex w-full gap-3 rounded-xl border border-brand-red/35 bg-brand-red/[0.06] px-3.5 py-3 text-left"
    >
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-red/15 text-xs font-bold text-brand-red"
        aria-hidden
      >
        !
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-red">로그인에 실패했습니다</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-brown">{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 text-xs font-medium text-brand-red underline-offset-2 hover:underline"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}
