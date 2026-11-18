# The Urban Game: Chicago

A 3D version of the paper "Urban Game" for US History. Students start with empty prairie west of the Chicago River in 1837 and build a city by 1900, one round at a time.

Each of the eleven rounds works the same way:

1. **History.** A short card sets the scene.
2. **Build.** The game lists what must be built. Students decide where each thing goes.
3. **What happened.** Newcomers arrive and the game reports, in plain sentences, what those placements did to the people living there.

- **Play:** open `index.html` from a web server (GitHub Pages works: Settings, Pages, deploy from the `main` branch root).
- **Teacher script:** `teacher.html`
- No accounts, no network play, no build step. three.js is included in `vendor/`. After one online load the game opens offline.

## Files

| File | What it is |
| --- | --- |
| `js/data.js` | The eleven rounds (history text, build lists, discussion questions) and the building table. Edit text here. |
| `js/sim.js` | The rules: what placement does to health, happiness, work, fire, and disease. |
| `js/world.js` | three.js renderer. |
| `js/main.js` | Round flow and interface. |
| `js/report.js` | The printable final report. |
| `tools/bot.mjs` | Headless playthroughs for tuning: `node tools/bot.mjs` |

## Address options

- `?skip=5` let the builders play the first five rounds (for previewing later ones)
- `?lowgfx` force the lightest graphics setting
