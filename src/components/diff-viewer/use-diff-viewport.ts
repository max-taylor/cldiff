import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { Comment } from "../../services/comments.ts";
import { maxLineNumber, type DiffLine } from "./types.ts";

export type VisibleItem =
  | { kind: "line"; line: DiffLine; globalIndex: number }
  | { kind: "comments"; comments: Comment[]; anchorLine: number };

export function useDiffViewport(
  lines: DiffLine[],
  viewportHeight: number,
  commentsByLine: Map<number, Comment[]>,
  diff: string,
) {
  const [cursorLine, setCursorLine] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const maxLine = Math.max(0, lines.length - 1);

  // Keep refs in sync so stable callbacks always read current values
  const maxLineRef = useRef(maxLine);
  const viewportHeightRef = useRef(viewportHeight);
  useEffect(() => {
    maxLineRef.current = maxLine;
    viewportHeightRef.current = viewportHeight;
  }, [maxLine, viewportHeight]);

  // Reset on diff change
  useEffect(() => {
    setCursorLine(0);
    setScrollOffset(0);
  }, [diff]);

  // Scroll follow cursor (comment-aware)
  useEffect(() => {
    if (cursorLine < scrollOffset) {
      setScrollOffset(cursorLine);
      return;
    }

    let visualRow = 0;
    for (let i = scrollOffset; i <= cursorLine; i++) {
      visualRow += 1;
      const lc = commentsByLine.get(i);
      if (lc) visualRow += lc.length + 3;
    }

    if (visualRow > viewportHeight) {
      let newOffset = scrollOffset;
      while (newOffset < cursorLine) {
        let rows = 0;
        for (let i = newOffset; i <= cursorLine; i++) {
          rows += 1;
          const lc = commentsByLine.get(i);
          if (lc) rows += lc.length + 3;
        }
        if (rows <= viewportHeight) break;
        newOffset++;
      }
      setScrollOffset(newOffset);
    }
  }, [cursorLine, viewportHeight, scrollOffset, commentsByLine]);

  const visibleItems = useMemo(() => {
    const items: VisibleItem[] = [];
    let remainingHeight = viewportHeight;

    for (let i = scrollOffset; i < lines.length && remainingHeight > 0; i++) {
      items.push({ kind: "line", line: lines[i]!, globalIndex: i });
      remainingHeight -= 1;

      const lineComments = commentsByLine.get(i);
      if (lineComments && remainingHeight > 0) {
        items.push({ kind: "comments", comments: lineComments, anchorLine: i });
        remainingHeight -= lineComments.length + 3;
      }
    }

    return items;
  }, [lines, scrollOffset, viewportHeight, commentsByLine]);

  const gutterWidth = useMemo(
    () => String(maxLineNumber(lines) || 1).length,
    [lines],
  );

  const moveDown = useCallback(
    () => setCursorLine((c) => Math.min(c + 1, maxLineRef.current)),
    [],
  );
  const moveUp = useCallback(
    () => setCursorLine((c) => Math.max(c - 1, 0)),
    [],
  );
  const jumpTop = useCallback(() => setCursorLine(0), []);
  const jumpBottom = useCallback(() => setCursorLine(maxLineRef.current), []);
  const halfPageDown = useCallback(() => {
    const half = Math.floor(viewportHeightRef.current / 2);
    setCursorLine((c) => Math.min(c + half, maxLineRef.current));
    setScrollOffset((s) =>
      Math.min(
        s + half,
        Math.max(0, maxLineRef.current - viewportHeightRef.current + 1),
      ),
    );
  }, []);
  const halfPageUp = useCallback(() => {
    const half = Math.floor(viewportHeightRef.current / 2);
    setCursorLine((c) => Math.max(c - half, 0));
    setScrollOffset((s) => Math.max(s - half, 0));
  }, []);

  return {
    cursorLine,
    setCursorLine,
    scrollOffset,
    visibleItems,
    gutterWidth,
    maxLine,
    moveDown,
    moveUp,
    jumpTop,
    jumpBottom,
    halfPageDown,
    halfPageUp,
  };
}
