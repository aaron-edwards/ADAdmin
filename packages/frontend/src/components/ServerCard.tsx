import type {
  ServerAction,
  ServerState,
  ServerStatus,
} from "@adadmin/backend/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../utils/api";
import { ConfirmDialog } from "./ConfirmDialog";
import { Badge, type BadgeProps } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const stateBadges: Record<
  ServerState,
  { label: string; variant: BadgeProps["variant"] }
> = {
  stopped: { label: "Stopped", variant: "default" },
  starting: { label: "Starting…", variant: "warning" },
  running: { label: "Running", variant: "success" },
  stopping: { label: "Stopping…", variant: "warning" },
  failed: { label: "Failed", variant: "error" },
  unmanaged: { label: "Running outside systemd", variant: "warning" },
};

const transitional: ServerState[] = ["starting", "stopping"];

type ConfirmableAction = Exclude<ServerAction, "start">;

const confirmations: Record<
  ConfirmableAction,
  { title: string; label: string; body: string }
> = {
  stop: {
    title: "Stop the server?",
    label: "Stop",
    body: "The server saves and shuts down.",
  },
  restart: {
    title: "Restart the server?",
    label: "Restart",
    body: "The server saves, shuts down and starts again.",
  },
};

export function ServerCard() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<ConfirmableAction | null>(null);

  const status = useQuery({
    queryKey: ["serverStatus"],
    queryFn: api.getStatus,
    refetchInterval: (query) =>
      transitional.includes(query.state.data?.state ?? "stopped")
        ? 2_000
        : 5_000,
  });

  const control = useMutation({
    mutationFn: api.control,
    onSuccess: (data) => {
      queryClient.setQueryData<ServerStatus>(["serverStatus"], data);
    },
  });

  const state = status.data?.state;
  const game = status.data?.game;
  const busy = control.isPending;
  const canStart = state === "stopped" || state === "failed";
  const canStop = state === "running" || state === "starting";

  function confirm() {
    if (confirming) control.mutate(confirming);
    setConfirming(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server</CardTitle>
        {state && (
          <Badge variant={stateBadges[state].variant}>
            {stateBadges[state].label}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isPending && <p className="text-gray-500">Loading status…</p>}
        {status.isError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            Can't reach ADAdmin: {status.error.message}
          </p>
        )}

        {state === "unmanaged" && (
          <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            The server was started outside satisfactory.service, so it can't be
            controlled from here. Stop it where it was started.
          </p>
        )}
        {state === "starting" && !game && (
          <p className="text-sm text-gray-600">
            Waiting for the server to finish loading…
          </p>
        )}

        {game && (
          <dl className="grid grid-cols-2 gap-3">
            <Stat
              label="Players"
              value={`${game.players} / ${game.playerLimit}`}
            />
            <Stat label="Tech tier" value={game.techTier} />
            <Stat label="Paused" value={game.isPaused ? "Yes" : "No"} />
            <Stat label="Tick rate" value={game.tickRate.toFixed(1)} />
            <Stat
              label="Session"
              value={game.sessionName}
              className="col-span-2"
            />
          </dl>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            disabled={!canStart || busy}
            onClick={() => control.mutate("start")}
          >
            Start
          </Button>
          <Button
            variant="secondary"
            disabled={!canStop || busy}
            onClick={() => setConfirming("restart")}
          >
            Restart
          </Button>
          <Button
            variant="destructive"
            disabled={!canStop || busy}
            onClick={() => setConfirming("stop")}
          >
            Stop
          </Button>
        </div>

        {control.isError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {control.error.message}
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming ? confirmations[confirming].title : ""}
        confirmLabel={confirming ? confirmations[confirming].label : ""}
        onConfirm={confirm}
        onCancel={() => setConfirming(null)}
      >
        <p>{confirming && confirmations[confirming].body}</p>
        {game && game.players > 0 && (
          <p className="mt-2 font-semibold text-red-700">
            {game.players} {game.players === 1 ? "player is" : "players are"}{" "}
            online.
          </p>
        )}
      </ConfirmDialog>
    </Card>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="truncate text-lg font-medium text-gray-900">{value}</dd>
    </div>
  );
}
