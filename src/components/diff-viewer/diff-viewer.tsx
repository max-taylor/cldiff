import React, { useMemo, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type { Comment } from "../../services/comments.ts";
import { CommentBox, CommentInput } from "../comment-input.tsx";
import { parseDiff, lineColor, displayLineNumber } from "./types.ts";
import { useDiffSearch } from "./use-diff-search.ts";
import { useDiffComments } from "./use-diff-comments.ts";
import { useDiffViewport } from "./use-diff-viewport.ts";

interface DiffViewerProps {
  diff: string;
  isFocused: boolean;
  viewportHeight: number;
  comments?: Comment[];
  onAddComment?: (line: number, content: string) => void;
  onEditComment?: (id: string, content: string) => void;
  onDeleteComment?: (ids: string[]) => void;
  onInputCapture?: (captured: boolean) => void;
}

export function DiffViewer({
  diff,
  isFocused,
  viewportHeight,
  comments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  onInputCapture,
}: DiffViewerProps) {
  const lines = useMemo(() => parseDiff(diff), [diff]);
  const search = useDiffSearch(lines);
  const commenting = useDiffComments(comments);
  const viewport = useDiffViewport(
    lines,
    viewportHeight,
    commenting.commentsByLine,
    diff,
  );

  // Reset comment state on diff change
  useEffect(() => {
    commenting.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diff]);

  // Notify parent when text input is capturing keys
  useEffect(() => {
    onInputCapture?.(
      search.isSearching ||
        commenting.isCommenting ||
        commenting.confirmingDeleteLine !== null,
    );
  }, [
    search.isSearching,
    commenting.isCommenting,
    commenting.confirmingDeleteLine,
    onInputCapture,
  ]);

  // Always-active handler: ctrl+d/u scrolls diff regardless of panel focus
  const handleCtrlScroll = useCallback(
    (input: string, key: { ctrl: boolean }) => {
      if (!key.ctrl) return;
      if (input === "d") viewport.halfPageDown();
      else if (input === "u") viewport.halfPageUp();
    },
    [viewport],
  );
  useInput(handleCtrlScroll);

  useInput(
    (input, key) => {
      if (!isFocused) return;
      if (key.ctrl) return;

      if (commenting.confirmingDeleteLine !== null) {
        if (input === "y") {
          const ids = commenting.confirmDelete();
          if (ids) onDeleteComment?.(ids);
        } else {
          commenting.cancelDelete();
        }
        return;
      }

      if (commenting.isCommenting) {
        const result = commenting.handleInput(input, key);
        if (result?.action === "submit") {
          if (result.id) {
            onEditComment?.(result.id, result.content);
          } else {
            onAddComment?.(viewport.cursorLine, result.content);
          }
        }
        return;
      }

      if (search.isSearching) {
        search.handleInput(input, key);
        if (key.return) {
          const first = search.firstMatch();
          if (first !== undefined) viewport.setCursorLine(first);
        }
        return;
      }

      if (input === "j" || key.downArrow) viewport.moveDown();
      else if (input === "k" || key.upArrow) viewport.moveUp();
      else if (input === "G") viewport.jumpBottom();
      else if (input === "g") viewport.jumpTop();
      else if (input === "d") viewport.halfPageDown();
      else if (input === "u") viewport.halfPageUp();
      else if (input === "/") search.start();
      else if (input === "n") {
        const line = search.nextMatch();
        if (line !== undefined) viewport.setCursorLine(line);
      } else if (input === "N") {
        const line = search.prevMatch();
        if (line !== undefined) viewport.setCursorLine(line);
      } else if (input === "c") {
        commenting.start(viewport.cursorLine);
      } else if (input === "x") {
        commenting.startDelete(viewport.cursorLine);
      }
    },
    { isActive: isFocused },
  );

  if (lines.length === 0) {
    return <Text dimColor>Select a file to view diff</Text>;
  }

  return (
    <Box flexDirection="column">
      {viewport.visibleItems.map((item) => {
        if (item.kind === "comments") {
          return (
            <CommentBox
              key={`comments-${item.anchorLine}`}
              comments={item.comments}
            />
          );
        }

        const { globalIndex, line } = item;
        const isCursor = globalIndex === viewport.cursorLine && isFocused;
        const isMatch = search.matchIndices.includes(globalIndex);
        const isCurrentMatch =
          search.matchIndices[search.currentMatchIndex] === globalIndex;
        const hasComment = commenting.commentedLines.has(globalIndex);
        const showInlineInput =
          commenting.isCommenting && globalIndex === viewport.cursorLine;
        const showDeleteConfirm =
          commenting.confirmingDeleteLine === globalIndex;

        const displayNum = displayLineNumber(line);
        const lineNum =
          displayNum !== null
            ? String(displayNum).padStart(viewport.gutterWidth, " ")
            : " ".repeat(viewport.gutterWidth);
        return (
          <React.Fragment key={globalIndex}>
            <Box>
              <Box flexShrink={0}>
                <Text dimColor>{lineNum}</Text>
                {hasComment ? (
                  <Text color="yellow" dimColor>
                    {" "}
                    *
                  </Text>
                ) : (
                  <Text> </Text>
                )}
              </Box>
              <Text
                color={isCursor ? undefined : lineColor(line.type)}
                dimColor={
                  line.type === "context" && !isCursor && !isCurrentMatch
                }
                bold={isCursor || isCurrentMatch}
                inverse={isCursor || isCurrentMatch}
                underline={isMatch && !isCurrentMatch && !isCursor}
              >
                {line.content || " "}
              </Text>
            </Box>
            {showDeleteConfirm && (
              <Box
                borderStyle="round"
                borderColor="red"
                paddingX={1}
                flexDirection="column"
              >
                <Text bold color="red">
                  Delete comment? <Text color="white">(y/n)</Text>
                </Text>
              </Box>
            )}
            {showInlineInput && (
              <CommentInput
                lineNumber={displayNum ?? globalIndex + 1}
                text={commenting.commentText}
                isEdit={commenting.editingCommentId !== null}
              />
            )}
          </React.Fragment>
        );
      })}
      {search.isSearching && (
        <Box>
          <Text color="yellow">/{search.searchQuery}</Text>
          <Text dimColor>_</Text>
        </Box>
      )}
      {!search.isSearching &&
        !commenting.isCommenting &&
        search.matchIndices.length > 0 && (
          <Text dimColor>
            [{search.currentMatchIndex + 1}/{search.matchIndices.length}] n/N to
            navigate
          </Text>
        )}
    </Box>
  );
}
