import Image from "next/image";

const HeaderBar = () => (
  <header className="border-b border-gray-border px-3 py-1">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">히코네 여행</h1>
        <p className="text-sm text-dark-gray">금요일, 4월 3일</p>
      </div>
      <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
    </div>
  </header>
);

export default HeaderBar;
