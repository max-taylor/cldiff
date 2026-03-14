import { describe, test, expect, afterEach } from "bun:test";
import React from "react";
import { render, cleanup } from "ink-testing-library";
import { Text } from "ink";
import { useVimNavigation } from "./use-vim-navigation";

const delay = () => new Promise((r) => setTimeout(r, 50));

function TestComponent({
  itemCount,
  onSelect,
  pageSize,
}: {
  itemCount: number;
  onSelect: (i: number) => void;
  pageSize?: number;
}) {
  const { selectedIndex } = useVimNavigation({
    itemCount,
    isFocused: true,
    onSelect,
    pageSize,
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

  test("k does not go below 0", async () => {
    const app = render(<TestComponent itemCount={5} onSelect={() => {}} />);
    app.stdin.write("k");
    await delay();
    expect(selected(app)).toBe(0);
  });

  test("j does not exceed itemCount - 1", async () => {
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

  test("d pages down by pageSize", async () => {
    const app = render(
      <TestComponent itemCount={30} onSelect={() => {}} pageSize={5} />,
    );
    app.stdin.write("d");
    await delay();
    expect(selected(app)).toBe(5);
    app.stdin.write("d");
    await delay();
    expect(selected(app)).toBe(10);
  });

  test("u pages up by pageSize", async () => {
    const app = render(
      <TestComponent itemCount={30} onSelect={() => {}} pageSize={5} />,
    );
    app.stdin.write("G");
    await delay();
    app.stdin.write("u");
    await delay();
    expect(selected(app)).toBe(24);
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
