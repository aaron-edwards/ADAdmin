import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import type { UpdateStatus } from "../types.ts";
import { unitState } from "./systemd.ts";

const SERVER_DIR = join(homedir(), "Games/SatisfactoryDedicatedServer");
const APP_ID = "1690800";
const MAX_LINES = 1000;

const run = promisify(execFile);

let status: UpdateStatus = {
  state: "idle",
  output: [],
  startedAt: null,
  finishedAt: null,
  buildBefore: null,
  buildAfter: null,
};

export function getUpdateStatus(): UpdateStatus {
  return status;
}

export function isUpdating(): boolean {
  return status.state === "running";
}

function conflict(message: string) {
  return Object.assign(new Error(message), { status: 409 });
}

async function serverProcessRunning(): Promise<boolean> {
  try {
    await run("pgrep", ["-f", "FactoryServer-Linux-Shipping"]);
    return true;
  } catch {
    return false;
  }
}

async function readBuildId(): Promise<string | null> {
  try {
    const manifest = await readFile(
      join(SERVER_DIR, `steamapps/appmanifest_${APP_ID}.acf`),
      "utf8",
    );
    return manifest.match(/"buildid"\s+"(\d+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function startUpdate(): Promise<void> {
  if (isUpdating()) throw conflict("An update is already running");
  // Claim the slot before awaiting anything so concurrent requests can't both start.
  const previous = status;
  status = { ...previous, state: "running" };

  // The process check also catches a server started outside systemd.
  const [unit, processRunning] = await Promise.all([
    unitState(),
    serverProcessRunning(),
  ]);
  if (!["inactive", "failed"].includes(unit) || processRunning) {
    status = previous;
    throw conflict("Stop the server before updating");
  }

  status = {
    state: "running",
    output: [],
    startedAt: Date.now(),
    finishedAt: null,
    buildBefore: await readBuildId(),
    buildAfter: null,
  };
  runSteamCmd();
}

function runSteamCmd() {
  const output = status.output;
  const append = (line: string) => {
    if (!line.trim()) return;
    output.push(line);
    if (output.length > MAX_LINES) output.shift();
  };

  const child = spawn(
    "steamcmd",
    [
      "+force_install_dir",
      SERVER_DIR,
      "+login",
      "anonymous",
      "+app_update",
      APP_ID,
      "-beta",
      "public",
      "validate",
      "+quit",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  // readline splits on \r too, so steamcmd's progress updates become lines.
  createInterface({ input: child.stdout }).on("line", append);
  createInterface({ input: child.stderr }).on("line", append);

  let finished = false;
  const finish = async (succeeded: boolean) => {
    if (finished) return;
    finished = true;
    const buildAfter = await readBuildId();
    status = {
      ...status,
      state: succeeded ? "succeeded" : "failed",
      finishedAt: Date.now(),
      buildAfter,
    };
  };
  child.on("error", (error) => {
    append(`Failed to run steamcmd: ${error.message}`);
    finish(false);
  });
  child.on("close", (code) => {
    append(`steamcmd exited with code ${code}`);
    finish(code === 0);
  });
}
