import { useState, useMemo } from "react";
import type { Comment } from "../../services/comments.ts";

export function useDiffComments(comments: Comment[]) {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [confirmingDeleteLine, setConfirmingDeleteLine] = useState<number | null>(null);

  const commentsByLine = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const comment of comments) {
      const existing = map.get(comment.line);
      if (existing) {
        existing.push(comment);
      } else {
        map.set(comment.line, [comment]);
      }
    }
    return map;
  }, [comments]);

  const commentedLines = useMemo(
    () => new Set(commentsByLine.keys()),
    [commentsByLine],
  );

  const start = (cursorLine: number) => {
    const existing = commentsByLine.get(cursorLine);
    if (existing && existing.length > 0) {
      setEditingCommentId(existing[0]!.id);
      setCommentText(existing[0]!.content);
    } else {
      setEditingCommentId(null);
      setCommentText("");
    }
    setIsCommenting(true);
  };

  const handleInput = (
    input: string,
    key: { escape?: boolean; return?: boolean; shift?: boolean; backspace?: boolean; delete?: boolean; ctrl?: boolean; meta?: boolean },
  ): { action: "cancel" } | { action: "submit"; id: string | null; content: string } | null => {
    if (key.escape) {
      setIsCommenting(false);
      setCommentText("");
      setEditingCommentId(null);
      return { action: "cancel" };
    }
    if ((key.return && key.shift) || (input === "j" && key.ctrl)) {
      setCommentText((t) => t + "\n");
      return null;
    }
    if (key.return) {
      const result =
        commentText.trim()
          ? { action: "submit" as const, id: editingCommentId, content: commentText.trim() }
          : { action: "cancel" as const };
      setIsCommenting(false);
      setCommentText("");
      setEditingCommentId(null);
      return result;
    }
    if (key.backspace || key.delete) {
      setCommentText((t) => t.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setCommentText((t) => t + input);
    }
    return null;
  };

  const startDelete = (cursorLine: number) => {
    const existing = commentsByLine.get(cursorLine);
    if (existing && existing.length > 0) {
      setConfirmingDeleteLine(cursorLine);
    }
  };

  const confirmDelete = (): string[] | null => {
    if (confirmingDeleteLine === null) return null;
    const existing = commentsByLine.get(confirmingDeleteLine);
    setConfirmingDeleteLine(null);
    return existing ? existing.map((c) => c.id) : null;
  };

  const cancelDelete = () => {
    setConfirmingDeleteLine(null);
  };

  const reset = () => {
    setIsCommenting(false);
    setCommentText("");
    setEditingCommentId(null);
    setConfirmingDeleteLine(null);
  };

  return {
    isCommenting,
    commentText,
    editingCommentId,
    commentsByLine,
    commentedLines,
    confirmingDeleteLine,
    start,
    startDelete,
    confirmDelete,
    cancelDelete,
    handleInput,
    reset,
  };
}
