import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Neon } from "./Neon";
import { Noir } from "./Noir";

export type GameThemeName = "neon" | "noir";

const Ctx = createContext<{ name: GameThemeName; theme: typeof Neon | typeof Noir }>({
  name: "neon",
  theme: Neon,
});

export function ThemeProvider({
  name = "neon",
  children,
}: {
  name?: GameThemeName;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ name, theme: name === "noir" ? Noir : Neon }), [name]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGameTheme() {
  return useContext(Ctx);
}
