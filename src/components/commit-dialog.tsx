import { useState } from "react";
import { Box, Text, useInput } from "ink";

interface CommitDialogProps {
  onCommit: (message: string) => void;
  onCancel: () => void;
}

export function CommitDialog({ onCommit, onCancel }: CommitDialogProps) {
  const [text, setText] = useState("");

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      if (text.trim()) {
        onCommit(text.trim());
      }
      return;
    }
    if (key.backspace || key.delete) {
      setText((t) => t.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setText((t) => t + input);
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="green"
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Text bold color="green">
        Commit message
      </Text>
      <Box marginTop={1}>
        <Text color="white">{text}</Text>
        <Text dimColor>▌</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Enter to commit · Esc to cancel</Text>
      </Box>
    </Box>
  );
}
