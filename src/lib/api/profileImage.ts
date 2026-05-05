/**
 * 프로필 사진 필드 이름이 백엔드/엔드포인트마다 다른 경우 처리
 * (예: Jackson `photoURL`, REST `profileImageUrl`).
 */
export function pickProfileImageUrl(
  raw: Record<string, unknown>,
): string | null {
  const keys = [
    "profileImageUrl",
    "profile_image_url",
    "photoURL",
    "photoUrl",
    "photo_url",
  ] as const;
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}
