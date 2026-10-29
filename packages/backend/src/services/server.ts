import type { ServerState, ServerStatus } from "../types.ts";
import { queryServerState } from "./satisfactory-api.ts";
import { unitState } from "./systemd.ts";

export async function getServerStatus(): Promise<ServerStatus> {
  const [unit, game] = await Promise.all([
    unitState(),
    queryServerState().catch(() => null),
  ]);
  return { state: deriveState(unit, game !== null), game };
}

function deriveState(unit: string, apiUp: boolean): ServerState {
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
