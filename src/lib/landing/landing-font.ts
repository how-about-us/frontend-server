import localFont from "next/font/local";

/** `public/fonts/bmjua.otf` — next/font/local 은 path를 정적 리터럴로만 허용 */
export const landingFont = localFont({
  src: [
    {
      path: "../../../public/fonts/bmjua.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-landing",
  display: "swap",
});

export const LANDING_FONT_VARIABLE = landingFont.variable;
