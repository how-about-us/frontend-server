import Link from "next/link";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
        <h2 className="text-base font-semibold">채팅</h2>
        <Link
          href="/plan"
          className="rounded-full p-2 text-dark-gray hover:bg-light-gray transition"
          aria-label="채팅 닫기"
        >
          ✕
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
