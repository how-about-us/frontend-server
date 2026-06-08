import Link from "next/link";

import { CopyableSupportEmail } from "@/components/contact/CopyableSupportEmail";
import { AGREEMENT_PUBLIC_PATH } from "@/lib/agreements/paths";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative z-10 bg-brand-red text-white",
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Contact
            </span>
            <CopyableSupportEmail
              tone="onBrand"
              className="text-sm font-medium text-white"
            />
          </div>

          <nav
            aria-label="정책 문서"
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs sm:justify-end"
          >
            <Link
              href={AGREEMENT_PUBLIC_PATH.TERMS_OF_SERVICE}
              className="text-white/80 transition-colors hover:text-white"
            >
              이용약관
            </Link>
            <span className="text-white/50" aria-hidden>
              ·
            </span>
            <Link
              href={AGREEMENT_PUBLIC_PATH.PRIVACY_POLICY}
              className="text-white/80 transition-colors hover:text-white"
            >
              개인정보 처리방침
            </Link>
          </nav>
        </div>

        <p className="text-center text-xs text-white/60 sm:text-right">
          © {year} 우때. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
