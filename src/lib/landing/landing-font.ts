import localFont from "next/font/local";

/** `public/fonts/laundrygothic-*.woff` — next/font/local 은 path를 정적 리터럴로만 허용 */
export const landingFont = localFont({
  src: [
    {
      path: "../../../public/fonts/laundrygothic-regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/laundrygothic-bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-landing",
  display: "swap",
});

export const LANDING_FONT_VARIABLE = landingFont.variable;
