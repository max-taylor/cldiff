import { describe, test, expect, afterEach } from "bun:test";
import React from "react";
import { render, cleanup } from "ink-testing-library";
import { Text } from "ink";
import { useVimNavigation } from "./use-vim-navigation";

const delay = () => new Promise((r) => setTimeout(r, 50));

function TestComponent({
  itemCount,
  onSelect,
}: {
  itemCount: number;
  onSelect: (i: number) => void;
}) {
  const { selectedIndex } = useVimNavigation({
    itemCount,
    isFocused: true,
    onSelect,
  });
  return <Text>selected:{selectedIndex}</Text>;
}

afterEach(() => {
  cleanup();
});

function selected(instance: { lastFrame: () => string | undefined }) {
  const frame = instance.lastFrame();
  const match = frame?.match(/selected:(\d+)/);
  return match ? parseInt(match[1]!, 10) : -1;
}

describe("useVimNavigation", () => {
  test("starts at index 0", () => {
    const app = render(<TestComponent itemCount={5} onSelect={() => {}} />);
    expect(selected(app)).toBe(0);
  });

  test("j moves down", async () => {
    const app = render(<TestComponent itemCount={5} onSelect={() => {}} />);
    app.stdin.write("j");
    await delay();
    expect(selected(app)).toBe(1);
    app.stdin.write("j");
    await delay();
    expect(selected(app)).toBe(2);
  });

  test("k moves up", async () => {
    const app = render(<TestComponent itemCount={5} onSelect={() => {}} />);
    app.stdin.write("j");
    await delay();
    app.stdin.write("j");
    await delay();
    app.stdin.write("k");
    await delay();
    expect(selected(app)).toBe(1);
  });

  test("k wraps around to last item", async () => {
    const app = render(<TestComponent itemCount={5} onSelect={() => {}} />);
    app.stdin.write("k");
    await delay();
    expect(selected(app)).toBe(4);
  });

  test("j wraps around to first item", async () => {
    const app = render(<TestComponent itemCount={3} onSelect={() => {}} />);
    for (let i = 0; i < 5; i++) {
      app.stdin.write("j");
      await delay();
    }
    expect(selected(app)).toBe(2);
  });

  test("G jumps to last item", async () => {
    const app = render(<TestComponent itemCount={10} onSelect={() => {}} />);
    app.stdin.write("G");
    await delay();
    expect(selected(app)).toBe(9);
  });

  test("g jumps to first item", async () => {
    const app = render(<TestComponent itemCount={10} onSelect={() => {}} />);
    app.stdin.write("G");
    await delay();
    app.stdin.write("g");
    await delay();
    expect(selected(app)).toBe(0);
  });

  test("enter calls onSelect with current index", async () => {
    const calls: number[] = [];
    const app = render(
      <TestComponent itemCount={5} onSelect={(i) => calls.push(i)} />,
    );
    app.stdin.write("j");
    await delay();
    app.stdin.write("j");
    await delay();
    app.stdin.write("\r");
    await delay();
    expect(calls).toEqual([2]);
  });
});
