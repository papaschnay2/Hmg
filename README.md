# Holiday Movie Generator

Spin three reels (her job, the town, his job) and get the cozy small-town holiday
romance you've definitely already seen: a title, a tagline, a plot summary, a
coziness rating, and a round of trope bingo.

- **Lock** a reel to keep it while you re-spin the others.
- **Copy link** shares the exact movie (the combo and plot are stored in the URL hash).

## Running it

It's plain HTML/CSS/JS with no build step. Open `index.html`, or serve the folder:

    python3 -m http.server

To host it, turn on GitHub Pages for the repo (Settings → Pages → deploy from branch).

## Adding more options

Everything lives in `data.js`: `HEROINES`, `LOCATIONS`, `HEROES`, plus the name,
title-template, plot and trope lists. Add an entry to any list and it shows up on the reels.
