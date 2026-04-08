const HeaderBar = () => (
  <header className="border-b border-gray-border px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">히코네 여행</h1>
        <p className="text-sm text-dark-gray">금요일, 4월 3일</p>
      </div>
      <button
        type="button"
        className="rounded-full border border-gray-border px-4 py-2 text-sm text-dark-gray hover:bg-[#f8fafc]"
      >
        더보기
      </button>
    </div>
  </header>
);

export default HeaderBar;
