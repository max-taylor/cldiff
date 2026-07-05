import { useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import type { ChangedFile, FileStatus } from "../../services/git.ts";
import { COMMENT_COLORS } from "../../theme.ts";
import type { FileCommentCounts } from "../../app.tsx";
import { useVimNavigation } from "../../hooks/use-vim-navigation.ts";
import { buildFileTreeData } from "./build-file-tree-rows.ts";
import type { Row } from "./build-tree-rows.ts";

interface FileTreeProps {
  unstagedFiles: ChangedFile[];
  stagedFiles: ChangedFile[];
  isFocused: boolean;
  onSelectFile: (filePath: string, staged: boolean) => void;
  onCursorChange: (filePath: string, staged: boolean) => void;
  viewportHeight: number;
  commentCounts?: FileCommentCounts;
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
  viewportHeight,
  commentCounts,
}: FileTreeProps) {
  const [collapsed, setCollapsed] = useState({ unstaged: false, staged: true });

  const { rows, navigableRows } = useMemo(
    () => buildFileTreeData(unstagedFiles, stagedFiles, collapsed),
    [unstagedFiles, stagedFiles, collapsed],
  );

  const { selectedIndex, setSelectedIndex } = useVimNavigation({
    itemCount: navigableRows.length,
    isFocused,
    onSelect: (index) => {
      const row = navigableRows[index]!;
      if (row.type === "header") {
        const key = row.label === "Unstaged" ? "unstaged" : "staged";
        setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
      } else {
        onSelectFile(row.file.path, row.staged);
      }
    },
  });

  // Clamp selectedIndex when navigable items shrink (e.g. after collapsing)
  useEffect(() => {
    if (selectedIndex >= navigableRows.length && navigableRows.length > 0) {
      setSelectedIndex(navigableRows.length - 1);
    }
  }, [navigableRows.length, selectedIndex, setSelectedIndex]);

  // Auto-select file under cursor as user navigates (only for file rows)
  useEffect(() => {
    if (!isFocused || navigableRows.length === 0) return;
    const row = navigableRows[selectedIndex];
    if (!row || row.type !== "file") return;
    onCursorChange(row.file.path, row.staged);
  }, [selectedIndex, isFocused, navigableRows, onCursorChange]);

  // Scroll to keep selected item visible
  const [scrollOffset, setScrollOffset] = useState(0);
  const selectedNavRow = navigableRows[selectedIndex];
  const selectedRowIndex = selectedNavRow ? rows.indexOf(selectedNavRow) : -1;

  // Walk backwards to find parent context rows (headers/directories) above the selected row
  let contextStart = selectedRowIndex;
  while (
    contextStart > 0 &&
    rows[contextStart - 1]?.type !== "file" &&
    rows[contextStart - 1]?.type !== "header"
  ) {
    contextStart--;
  }

  useEffect(() => {
    if (selectedRowIndex < 0) return;
    if (contextStart < scrollOffset) {
      setScrollOffset(contextStart);
    } else if (selectedRowIndex >= scrollOffset + viewportHeight) {
      setScrollOffset(selectedRowIndex - viewportHeight + 1);
    }
  }, [selectedRowIndex, viewportHeight, contextStart, scrollOffset]);

  if (navigableRows.length === 0) {
    return <Text dimColor>No changed files</Text>;
  }

  const visibleRows = rows.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visibleRows.map((row, i) => {
        if (row.type === "header") {
          const isUnstaged = row.label === "Unstaged";
          const count = isUnstaged
            ? unstagedFiles.length
            : stagedFiles.length;
          const isCollapsed = isUnstaged
            ? collapsed.unstaged
            : collapsed.staged;
          const arrow = isCollapsed ? "▶" : "▼";
          const isAtCursor = row === selectedNavRow;
          return (
            <Text
              key={`header-${row.label}`}
              bold
              inverse={isAtCursor && isFocused}
              dimColor={!isAtCursor}
            >
              {isAtCursor ? ">" : " "} {arrow} {row.label} ({count})
            </Text>
          );
        }
        if (row.type === "directory") {
          return (
            <Box key={`dir-${i}-${row.label}`}>
              <Text dimColor>{"    "}</Text>
              <Text dimColor>
                {row.prefix}
                {row.label}
              </Text>
            </Box>
          );
        }
        const isAtCursor = row === selectedNavRow;
        const counts = commentCounts?.get(row.file.path);
        return (
          <Box key={`${row.file.path}-${row.staged}`}>
            <Text dimColor>{isAtCursor ? ">" : " "} </Text>
            <Text color={statusColors[row.file.status]}>
              {row.file.status}{" "}
            </Text>
            <Text
              bold={isAtCursor}
              inverse={isAtCursor && isFocused}
              wrap="truncate"
            >
              {row.prefix}
              {row.fileName}
            </Text>
            {counts && (
              <Text>
                {counts.created > 0 && (
                  <Text color={COMMENT_COLORS.created}> {counts.created}</Text>
                )}
                {counts.resolved > 0 && (
                  <Text color={COMMENT_COLORS.resolved}> {counts.resolved}</Text>
                )}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
