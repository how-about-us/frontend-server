import { CopyableSupportEmail } from "@/components/contact/CopyableSupportEmail";
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
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Contact
          </span>
          <CopyableSupportEmail
            tone="onBrand"
            className="text-sm font-medium text-white"
          />
        </div>
        <p className="text-center text-xs text-white/60 sm:text-right">
          © {year} 우때. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
