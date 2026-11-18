# The Urban Game: Chicago, 1865 to 1900

A 3D city-building lab for US History (Gilded Age). Students run one ward of Chicago's Near West Side for 35 years while trains keep delivering newcomers. They zone land and pay for public works; builders, landlords, factory owners, and a ward boss do the rest.

- **Play:** open `index.html` from a web server (GitHub Pages works: Settings, Pages, deploy from the `main` branch root).
- **Teacher script and notes:** `teacher.html`
- **Two modes:** solo (clock runs on its own) or teacher-led (stops after each of seven rounds).
- **No accounts, no network play, no build step.** three.js is included in `vendor/`. After one online load the game opens offline.

## Files

| File | What it is |
| --- | --- |
| `js/data.js` | Map constants, building table, arrivals, and the whole historical script (events, choices, rounds, resident quotes). Edit text here. |
| `js/sim.js` | The simulation. One `step()` is one month. Deterministic: same choices give the same city. |
| `js/world.js` | three.js renderer: instanced buildings, GPU smoke, fire, crowds, street view, photographs. |
| `js/main.js` | Interface, tools, clock, solo and teacher-led flow, saving. |
| `js/report.js` | The printable end-of-game report. |
| `tools/bot.mjs` | Headless playthroughs for tuning: `node tools/bot.mjs` |

## Address options

- `?skip=1885` jump to a year using default choices (for previewing)
- `?lowgfx` force the lightest graphics setting
- `?speed=4` run the clock faster (testing)
