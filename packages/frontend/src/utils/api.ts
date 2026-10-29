import type {
  LogLine,
  ServerAction,
  ServerStatus,
} from "@adadmin/backend/types";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getStatus: () => fetchApi<ServerStatus>("/server/status"),
  control: (action: ServerAction) =>
    fetchApi<ServerStatus>(`/server/${action}`, { method: "POST" }),
  getLogs: () => fetchApi<LogLine[]>("/server/logs?lines=200"),
};
