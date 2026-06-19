import { useEffect, useState } from "react";

const KEY = "phonara.handed";
export type Handed = "right" | "left";

function readInitial(): Handed {
  if (typeof window === "undefined") return "right";
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "left" ? "left" : "right";
  } catch {
    return "right";
  }
}

export function useHandedness(): [Handed, (next: Handed) => void] {
  // SSR-safe: always start with "right" on first render, hydrate from
  // storage in useEffect to avoid hydration mismatch.
  const [handed, setHandedState] = useState<Handed>("right");

  useEffect(() => {
    setHandedState(readInitial());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setHandedState(e.newValue === "left" ? "left" : "right");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setHanded = (next: Handed) => {
    setHandedState(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // ignore — SSR / privacy mode
    }
  };

  return [handed, setHanded];
}
