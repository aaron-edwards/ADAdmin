import Router from "@koa/router";
import { getServerStatus } from "../services/server.ts";
import { controlUnit, recentLogs } from "../services/systemd.ts";
import {
  getUpdateStatus,
  isUpdating,
  startUpdate,
} from "../services/update.ts";
import { type ServerAction, serverActions } from "../types.ts";

const router = new Router();

router.get("/server/status", async (ctx) => {
  ctx.body = await getServerStatus();
});

router.post("/server/:action", async (ctx) => {
  const action = ctx.params.action as ServerAction;
  if (!serverActions.includes(action)) {
    ctx.throw(404);
  }
  if (action !== "stop" && isUpdating()) {
    ctx.throw(409, "The server can't start while an update is running");
  }
  await controlUnit(action);
  ctx.body = await getServerStatus();
});

router.get("/server/logs", async (ctx) => {
  const lines = Math.min(Math.max(Number(ctx.query.lines) || 200, 1), 1000);
  ctx.body = await recentLogs(lines);
});

router.get("/update", (ctx) => {
  ctx.body = getUpdateStatus();
});

router.post("/update", async (ctx) => {
  await startUpdate();
  ctx.body = getUpdateStatus();
});

export { router as apiRouter };
