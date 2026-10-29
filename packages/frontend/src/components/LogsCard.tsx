import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Unreal prefixes lines with a UTC timestamp and frame number, e.g.
// "[2026.10.28-11.47.37:685][616]". The journal's local time is shown instead.
const unrealPrefix = /^\[\d{4}\.\d{2}\.\d{2}-[\d.:]+\]\[\s*\d+\]/;

export function LogsCard() {
  const logs = useQuery({
    queryKey: ["serverLogs"],
    queryFn: api.getLogs,
    refetchInterval: 10_000,
  });
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logs.data && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [logs.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent log</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scroller}
          className="max-h-96 overflow-auto bg-gray-900 p-3 font-mono text-xs leading-relaxed text-gray-100"
        >
          {logs.isError && <p className="text-red-400">{logs.error.message}</p>}
          {logs.data?.length === 0 && (
            <p className="text-gray-400">No log lines yet.</p>
          )}
          {logs.data?.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: log lines have no stable id
            <div key={i} className="whitespace-pre-wrap break-all">
              <span className="text-gray-500">
                {new Date(line.time).toLocaleTimeString()}
              </span>{" "}
              {line.message.replace(unrealPrefix, "")}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
