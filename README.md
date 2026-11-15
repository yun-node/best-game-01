# Emberfall

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/yun-node/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/yun-node/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A neon arena survival shooter. You pilot the last ember-ship and defend the Ember Core against the void swarm: 10 waves, four enemy kinds with their own behaviour, ember shards that mend your hull, power-ups, bombs, and one upgrade chosen from three after every cleared wave. Clear wave 10 and the ember is kept.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network: every file the game loads lives under `game/`, and all sound is synthesized with the Web Audio API.

**Controls:** WASD / arrows to move, mouse to aim, hold click to fire, SPACE for a bomb, P to pause, M to mute. Between waves, pick an upgrade with 1 / 2 / 3 or a click. R restarts from an end screen.

## How it is built

Plain Canvas 2D, no engine and no libraries, split into files with one job each:

- `game/src/config.js` — tuning, palette, wave table, upgrade pool
- `game/src/random.js` — seeded RNG and geometry helpers
- `game/src/audio.js` — synthesized effects and music (Web Audio)
- `game/src/input.js` — keyboard, mouse and clickable canvas UI
- `game/src/entities.js` — player, enemies, bullets, shards, power-ups
- `game/src/particles.js` — particles, floating text, starfield
- `game/src/waves.js` — wave plans, spawning, upgrade offers
- `game/src/render.js` — arena, ships, HUD and every screen
- `game/src/main.js` — state machine, game loop, collisions, shot scenes

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's vendored library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are deterministic captures of the game's own scenes (`?shot=title|play|win|over&seed=N`); `shots.mjs` takes them with Playwright.

---

<sub>Entered on [make.fun](https://make.fun/?ref=swpt7fym&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
