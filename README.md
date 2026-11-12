# The Unofficial Hallmark Movie Generator

Spin three reels (her job, the place, his job), get a parody pitch for a cozy
Christmas romance, then find out whether Hallmark already made it. An unofficial
fan parody, not affiliated with Hallmark.

- **Spin** builds a made-up proposal: title, a two-sentence plot, a projected cast
  (whoever has played those parts most often) and the minute-by-minute schedule.
- **Pitch it to Hallmark** pauses, then reveals the real movies that match: all three
  details ("They made it in 2014. And 2017."), two of three, or no record.
- About one spin in three is quietly steered onto a real movie so jackpots happen
  (`JACKPOT_RATE` in `app.js`).
- **Lock** a reel to keep it while you re-spin the others. **Copy link** shares the finding.
- **Which Hallmark Movie Is Your Life?** matches your job, where you live and your
  partner's job against the real movies.
- **Real or Fake?** shows a real plot (or title) next to a generated one.
- **By the Numbers** reports deadpan statistics, real occupations ("Exhibit A") and
  the most-cast actors, all computed from the movie list.
- The whole page is written in the voice of a made-up research institute.

## Running it

Plain HTML/CSS/JS, no build step. Open `index.html`, or serve the folder:

    python3 -m http.server

To host it, turn on GitHub Pages for the repo (Settings → Pages → deploy from branch).

## The movie data

- `data/research/*.json` is the source of truth: one entry per real movie, with the
  lead actors, her job, his job, the location, tropes and a one-line summary in our own
  words. Fields are `null` where no source confirmed them.
- `tools/build_movies.py` sorts each movie into one option per reel using keyword rules
  and writes `movies.js`. Run `python3 tools/build_movies.py` after editing the research
  files (`-v` lists how every movie was sorted).
- To overrule the sorting for one movie, add `"her_bucket"`, `"place_bucket"` or
  `"him_bucket"` to its entry, using an id from `buckets.js`.
- `buckets.js` holds the reel options and all the parody copy (names, title templates,
  plot pieces).
