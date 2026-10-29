# ADAdmin

> *"FICSIT reminds you that downtime is theft."*

A small web app for managing a Satisfactory dedicated server from your phone (or anything else on your local network). Start, stop and restart the server without walking over to the PC.

Named after ADA, FICSIT's ever-helpful onboard AI. Sibling of [PALadin](https://github.com/aaron-edwards/PALadin).

## Planned features

- Server status at a glance: running or stopped, players online, tech tier, paused or not
- Start, stop and restart buttons
- Rollback to a chosen autosave
- Server updates via SteamCMD
- Recent server log output

## How it will work

- **Process control:** the server runs as a systemd user service, and ADAdmin calls `systemctl --user start|stop|restart`.
- **Server info:** read from Satisfactory's built-in HTTPS API on port 7777, authenticated with an API token.

## Tech stack

- **Monorepo:** pnpm workspaces
- **Backend:** Node.js + Koa + TypeScript
- **Frontend:** React + TypeScript + TanStack Query
