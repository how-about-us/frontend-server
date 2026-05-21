import { cn } from "@/lib/utils";

export function sidebarNavButtonClassName(isActive = false) {
  return cn(
    "flex h-10 w-10 items-center justify-center rounded-full transition",
    isActive ? "bg-light-gray" : "bg-transparent hover:bg-light-gray",
  );
}
