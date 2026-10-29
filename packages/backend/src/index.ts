import { app } from "./app.ts";
import { config } from "./config.ts";
import { startIdleShutdown } from "./services/server.ts";

const { host, port } = config.server;
app.listen(port, host, () => {
  console.log(`ADAdmin listening on http://${host}:${port}`);
});
startIdleShutdown();
