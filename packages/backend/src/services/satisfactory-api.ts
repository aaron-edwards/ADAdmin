import { Agent, request } from "node:https";
import { z } from "zod";
import { config } from "../config.ts";
import type { GameState } from "../types.ts";

// Loopback only: the server's certificate is self-signed, and requests over
// loopback need no token when AllowInsecureLocalAccess=1 is set.
const API_URL = "https://127.0.0.1:7777/api/v1";
const agent = new Agent({ rejectUnauthorized: false });

function callApi(fn: string, data?: object): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.satisfactory.apiToken) {
    headers.Authorization = `Bearer ${config.satisfactory.apiToken}`;
  }

  return new Promise((resolve, reject) => {
    const req = request(
      API_URL,
      { method: "POST", agent, headers, timeout: 2_000 },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 204) return resolve(undefined);
          try {
            const json = JSON.parse(body);
            if (json.errorCode) {
              reject(
                new Error(`${fn}: ${json.errorMessage ?? json.errorCode}`),
              );
            } else {
              resolve(json.data);
            }
          } catch {
            reject(new Error(`${fn}: HTTP ${res.statusCode}`));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error(`${fn}: timed out`)));
    req.on("error", reject);
    req.end(JSON.stringify({ function: fn, data }));
  });
}

const serverStateSchema = z.object({
  serverGameState: z.object({
    activeSessionName: z.string(),
    numConnectedPlayers: z.number(),
    playerLimit: z.number(),
    techTier: z.number(),
    isGamePaused: z.boolean(),
    averageTickRate: z.number(),
  }),
});

export async function queryServerState(): Promise<GameState> {
  const { serverGameState: s } = serverStateSchema.parse(
    await callApi("QueryServerState"),
  );
  return {
    sessionName: s.activeSessionName,
    players: s.numConnectedPlayers,
    playerLimit: s.playerLimit,
    techTier: s.techTier,
    isPaused: s.isGamePaused,
    tickRate: s.averageTickRate,
  };
}
