# ADAdmin

> _"FICSIT reminds you that downtime is theft."_

A small web app for managing a Satisfactory dedicated server from your phone (or anything else on your local network). Start, stop and restart the server without walking over to the PC.

Named after ADA, FICSIT's ever-helpful onboard AI. Sibling of [PALadin](https://github.com/aaron-edwards/PALadin).

## Features

- Server status at a glance: running or stopped, players online, tech tier, paused or not
- Start, stop and restart buttons (stop and restart ask for confirmation)
- Stops the server automatically a few minutes after the last player leaves
- Recent server log output
- Server updates via SteamCMD, with live output and a warning that updates can break mods

## How it works

- **Process control:** the server runs as the systemd user service `satisfactory.service`, and ADAdmin calls `systemctl --user start|stop|restart satisfactory`. The unit wraps the server in `systemd-inhibit` so the PC doesn't sleep while it runs, stops it with SIGINT, and refuses to start if a copy is already running outside systemd.
- **Server info:** read from Satisfactory's HTTPS API on `127.0.0.1:7777`. The server is started with `AllowInsecureLocalAccess=1`, so loopback requests need no token.
- **Logs:** read from `journalctl --user -u satisfactory`.
- **Updates:** ADAdmin runs `steamcmd +app_update 1690800 -beta public validate` itself, only while the server is stopped, and won't start the server until it finishes. Requires `steamcmd` on the `PATH`.
- **Saving:** the server saves when a player disconnects and every 5 minutes, but not when it's stopped. Stopping with players online loses progress since the last save.

## Setup

Requires [mise](https://mise.jdx.dev) (provides Node, with corepack enabled for pnpm) and the dedicated server installed in `~/Games/SatisfactoryDedicatedServer`.

```sh
pnpm install
pnpm build
cp .env.example .env            # optional, see Configuration
./scripts/install-units.sh      # copies the units to ~/.config/systemd/user
systemctl --user enable --now adadmin
```

ADAdmin then runs on port 3000 and starts whenever you log in. Allow it through the firewall for the local network only:

```sh
sudo ufw allow from 192.168.1.0/24 to any port 3000 proto tcp
```

Start the server from the app or with `systemctl --user start satisfactory`. Don't also start it by hand: the unit refuses to start while another copy is running, but a copy started by hand won't notice the unit. To start the server at login too, run `systemctl --user enable satisfactory`.

After pulling changes, run `pnpm build` and `systemctl --user restart adadmin`. If anything in `systemd/` changed, run `./scripts/install-units.sh` first.

## Configuration

Set in `.env` at the repo root (see `.env.example`):

| Variable                 | Default   | Description                                                                                                     |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| `HOST`                   | `0.0.0.0` | Address to listen on                                                                                            |
| `PORT`                   | `3000`    | Port to listen on                                                                                               |
| `IDLE_SHUTDOWN_MINUTES`  | `2`       | Stop the server this long after the last player leaves. `0` disables it                                         |
| `SATISFACTORY_API_TOKEN` |           | Only needed without `AllowInsecureLocalAccess=1`. Generate with `server.GenerateAPIToken` in the server console |

## Development

```sh
pnpm dev         # backend on :3000, frontend with hot reload on :5173
pnpm lint
pnpm typecheck
```

## Tech stack

- **Monorepo:** pnpm workspaces
- **Backend:** Node.js + Koa + TypeScript, zod-validated config
- **Frontend:** React + TypeScript + TanStack Query + Tailwind
- **Tooling:** Biome, mise
