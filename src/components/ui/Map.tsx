const Map = () => (
  <div className="h-screen shrink-0 bg-gray-border">
    <div className="relative h-full border-l border-gray-border">
      <div className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-medium text-dark-gray shadow-sm">
        지도 (고정)
      </div>
      <div className="flex h-full items-center justify-center bg-gray-border">
        <div className="rounded-2xl border border-white/70 bg-white/70 px-6 py-4 text-center backdrop-blur">
          <p className="text-sm font-medium text-dark-gray">Map Placeholder</p>
          <p className="mt-1 text-xs text-dark-gray">실제 지도 SDK 연결 위치</p>
        </div>
      </div>
    </div>
  </div>
);
export default Map;
