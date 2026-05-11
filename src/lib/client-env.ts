/**
 * 클라이언트 번들에 `NEXT_PUBLIC_*`를 넣으려면 `process.env.KEY`를
 * **문자열 리터럴 키로 직접** 읽어야 합니다. `process.env[name]` 동적 접근은
 * Next가 치환하지 않아 브라우저에서 값이 비게 됩니다.
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
 */

function readNextPublic(nameForError: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${nameForError}`);
  }
  return value;
}

export const clientEnv = {
  NEXT_PUBLIC_API_BASE_URL: readNextPublic(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: readNextPublic(
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  ),
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: readNextPublic(
    "NEXT_PUBLIC_GOOGLE_REDIRECT_URI",
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  ),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: readNextPublic(
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  ),
};
