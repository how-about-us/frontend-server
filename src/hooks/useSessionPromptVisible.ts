"use client";

import { useCallback, useEffect, useState } from "react";

/** sessionStorage에 dismiss 플래그가 없으면 `visible: true` — hydration 후 갱신 */
export function useSessionPromptVisible(storageKey: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(storageKey) !== "1");
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* private mode / quota */
    }
    setVisible(false);
  }, [storageKey]);

  return { visible, dismiss };
}
