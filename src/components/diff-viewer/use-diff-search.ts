import { useState, useMemo } from "react";
import type { DiffLine } from "./types.ts";

export function useDiffSearch(lines: DiffLine[]) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matches = useMemo(() => {
    if (!searchQuery) return [];
    return lines.reduce<number[]>((acc, line, i) => {
      if (line.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        acc.push(i);
      }
      return acc;
    }, []);
  }, [lines, searchQuery]);

  const start = () => {
    setIsSearching(true);
    setSearchQuery("");
  };

  /** Returns the line to jump to, or undefined. */
  const handleInput = (
    input: string,
    key: {
      escape?: boolean;
      return?: boolean;
      backspace?: boolean;
      delete?: boolean;
      ctrl?: boolean;
      meta?: boolean;
    },
  ): void => {
    if (key.escape) {
      setIsSearching(false);
      setSearchQuery("");
      setMatchIndices([]);
    } else if (key.return) {
      setIsSearching(false);
      setMatchIndices(matches);
      setCurrentMatchIndex(0);
    } else if (key.backspace || key.delete) {
      setSearchQuery((q) => q.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setSearchQuery((q) => q + input);
    }
  };

  const nextMatch = () => {
    if (matchIndices.length === 0) return undefined;
    const next = (currentMatchIndex + 1) % matchIndices.length;
    setCurrentMatchIndex(next);
    return matchIndices[next];
  };

  const prevMatch = () => {
    if (matchIndices.length === 0) return undefined;
    const prev =
      (currentMatchIndex - 1 + matchIndices.length) % matchIndices.length;
    setCurrentMatchIndex(prev);
    return matchIndices[prev];
  };

  /** Jump to first match after confirming search. */
  const firstMatch = () => (matches.length > 0 ? matches[0] : undefined);

  return {
    isSearching,
    searchQuery,
    matchIndices,
    currentMatchIndex,
    matches,
    start,
    handleInput,
    nextMatch,
    prevMatch,
    firstMatch,
  };
}
