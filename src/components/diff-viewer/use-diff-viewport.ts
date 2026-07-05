import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { Comment } from "../../services/comments.ts";
import { maxLineNumber, type DiffLine } from "./types.ts";
import {
  computeScrollOffset,
  buildVisibleItems,
  type VisibleItem,
} from "./compute-viewport.ts";

export type { VisibleItem } from "./compute-viewport.ts";

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
    const newOffset = computeScrollOffset(
      cursorLine,
      scrollOffset,
      viewportHeight,
      commentsByLine,
    );
    if (newOffset !== scrollOffset) {
      setScrollOffset(newOffset);
    }
  }, [cursorLine, viewportHeight, scrollOffset, commentsByLine]);

  const visibleItems = useMemo(
    () => buildVisibleItems(lines, scrollOffset, viewportHeight, commentsByLine),
    [lines, scrollOffset, viewportHeight, commentsByLine],
  );

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
