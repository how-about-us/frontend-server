import Image from "next/image";

import { MOCK_TRIP_INFO } from "@/mocks";

const HeaderBar = () => {
  const current = MOCK_TRIP_INFO[0];

  return (
    <header className="border-b border-gray-border px-1 py-1">
      <div className="flex items-center justify-between">
        <div className="rounded-lg border-r-3 border-brand-red bg-white px-2.5 py-1.5">
          <span className="block text-sm font-semibold leading-tight">
            {current?.title}
          </span>
          <span className="block text-xs leading-tight text-dark-gray">
            {current?.date}
          </span>
        </div>
        <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
      </div>
    </header>
  );
};

export default HeaderBar;
