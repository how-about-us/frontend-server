import { readIsMobileDevice } from "./device";
import { readIsLandscapeOrientation } from "./orientation";

export type MobileViewState = {
  isMobileDevice: boolean;
  isMobileLandscape: boolean;
};

export function readMobileViewState(): MobileViewState {
  const isMobileDevice = readIsMobileDevice();
  return {
    isMobileDevice,
    isMobileLandscape: isMobileDevice && readIsLandscapeOrientation(),
  };
}

export const MOBILE_VIEW_DEFAULT: MobileViewState = {
  isMobileDevice: false,
  isMobileLandscape: false,
};
