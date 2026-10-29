import { fileURLToPath } from "node:url";
import Router from "@koa/router";
import Koa from "koa";
import serve from "koa-static";
import { apiRouter } from "./routes/api.ts";

const app = new Koa();
const router = new Router();

// Any thrown error becomes { message } so the frontend can show it.
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    ctx.status = status;
    ctx.body = {
      message: error instanceof Error ? error.message : "Unknown error",
    };
    if (status >= 500) console.error(error);
  }
});

// Every /api route goes through this router, so a shared-password check can
// later be added here as a single middleware.
router.use("/api", apiRouter.routes(), apiRouter.allowedMethods());
app.use(router.routes());
app.use(router.allowedMethods());

if (process.env.NODE_ENV === "production") {
  app.use(
    serve(fileURLToPath(new URL("../../frontend/dist", import.meta.url))),
  );
}

export { app };
