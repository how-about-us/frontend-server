import { GoogleMapsProvider } from "@/components/googleMap";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}
