import { useState } from "react";
import { useInput, useApp } from "ink";

export type Panel = "files" | "diff";
export type Overlay = "pick-session" | "help" | "commit" | null;

interface AppKeybindingsOptions {
  onToggleStage: () => void;
  onClearSessionFilter: () => void;
  hasSessionFilter: boolean;
  hasTrackingData: boolean;
  hasStagedFiles: boolean;
  inputCaptured?: boolean;
}

export function useAppKeybindings({
  onToggleStage,
  onClearSessionFilter,
  hasSessionFilter,
  hasTrackingData,
  hasStagedFiles,
  inputCaptured,
}: AppKeybindingsOptions) {
  const { exit } = useApp();
  const [activePanel, setActivePanel] = useState<Panel>("files");
  const [overlay, setOverlay] = useState<Overlay>(null);
  useInput(
    (input, key) => {
      if (key.ctrl) return;

      if (key.escape) {
        if (hasSessionFilter) {
          onClearSessionFilter();
          return;
        }
      }

      if (input === "q") {
        exit();
      } else if (input === "h") {
        setActivePanel("files");
      } else if (input === "l") {
        setActivePanel("diff");
      } else if (input === "?") {
        setOverlay("help");
      } else if (input === "a") {
        onToggleStage();
      } else if (input === "s" && hasTrackingData) {
        setOverlay("pick-session");
      } else if (input === "c" && hasStagedFiles) {
        setOverlay("commit");
      }
    },
    { isActive: overlay === null && !inputCaptured },
  );

  const focusDiff = () => setActivePanel("diff");
  const closeOverlay = () => setOverlay(null);

  return {
    activePanel,
    overlay,
    focusDiff,
    closeOverlay,
  };
}
