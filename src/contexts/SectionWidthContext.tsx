"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type SectionWidthContextType = {
  maxWidth: string;
  setMaxWidth: (width: string) => void;
};

const SectionWidthContext = createContext<SectionWidthContextType>({
  maxWidth: "",
  setMaxWidth: () => {},
});

export function SectionWidthProvider({ children }: { children: ReactNode }) {
  const [maxWidth, setMaxWidth] = useState("");
  return (
    <SectionWidthContext.Provider value={{ maxWidth, setMaxWidth }}>
      {children}
    </SectionWidthContext.Provider>
  );
}

export function useSectionWidth() {
  return useContext(SectionWidthContext);
}

/** Drop into any page to declaratively set the section max-width. */
export function SetSectionMaxWidth({ value }: { value: string }) {
  const { setMaxWidth } = useSectionWidth();
  useEffect(() => {
    setMaxWidth(value);
    return () => setMaxWidth("");
  }, [value, setMaxWidth]);
  return null;
}
