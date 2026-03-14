import { Box, Text } from "ink";

interface StatusBarProps {
  currentBranch: string;
  fileCount: number;
  sessionLabel: string | null;
  hasTrackingData: boolean;
}

export function StatusBar({
  currentBranch,
  fileCount,
  sessionLabel,
  hasTrackingData,
}: StatusBarProps) {
  const branchLabel = sessionLabel
    ? `${currentBranch} — filtered: "${sessionLabel}"`
    : currentBranch;

  const hints = sessionLabel
    ? "[s] filter [esc] clear [a] stage [?] help [q] quit"
    : hasTrackingData
      ? "[s] filter [a] stage [?] help [q] quit"
      : "[a] stage [?] help [q] quit";

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
