import { Box, Text, useInput } from "ink";

interface KeybindingHelpProps {
  onClose: () => void;
}

const sections = [
  {
    title: "Global",
    bindings: [
      ["h", "Focus file tree"],
      ["l", "Focus diff viewer"],
      ["J", "Next file"],
      ["K", "Previous file"],
      ["s", "Filter by Claude session"],
      ["Esc", "Clear session filter"],
      ["a", "Stage/unstage file"],
      ["?", "Show keybindings"],
      ["q", "Quit"],
    ],
  },
  {
    title: "Navigation (file tree & diff)",
    bindings: [
      ["j / ↓", "Move down"],
      ["k / ↑", "Move up"],
      ["d", "Half-page down"],
      ["u", "Half-page up"],
      ["g", "Jump to top"],
      ["G", "Jump to bottom"],
      ["Enter", "Select file (file tree)"],
      ["c", "Add comment (diff)"],
      ["x", "Delete comment (diff)"],
    ],
  },
  {
    title: "Diff search",
    bindings: [
      ["/", "Search"],
      ["n", "Next match"],
      ["N", "Previous match"],
      ["Esc", "Cancel search"],
    ],
  },
] as const;

export function KeybindingHelp({ onClose }: KeybindingHelpProps) {
  useInput((input, key) => {
    if (key.escape || input === "?") {
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      width={50}
    >
      <Text bold color="yellow">
        Keybindings
      </Text>
      {sections.map((section) => (
        <Box key={section.title} flexDirection="column" marginTop={1}>
          <Text bold underline>
            {section.title}
          </Text>
          {section.bindings.map(([key, desc]) => (
            <Box key={key} gap={1}>
              <Box width={10}>
                <Text color="cyan">{key}</Text>
              </Box>
              <Text>{desc}</Text>
            </Box>
          ))}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>Press Esc or ? to close</Text>
      </Box>
    </Box>
  );
}
