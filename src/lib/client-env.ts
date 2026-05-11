function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const clientEnv = {
  NEXT_PUBLIC_API_BASE_URL: required(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: required(
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  ),
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: required(
    "NEXT_PUBLIC_GOOGLE_REDIRECT_URI",
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  ),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: required(
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  ),
};
