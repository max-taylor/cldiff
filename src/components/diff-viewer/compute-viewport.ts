import type { Comment } from "../../services/comments.ts";
import type { DiffLine } from "./types.ts";

export type VisibleItem =
  | { kind: "line"; line: DiffLine; globalIndex: number }
  | { kind: "comments"; comments: Comment[]; anchorLine: number };

export function computeScrollOffset(
  cursorLine: number,
  scrollOffset: number,
  viewportHeight: number,
  commentsByLine: Map<number, Comment[]>,
): number {
  if (cursorLine < scrollOffset) {
    return cursorLine;
  }

  let visualRow = 0;
  for (let i = scrollOffset; i <= cursorLine; i++) {
    visualRow += 1;
    const lc = commentsByLine.get(i);
    if (lc) visualRow += lc.length + 3;
  }

  if (visualRow <= viewportHeight) {
    return scrollOffset;
  }

  // Shrink the window from the top incrementally (O(n) instead of O(n^2))
  let totalRows = visualRow;
  let newOffset = scrollOffset;
  while (totalRows > viewportHeight && newOffset < cursorLine) {
    totalRows -= 1;
    const lc = commentsByLine.get(newOffset);
    if (lc) totalRows -= lc.length + 3;
    newOffset++;
  }
  return newOffset;
}

export function buildVisibleItems(
  lines: DiffLine[],
  scrollOffset: number,
  viewportHeight: number,
  commentsByLine: Map<number, Comment[]>,
): VisibleItem[] {
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
}
