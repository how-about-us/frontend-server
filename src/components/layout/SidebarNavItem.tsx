import Link from "next/link";

import { SidebarPingBadge } from "./SidebarPingBadge";
import { sidebarNavButtonClassName } from "./sidebarNavButton";

type SidebarNavItemProps = {
  href: string;
  icon: string;
  label: string;
  tutorialTarget: string;
  isActive: boolean;
  showPingBadge?: boolean;
  showDividerBelow?: boolean;
};

export function SidebarNavItem({
  href,
  icon,
  label,
  tutorialTarget,
  isActive,
  showPingBadge = false,
  showDividerBelow = false,
}: SidebarNavItemProps) {
  return (
    <div className="relative">
      <Link
        href={href}
        className={sidebarNavButtonClassName(isActive)}
        aria-label={label}
        data-tutorial-target={tutorialTarget}
      >
        <img src={icon} alt="" className="h-6 w-6" />
      </Link>

      {showPingBadge ? <SidebarPingBadge /> : null}

      {showDividerBelow ? (
        <div className="mt-2 w-10 border-t border-gray-border" />
      ) : null}
    </div>
  );
}
