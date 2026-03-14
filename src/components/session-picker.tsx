import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { SessionGroup } from "../services/tracking.ts";

interface SessionPickerProps {
  sessions: SessionGroup[];
  onSelect: (sessionId: string) => void;
  onCancel: () => void;
}

export function SessionPicker({ sessions, onSelect, onCancel }: SessionPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      if (sessions.length > 0) {
        onSelect(sessions[selectedIndex]!.session_id);
      }
    } else if (input === "j" || key.downArrow) {
      setSelectedIndex((i) => Math.min(i + 1, sessions.length - 1));
    } else if (input === "k" || key.upArrow) {
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={1}
      width={60}
    >
      <Text bold color="yellow">
        Filter by session
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {sessions.length === 0 && <Text dimColor>No sessions with active changes</Text>}
        {sessions.map((session, i) => (
          <Box key={session.session_id} gap={1}>
            <Text inverse={i === selectedIndex} bold={i === selectedIndex}>
              {i === selectedIndex ? "> " : "  "}
              {session.label || session.session_id.slice(0, 8)}
            </Text>
            <Box flexGrow={1} />
            <Text dimColor={i !== selectedIndex}>
              U({session.unstagedCount}) S({session.stagedCount})
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>j/k navigate | Enter select | Esc cancel</Text>
      </Box>
    </Box>
  );
}
