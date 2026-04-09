import { useState, useCallback } from "react";
import { useInput } from "ink";

interface UseVimNavigationOptions {
  itemCount: number;
  isFocused: boolean;
  onSelect: (index: number) => void;
}

export function useVimNavigation({
  itemCount,
  isFocused,
  onSelect,
}: UseVimNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const wrap = useCallback(
    (index: number) => ((index % itemCount) + itemCount) % itemCount,
    [itemCount],
  );

  useInput(
    (input, key) => {
      if (!isFocused || itemCount === 0) return;
      if (key.ctrl) return;

      if (input === "j" || key.downArrow) {
        setSelectedIndex((i) => wrap(i + 1));
      } else if (input === "k" || key.upArrow) {
        setSelectedIndex((i) => wrap(i - 1));
      } else if (input === "G") {
        setSelectedIndex(itemCount - 1);
      } else if (input === "g") {
        // gg — handled as single g for now (true gg requires key sequence tracking)
        setSelectedIndex(0);
      } else if (key.return) {
        onSelect(selectedIndex);
      }
    },
    { isActive: isFocused },
  );

  return { selectedIndex, setSelectedIndex };
}
