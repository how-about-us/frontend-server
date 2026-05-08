import { HomeSessionSync } from "./_components/HomeSessionSync";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HomeSessionSync>{children}</HomeSessionSync>;
}
