import Router from "@koa/router";
import { getServerStatus } from "../services/server.ts";
import { controlUnit, recentLogs } from "../services/systemd.ts";
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
  await controlUnit(action);
  ctx.body = await getServerStatus();
});

router.get("/server/logs", async (ctx) => {
  const lines = Math.min(Math.max(Number(ctx.query.lines) || 200, 1), 1000);
  ctx.body = await recentLogs(lines);
});

export { router as apiRouter };
