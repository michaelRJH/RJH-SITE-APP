# RJH Site app

The phone app for R.J. Howard Engineers site records: dayworks, extras, remedials, manhole cards, foundation records, gradient sheets, trial holes, level book, plus the quantity and setting-out calculators.

Live at https://michaelrjh.github.io/RJH-SITE-APP/

## How it is built

`index.html` is one file built from the pieces in `src/`. Do not edit `index.html` by hand.

1. Change the pieces in `src/` (the `.js` and `.html` parts, or the patch scripts `r63.py` onwards).
2. Put the new version number in `src/VERSION` (e.g. `v70`).
3. Run `./build.sh`. It writes `index.html` and bumps the cache name in `sw.js` so phones pick up the update.
4. Run the tests in `tools/` (Playwright, Python). `tools/srv.sh` serves the app on port 8765; `tools/tsync.py` fakes Microsoft sign-in and SharePoint so the filing can be tested without touching the real site.
5. Commit and push. GitHub Pages publishes it within a minute or two.

## Where things live

- Site records go to the RJH-Site SharePoint site: `Client / Job / Site records / Type / file.pdf`.
- Each job's set-up (people, plots, manhole schedule, runs, house types, notice) is `Client / Job / _app / job.json`.
- Drawings and house type data belong to the job in SharePoint, never in this public repo.
- The app never writes to RJH-Internal.
- No prices or rates anywhere in the app or its exports. The build fails if a pound sign gets in.
