type LoginSuccessNoticeProps = {
  title?: string;
  description?: string;
};

export function LoginSuccessNotice({
  title = "로그인되었습니다",
  description = "잠시 후 여행 계획 화면으로 이동합니다.",
}: LoginSuccessNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full gap-3 rounded-xl border border-brand-green/40 bg-brand-green/[0.07] px-3.5 py-4 text-left"
    >
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-xs font-bold text-brand-green"
        aria-hidden
      >
        ✓
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-green">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-dark-gray">{description}</p>
      </div>
    </div>
  );
}
