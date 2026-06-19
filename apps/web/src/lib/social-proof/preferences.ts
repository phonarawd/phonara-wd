/**
 * Social-proof user preference (toggle).
 * localStorage SOT. Default "on".
 */
import { useEffect, useState } from "react";

const KEY = "phonara.prefs.socialProof";

export function getSocialProofPref(): "on" | "off" {
  if (typeof window === "undefined") return "on";
  try {
    return window.localStorage.getItem(KEY) === "off" ? "off" : "on";
  } catch {
    return "on";
  }
}

export function setSocialProofPref(v: "on" | "off"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent("phonara:socialProofPref", { detail: v }));
  } catch {
    // ignore
  }
}

export function useSocialProofPref(): ["on" | "off", (v: "on" | "off") => void] {
  const [v, setV] = useState<"on" | "off">(() => getSocialProofPref());
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as "on" | "off";
      setV(detail);
    };
    window.addEventListener("phonara:socialProofPref", handler);
    return () => window.removeEventListener("phonara:socialProofPref", handler);
  }, []);
  return [
    v,
    (nv) => {
      setSocialProofPref(nv);
      setV(nv);
    },
  ];
}
