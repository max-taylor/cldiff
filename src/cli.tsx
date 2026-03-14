#!/usr/bin/env bun
import { render } from "ink";
import { resolve } from "path";
import { App } from "./app.tsx";

// Accept optional directory argument, default to cwd
// In compiled binaries, Bun injects the binary path into argv, so filter it out
const userArgs = process.argv.filter(
  (arg) => !arg.startsWith("/$bunfs/") && arg !== process.argv[0],
);
const targetDir = resolve(process.cwd(), userArgs[1] ?? ".");

const restoreScreen = () => process.stdout.write("\x1b[?1049l");

// Restore screen on crash so errors are visible
process.on("uncaughtException", (err) => {
  restoreScreen();
  console.error("gitscope crashed:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  restoreScreen();
  console.error("gitscope crashed (unhandled rejection):", err);
  process.exit(1);
});

// Enter alternate screen buffer (fullscreen, like vim)
process.stdout.write("\x1b[?1049h");
process.stdout.write("\x1b[H");

const instance = render(<App cwd={targetDir} />, {
  exitOnCtrlC: true,
  kittyKeyboard: { mode: "auto" },
});

instance.waitUntilExit().then(restoreScreen);
