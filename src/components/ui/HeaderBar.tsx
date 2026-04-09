import Image from "next/image";
import { MOCK_TRIP_INFO } from "@/mocks";

const HeaderBar = () => (
  <header className="border-b border-gray-border px-3 py-1">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{MOCK_TRIP_INFO.title}</h1>
        <p className="text-sm text-dark-gray">{MOCK_TRIP_INFO.date}</p>
      </div>
      <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
    </div>
  </header>
);

export default HeaderBar;
