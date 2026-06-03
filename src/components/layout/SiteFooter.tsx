import { CopyableSupportEmail } from "@/components/contact/CopyableSupportEmail";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative z-10 border-t border-gray-border/60 bg-white/80",
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-dark-gray">
            Contact
          </span>
          <CopyableSupportEmail />
        </div>
        <p className="text-center text-xs text-dark-gray/80 sm:text-right">
          © {year} 우때. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
