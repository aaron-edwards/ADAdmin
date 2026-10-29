import { config } from "../config.ts";
import type { GameState, ServerState, ServerStatus } from "../types.ts";
import { queryServerState } from "./satisfactory-api.ts";
import { controlUnit, unitState } from "./systemd.ts";
import { isUpdating } from "./update.ts";

const idleShutdownMs = config.satisfactory.idleShutdownMinutes * 60_000;
let seenPlayer = false;
let emptySince: number | null = null;

export async function getServerStatus(): Promise<ServerStatus> {
  const [unit, game] = await Promise.all([
    unitState(),
    queryServerState().catch(() => null),
  ]);
  const state = deriveState(unit, game !== null);
  trackIdle(state, game);
  return {
    state,
    game,
    idleShutdownAt:
      idleShutdownMs && emptySince !== null
        ? emptySince + idleShutdownMs
        : null,
  };
}

function deriveState(unit: string, apiUp: boolean): ServerState {
  if (isUpdating()) return "updating";
  switch (unit) {
    case "active":
    case "reloading":
      // The API is unavailable while the server boots and loads the save.
      return apiUp ? "running" : "starting";
    case "activating":
      return "starting";
    case "deactivating":
      return "stopping";
    case "failed":
      return apiUp ? "unmanaged" : "failed";
    default:
      return apiUp ? "unmanaged" : "stopped";
  }
}

// The empty timer only starts once someone has played, so a server nobody
// has joined yet keeps running.
function trackIdle(state: ServerState, game: GameState | null) {
  if (state === "running" && game) {
    if (game.players > 0) {
      seenPlayer = true;
      emptySince = null;
    } else if (seenPlayer) {
      emptySince ??= Date.now();
    }
  } else if (state === "starting") {
    // Either booting or a failed API call; don't count it as empty time.
    emptySince = null;
  } else {
    seenPlayer = false;
    emptySince = null;
  }
}

export function startIdleShutdown() {
  if (!idleShutdownMs) return;
  setInterval(async () => {
    try {
      const { idleShutdownAt } = await getServerStatus();
      if (idleShutdownAt !== null && Date.now() >= idleShutdownAt) {
        console.log("Server has been empty too long, stopping it");
        seenPlayer = false;
        emptySince = null;
        await controlUnit("stop");
      }
    } catch (error) {
      console.error("Idle shutdown check failed:", error);
    }
  }, 15_000);
}
