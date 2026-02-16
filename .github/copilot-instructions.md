# Copilot Instructions — Buzz TV Party Game

## Project Overview

A buzzer-style party game for Android TV built with [couch-kit](https://github.com/faluciano/react-native-couch-kit). This is the official couch-kit starter project. The TV displays the game state (host), and players buzz in from their phones (clients).

## Architecture

3 packages under `packages/`, managed with Bun workspaces:

| Package  | Name                | Purpose                                                                   |
| -------- | ------------------- | ------------------------------------------------------------------------- |
| `shared` | `@buzz-game/shared` | Game logic — reducer, types. Consumed by both client and host.            |
| `client` | `@buzz-game/client` | Web app (React + Vite + Tailwind + Framer Motion). Players interact here. |
| `host`   | `@buzz-game/host`   | Android TV app (React Native + Expo). Displays game on TV.                |

## How couch-kit Is Used

- **Host:** `GameHostProvider` wraps the app with `reducer={buzzReducer}` and `initialState`. Uses `useRoom()`, `usePlayers()`, `useGameState<BuzzGameState, BuzzAction>()`.
- **Client:** `CouchKitProvider` wraps the app. Uses `useCouchKit<BuzzGameState, BuzzAction>()` for state, dispatch, playerId.
- **Shared:** `buzzReducer` is a plain `(state, action) => state` function. couch-kit's `createGameReducer` wraps it on the host side.

## Game Logic

- Any number of players
- Phases: `lobby` → `playing`
- Actions: `START_GAME`, `BUZZ` (first player wins), `RESET`, `RETURN_TO_LOBBY`
- State: `{ phase, buzzedPlayerId, buzzedAt, players }`

## Important Patterns

### PLAYER_JOINED Dual Handling

Both `createGameReducer` (framework) AND `buzzReducer` (app) handle `PLAYER_JOINED`. The framework adds the player to `state.players`. The app reducer creates a game-specific player entry. This is intentional.

### State Ownership

- **Framework-managed:** `state.players` (connection tracking, reconnection)
- **App-managed:** `phase`, `buzzedPlayerId`, `buzzedAt`, app-level `players`

## Package Manager

**Bun** (pinned to 1.2.19). Do NOT use npm, yarn, or pnpm.

## Build & Dev

```bash
bun install                 # install all dependencies
bun run dev:client          # start Vite dev server (web client)
bun run dev:host            # start Expo/Metro (Android TV host)
bun run typecheck           # typecheck shared then client
bun run build:client        # build web client via Vite
bun run bundle:client       # bundle web client into Android assets
bun run build:android       # full Android build (bundle + expo run)
```

## Updating @couch-kit Dependencies

When a new version of couch-kit is published:

1. Update versions in the relevant `packages/*/package.json` files:
   - `packages/shared/package.json` → `@couch-kit/core`
   - `packages/client/package.json` → `@couch-kit/client`
   - `packages/host/package.json` → `@couch-kit/host`, `@couch-kit/cli`
2. Run `bun install` to update the lockfile
3. Run `bun run typecheck` to verify type compatibility
4. Run `bun run build:client` to verify the build
5. If there are breaking changes (major bump), check the [CHANGELOG](https://github.com/faluciano/react-native-couch-kit/blob/main/packages/host/CHANGELOG.md) for migration instructions

## CI

PRs to `main` run: `bun install --frozen-lockfile` → `typecheck` → `build:client`. The `check` job must pass before merging.
