import { useState, useCallback } from "react";
import { useInput } from "ink";

interface UseVimNavigationOptions {
  itemCount: number;
  isFocused: boolean;
  onSelect: (index: number) => void;
  pageSize?: number;
}

export function useVimNavigation({
  itemCount,
  isFocused,
  onSelect,
  pageSize = 10,
}: UseVimNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const wrap = useCallback(
    (index: number) => ((index % itemCount) + itemCount) % itemCount,
    [itemCount],
  );

  const clamp = useCallback(
    (index: number) => Math.max(0, Math.min(index, itemCount - 1)),
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
      } else if (input === "d") {
        setSelectedIndex((i) => clamp(i + pageSize));
      } else if (input === "u") {
        setSelectedIndex((i) => clamp(i - pageSize));
      } else if (key.return) {
        onSelect(selectedIndex);
      }
    },
    { isActive: isFocused },
  );

  return { selectedIndex, setSelectedIndex };
}
