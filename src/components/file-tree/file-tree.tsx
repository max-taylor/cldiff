import { useEffect, useState } from "react";
import { Box, Text } from "ink";
import type { ChangedFile, FileStatus } from "../../services/git.ts";
import { useVimNavigation } from "../../hooks/use-vim-navigation.ts";
import { buildTreeRows, type Row } from "./build-tree-rows.ts";

interface FileTreeProps {
  unstagedFiles: ChangedFile[];
  stagedFiles: ChangedFile[];
  isFocused: boolean;
  onSelectFile: (filePath: string, staged: boolean) => void;
  onCursorChange: (filePath: string, staged: boolean) => void;
  showStagedSection: boolean;
  viewportHeight: number;
}

const statusColors: Record<FileStatus, string> = {
  A: "green",
  M: "yellow",
  D: "red",
};

export function FileTree({
  unstagedFiles,
  stagedFiles,
  isFocused,
  onSelectFile,
  onCursorChange,
  showStagedSection,
  viewportHeight,
}: FileTreeProps) {
  const sortedUnstaged = [...unstagedFiles].sort((a, b) => a.path.localeCompare(b.path));
  const sortedStaged = [...stagedFiles].sort((a, b) => a.path.localeCompare(b.path));

  // Build tree-structured visual rows first, then navigate in visual order
  const rows: Row[] = [];
  if (!showStagedSection) {
    rows.push(...buildTreeRows(sortedUnstaged, false));
  } else {
    if (sortedUnstaged.length > 0) {
      rows.push({ type: "header", label: "Unstaged" });
      rows.push(...buildTreeRows(sortedUnstaged, false));
    }
    if (sortedStaged.length > 0) {
      rows.push({ type: "header", label: "Staged" });
      rows.push(...buildTreeRows(sortedStaged, true));
    }
  }

  // Extract file rows in visual order for navigation
  const fileRows = rows.filter((r): r is Extract<Row, { type: "file" }> => r.type === "file");

  const { selectedIndex } = useVimNavigation({
    itemCount: fileRows.length,
    isFocused,
    onSelect: (index) => {
      const row = fileRows[index]!;
      onSelectFile(row.file.path, row.staged);
    },
  });

  // Auto-select file under cursor as user navigates
  useEffect(() => {
    if (!isFocused || fileRows.length === 0) return;
    const row = fileRows[selectedIndex];
    if (!row) return;
    onCursorChange(row.file.path, row.staged);
  }, [selectedIndex, isFocused]);

  // Scroll to keep selected item visible
  const [scrollOffset, setScrollOffset] = useState(0);
  const selectedFileRow = fileRows[selectedIndex];
  const selectedRowIndex = selectedFileRow
    ? rows.indexOf(selectedFileRow)
    : -1;

  // Walk backwards to find parent context rows (headers/directories) above the selected file
  let contextStart = selectedRowIndex;
  while (contextStart > 0 && rows[contextStart - 1]?.type !== "file") {
    contextStart--;
  }

  useEffect(() => {
    if (selectedRowIndex < 0) return;
    if (contextStart < scrollOffset) {
      setScrollOffset(contextStart);
    } else if (selectedRowIndex >= scrollOffset + viewportHeight) {
      setScrollOffset(selectedRowIndex - viewportHeight + 1);
    }
  }, [selectedRowIndex, viewportHeight]);

  if (fileRows.length === 0) {
    return <Text dimColor>No changed files</Text>;
  }

  const visibleRows = rows.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visibleRows.map((row, i) => {
        if (row.type === "header") {
          return (
            <Text key={`header-${row.label}`} dimColor bold>
              {row.label}
            </Text>
          );
        }
        if (row.type === "directory") {
          return (
            <Box key={`dir-${i}-${row.label}`}>
              <Text dimColor>{"    "}</Text>
              <Text dimColor>{row.prefix}{row.label}</Text>
            </Box>
          );
        }
        const isAtCursor = row === selectedFileRow;
        return (
          <Box key={`${row.file.path}-${row.staged}`}>
            <Text dimColor>{isAtCursor ? ">" : " "} </Text>
            <Text color={statusColors[row.file.status]}>{row.file.status} </Text>
            <Text
              bold={isAtCursor}
              inverse={isAtCursor && isFocused}
              wrap="truncate"
            >
              {row.prefix}{row.fileName}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
