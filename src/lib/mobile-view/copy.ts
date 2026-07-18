/** 모바일 편집 제한 — 화면 상단 안내 */
export const mobileReadOnlyNoticeCopy = {
  title: "모바일에서는 편집이 제한돼요",
  description: "자세한 편집은 PC나 노트북으로 접속해주세요",
} as const;

/** 플랜·홈 — 모바일(조회 전용) vs 데스크톱 안내 문구 */
export const planCopy = {
  scheduleEmpty: {
    mobile: "아직 생성된 일정이 없어요.",
    desktop: "아직 생성된 일정이 없어요.",
  },
  placesEmpty: {
    mobile: "아직 등록된 장소가 없습니다.",
    desktop: "아직 등록된 장소가 없습니다.",
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
