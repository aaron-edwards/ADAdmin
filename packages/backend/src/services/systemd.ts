import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { LogLine, ServerAction } from "../types.ts";

const run = promisify(execFile);
const UNIT = "satisfactory";

export async function unitState(): Promise<string> {
  // is-active exits non-zero for anything but "active", but still prints the state.
  try {
    const { stdout } = await run("systemctl", ["--user", "is-active", UNIT]);
    return stdout.trim();
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout?.trim();
    if (stdout) return stdout;
    throw error;
  }
}

export async function controlUnit(action: ServerAction): Promise<void> {
  // start returns as soon as the process is launched (and reports a failed
  // pre-start check); stop can take minutes while the game saves, so don't wait.
  const args = action === "start" ? [] : ["--no-block"];
  try {
    await run("systemctl", ["--user", ...args, action, UNIT]);
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr || `systemctl ${action} failed`);
  }
}

export async function recentLogs(lines: number): Promise<LogLine[]> {
  const { stdout } = await run(
    "journalctl",
    [
      "--user",
      "-u",
      UNIT,
      "-n",
      String(lines),
      "-o",
      "json",
      "--output-fields=MESSAGE",
      "--no-pager",
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const entry = JSON.parse(line);
      // journald stores non-UTF-8 messages as byte arrays.
      const message = Array.isArray(entry.MESSAGE)
        ? Buffer.from(entry.MESSAGE).toString("utf8")
        : String(entry.MESSAGE ?? "");
      return { time: Number(entry.__REALTIME_TIMESTAMP) / 1000, message };
    });
}
