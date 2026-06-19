import { useContext } from "react";
import {
  InstallPromptContext,
  type InstallPromptContextValue,
} from "@/components/shell/InstallPromptProvider";

// §P11-C — consume-only hook. Listener registration lives in
// InstallPromptProvider (single mount in __root.tsx). This hook does NOT
// call addEventListener — that constraint is enforced by §GREEN self-check.
export function useInstallPrompt(): InstallPromptContextValue {
  return useContext(InstallPromptContext);
}
