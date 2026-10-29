import type { UpdateStatus } from "@adadmin/backend/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../utils/api";
import { useServerStatus } from "../utils/queries";
import { ConfirmDialog } from "./ConfirmDialog";
import { LogViewer } from "./LogViewer";
import { Badge, type BadgeProps } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const stateBadges: Record<
  UpdateStatus["state"],
  { label: string; variant: BadgeProps["variant"] } | null
> = {
  idle: null,
  running: { label: "Updating…", variant: "warning" },
  succeeded: { label: "Done", variant: "success" },
  failed: { label: "Failed", variant: "error" },
};

export function UpdateCard() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const server = useServerStatus();

  const update = useQuery({
    queryKey: ["update"],
    queryFn: api.getUpdate,
    refetchInterval: (query) =>
      query.state.data?.state === "running" ? 1_000 : 10_000,
  });

  const start = useMutation({
    mutationFn: api.startUpdate,
    onSuccess: (data) => {
      queryClient.setQueryData<UpdateStatus>(["update"], data);
      queryClient.invalidateQueries({ queryKey: ["serverStatus"] });
    },
  });

  const status = update.data;
  const badge = status && stateBadges[status.state];
  const serverState = server.data?.state;
  const serverStopped = serverState === "stopped" || serverState === "failed";
  const running = status?.state === "running";

  function confirm() {
    setConfirming(false);
    start.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update</CardTitle>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Download the latest public build with SteamCMD.
          {!serverStopped && !running && " Stop the server first."}
        </p>

        <Button
          className="w-full"
          disabled={!serverStopped || running || start.isPending}
          onClick={() => setConfirming(true)}
        >
          Update server
        </Button>

        {start.isError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {start.error.message}
          </p>
        )}
        {status?.state === "succeeded" && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            {status.buildBefore === status.buildAfter
              ? `Already up to date (build ${status.buildAfter}).`
              : `Updated from build ${status.buildBefore} to ${status.buildAfter}.`}{" "}
            Check Satisfactory Mod Manager before starting the server.
          </p>
        )}
        {status?.state === "failed" && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            The update failed. See the output below.
          </p>
        )}
      </CardContent>

      {status && status.output.length > 0 && (
        <LogViewer scrollKey={status.output.length}>
          {status.output.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: output lines have no stable id
            <div key={i} className="whitespace-pre-wrap break-all">
              {line}
            </div>
          ))}
        </LogViewer>
      )}

      <ConfirmDialog
        open={confirming}
        title="Update the server?"
        confirmLabel="Update"
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      >
        <p>
          SteamCMD downloads the latest public build. The server can't be
          started until it finishes.
        </p>
        <p className="mt-2 font-semibold text-red-700">
          Game updates can break mods.
        </p>
        <p className="mt-1">
          Mods installed with Satisfactory Mod Manager may stop working until
          they're updated for the new version. Check SMM before starting the
          server again.
        </p>
      </ConfirmDialog>
    </Card>
  );
}
