export type ServerState =
  | "stopped"
  | "starting"
  | "running"
  | "stopping"
  | "failed"
  | "updating"
  // The game API answers but satisfactory.service isn't active, so the server
  // was started some other way and can't be controlled from here.
  | "unmanaged";

export interface GameState {
  sessionName: string;
  players: number;
  playerLimit: number;
  techTier: number;
  isPaused: boolean;
  tickRate: number;
}

export interface ServerStatus {
  state: ServerState;
  game: GameState | null;
  // When the server will be stopped for being empty (epoch ms), if it's empty.
  idleShutdownAt: number | null;
}

export const serverActions = ["start", "stop", "restart"] as const;
export type ServerAction = (typeof serverActions)[number];

export interface LogLine {
  time: number;
  message: string;
}

export interface UpdateStatus {
  state: "idle" | "running" | "succeeded" | "failed";
  output: string[];
  startedAt: number | null;
  finishedAt: number | null;
  buildBefore: string | null;
  buildAfter: string | null;
}
