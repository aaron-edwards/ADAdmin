import type { ServerState } from "@adadmin/backend/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

const transitional: ServerState[] = ["starting", "stopping", "updating"];

export function useServerStatus() {
  return useQuery({
    queryKey: ["serverStatus"],
    queryFn: api.getStatus,
    refetchInterval: (query) =>
      transitional.includes(query.state.data?.state ?? "stopped")
        ? 2_000
        : 5_000,
  });
}
