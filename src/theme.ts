export const COMMENT_COLORS = {
  created: "#FFA500",
  resolved: "red",
} as const;

export type CommentStatus = keyof typeof COMMENT_COLORS;
