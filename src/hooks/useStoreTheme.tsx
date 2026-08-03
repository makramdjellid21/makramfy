"use client";

import { createContext, useContext, type ReactNode } from "react";

const StoreThemeContext = createContext<string>("#16a34a");

export function StoreThemeProvider({ color, children }: { color: string; children: ReactNode }) {
  return <StoreThemeContext.Provider value={color}>{children}</StoreThemeContext.Provider>;
}

export function useStoreTheme(): string {
  return useContext(StoreThemeContext);
}
