import { useState } from "react";
import { Box, Text } from "ink";

export function App() {
  const [base, setBase] = useState("main");
  const [target, setTarget] = useState("HEAD");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <Box flexDirection="column" width="100%">
      {/* Main panels */}
      <Box flexGrow={1}>
        {/* File tree panel */}
        <Box
          flexDirection="column"
          width={30}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text bold color="cyan">
            Files
          </Text>
          <Text dimColor>No files loaded</Text>
        </Box>

        {/* Diff viewer panel */}
        <Box
          flexDirection="column"
          flexGrow={1}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text bold color="cyan">
            Diff
          </Text>
          {selectedFile ? (
            <Text>Viewing: {selectedFile}</Text>
          ) : (
            <Text dimColor>Select a file to view diff</Text>
          )}
        </Box>
      </Box>

      {/* Status bar */}
      <Box paddingX={1} justifyContent="space-between">
        <Text>
          <Text color="green">{target}</Text>
          <Text dimColor>{" <- "}</Text>
          <Text color="yellow">{base}</Text>
        </Text>
        <Text dimColor>
          [sb] switch base [st] switch target [q] quit
        </Text>
      </Box>
    </Box>
  );
}
