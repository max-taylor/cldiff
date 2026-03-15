import { Box, Text } from "ink";

interface StatusBarProps {
  currentBranch: string;
  fileCount: number;
  sessionLabel: string | null;
  hasTrackingData: boolean;
  hasStagedFiles: boolean;
}

export function StatusBar({
  currentBranch,
  fileCount,
  sessionLabel,
  hasTrackingData,
  hasStagedFiles,
}: StatusBarProps) {
  const branchLabel = sessionLabel
    ? `${currentBranch} — filtered: "${sessionLabel}"`
    : currentBranch;

  const parts: string[] = [];
  if (sessionLabel) parts.push("[s] filter", "[esc] clear");
  else if (hasTrackingData) parts.push("[s] filter");
  parts.push("[a] stage");
  if (hasStagedFiles) parts.push("[c] commit");
  parts.push("[?] help", "[q] quit");
  const hints = parts.join(" ");

  return (
    <Box paddingX={1} justifyContent="space-between">
      <Box gap={2}>
        <Text color="green">{branchLabel}</Text>
        <Text dimColor>{fileCount} files</Text>
      </Box>
      <Text dimColor>{hints}</Text>
    </Box>
  );
}
