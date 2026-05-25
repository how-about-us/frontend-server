/** 플랜·홈 — 모바일(조회 전용) vs 데스크톱 안내 문구 */
export const planCopy = {
  scheduleEmpty: {
    mobile: "아직 생성된 일정이 없어요.",
    desktop:
      "아직 생성된 일정이 없어요. 우측 상단의 「새 일차 추가」 버튼으로 일차를 추가해 보세요.",
  },
  placesEmpty: {
    mobile: "아직 등록된 장소가 없습니다.",
    desktop:
      "아직 등록된 장소가 없습니다. 검색으로 장소를 추가해 보세요.",
  },
} as const;

export function planCopyForDevice(isMobileDevice: boolean) {
  return {
    scheduleEmpty: isMobileDevice
      ? planCopy.scheduleEmpty.mobile
      : planCopy.scheduleEmpty.desktop,
    placesEmpty: isMobileDevice
      ? planCopy.placesEmpty.mobile
      : planCopy.placesEmpty.desktop,
  };
}
