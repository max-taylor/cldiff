import { Box, Text } from "ink";
import type { Comment } from "../services/comments.ts";

interface CommentBoxProps {
  comments: Comment[];
}

export function CommentBox({ comments }: CommentBoxProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
    >
      <Text bold color="yellow">
        {comments.length === 1 ? "Comment" : `${comments.length} Comments`}
      </Text>
      {comments.map((comment) => (
        <Text key={comment.id} color="white">
          {comment.content}
        </Text>
      ))}
    </Box>
  );
}

interface CommentInputProps {
  lineNumber: number;
  text: string;
  isEdit: boolean;
}

export function CommentInput({ lineNumber, text, isEdit }: CommentInputProps) {
  const textLines = text.split("\n");
  const lastLine = textLines[textLines.length - 1] ?? "";
  const precedingLines = textLines.slice(0, -1);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="green"
      paddingX={1}
    >
      <Text bold color="green">
        {isEdit ? "Edit" : "New Comment"} (line {lineNumber})
      </Text>
      {precedingLines.map((line, i) => (
        <Text key={i} color="white">
          {line || " "}
        </Text>
      ))}
      <Box>
        <Text color="white">{lastLine}</Text>
        <Text dimColor>_</Text>
      </Box>
      <Text dimColor>Enter to save · Esc to cancel</Text>
    </Box>
  );
}
