import React, { useMemo, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type { Comment } from "../../services/comments.ts";
import { CommentBox, CommentInput } from "../comment-input.tsx";
import { parseDiff, lineColor, displayLineNumber } from "./types.ts";
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
      commenting.isCommenting ||
        commenting.confirmingDeleteLine !== null,
    );
  }, [
    commenting.isCommenting,
    commenting.confirmingDeleteLine,
    onInputCapture,
  ]);

  // Always-active handler: d/u scrolls diff regardless of panel focus
  const isInputCaptured =
    commenting.isCommenting ||
    commenting.confirmingDeleteLine !== null;
  const handleDiffScroll = useCallback(
    (input: string, key: { ctrl: boolean }) => {
      if (key.ctrl || isInputCaptured) return;
      if (input === "d") viewport.halfPageDown();
      else if (input === "u") viewport.halfPageUp();
    },
    [viewport, isInputCaptured],
  );
  useInput(handleDiffScroll);

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

      if (input === "j" || key.downArrow) viewport.moveDown();
      else if (input === "k" || key.upArrow) viewport.moveUp();
      else if (input === "G") viewport.jumpBottom();
      else if (input === "g") viewport.jumpTop();
      else if (input === "m") {
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
        const hasComment = commenting.commentedLines.has(globalIndex);
        const showInlineInput =
          commenting.isCommenting && globalIndex === viewport.cursorLine;
        const showDeleteConfirm =
          commenting.confirmingDeleteLine === globalIndex;

        const displayNum = displayLineNumber(line);
        const lineNum = String(displayNum).padStart(viewport.gutterWidth, " ");
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
                dimColor={line.type === "context" && !isCursor}
                bold={isCursor}
                inverse={isCursor}
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
                lineNumber={displayNum}
                text={commenting.commentText}
                isEdit={commenting.editingCommentId !== null}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}
