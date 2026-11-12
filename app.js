(() => {
  const REELS = { her: HER, place: PLACE, him: HIM };
  const KEYS = Object.keys(REELS);
  const JACKPOT_RATE = 0.35; // share of spins quietly steered onto a real movie

  // ---------- helpers ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rand, list) => list[Math.floor(rand() * list.length)];
  const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const newSeed = () => Math.floor(Math.random() * 1e9);
  const withArticle = (s) =>
    /^(a|an|the|his|her|one|two|\S+'s)\s/i.test(s) ? s : `${/^[aeiou]/i.test(s) ? "an" : "a"} ${s}`;
  const noParens = (s) => s.replace(/\s*\([^)]*\)/g, "");
  // "Hotel executive" -> "hotel executive", but leave "New York planner" and "TV host" alone
  const lowerFirst = (raw, s = noParens(raw)) =>
    /^[A-Z][a-z'-]+(\s[a-z(]|,|$)/.test(s) && !/^(Hollywood|Chicago|Seattle|Montana|Connecticut|Broadway|Army|Navy|Santa)\b/.test(s)
      ? s[0].toLowerCase() + s.slice(1) : s;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollTo = (node) => node.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  const top = (counts, n) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
  const tally = (list) => list.reduce((acc, x) => ((acc[x] = (acc[x] || 0) + 1), acc), {});

  // ---------- index the real movies ----------
  const indexOf = {};
  KEYS.forEach((k) => { indexOf[k] = {}; REELS[k].forEach((b, i) => (indexOf[k][b.id] = i)); });
  const tallies = {};
  KEYS.forEach((k) => (tallies[k] = REELS[k].map(() => 0)));
  MOVIES.forEach((m) => {
    m.idx = {};
    KEYS.forEach((k) => {
      const i = indexOf[k][m[k]];
      m.idx[k] = i === undefined ? -1 : i;
      if (i !== undefined) tallies[k][i]++;
    });
  });
  const complete = MOVIES.filter((m) => KEYS.every((k) => m.idx[k] >= 0));
  const realTitles = new Set(MOVIES.map((m) => m.t.toLowerCase()));
  const byTitle = new Map(MOVIES.map((m) => [m.t, m]));

  // Who has played each kind of part most often.
  const actorKey = { her: "ha", him: "ia" };
  const overallTop = {}, bucketTop = {};
  ["her", "him"].forEach((k) => {
    const names = MOVIES.map((m) => m[actorKey[k]]).filter(Boolean);
    overallTop[k] = top(tally(names), 1)[0];
    bucketTop[k] = REELS[k].map((_, i) =>
      top(tally(MOVIES.filter((m) => m.idx[k] === i && m[actorKey[k]]).map((m) => m[actorKey[k]])), 1)[0]);
  });

  function findMatches(state, keys = KEYS) {
    const tiers = { 3: [], 2: [], 1: [] };
    MOVIES.forEach((m) => {
      const hits = keys.filter((k) => m.idx[k] === state[k]);
      if (hits.length) tiers[hits.length].push({ m, hits });
    });
    return tiers;
  }

  // ---------- the parody proposal ----------
  function buildPitch(state) {
    const her = HER[state.her], place = PLACE[state.place], him = HIM[state.him];
    const rand = mulberry32(state.seed);
    const spot = pick(rand, place.spots);
    const vars = {
      her: pick(rand, HEROINE_NAMES), him: pick(rand, HERO_NAMES),
      herA: her.a, himA: him.a, goal: her.goal, trait: him.trait, secret: him.secret,
      at: spot.at, town: spot.n.replace(/^the /, ""),
      event: pick(rand, EVENTS), inherits: pick(rand, INHERITS), inciting: pick(rand, INCITING),
      rival: pick(rand, RIVALS), herPun: pick(rand, her.puns), heroPun: pick(rand, him.puns),
    };
    let title;
    for (let i = 0; i < 20; i++) {
      title = fill(pick(rand, TITLE_TEMPLATES), vars);
      const clash = vars.herPun === vars.heroPun && title.split(vars.herPun).length > 2;
      if (!clash && !realTitles.has(title.toLowerCase())) break;
    }
    const taglines = [
      `This Christmas, she came for business. She stayed for ${vars.him}.`,
      `Some things can't be planned. Like falling for ${him.a}.`,
      `She had a five-year plan. ${vars.him} had a truck.`,
      `Home is where the ${vars.herPun.toLowerCase()} is.`,
      `Love is the best gift of all. (So is ${her.thing}.)`,
    ];
    const cast = ["her", "him"].map((k) => bucketTop[k][state[k]] || overallTop[k]).filter(Boolean);
    return {
      title,
      number: 1000 + (state.seed % 9000),
      tagline: pick(rand, taglines),
      synopsis: fill(pick(rand, PLOTS), vars),
      cast,
      beats: BEATS.map((b) => ({ min: b.min, text: fill(pick(rand, b.lines), vars) })),
    };
  }

  // ---------- rendering real movies ----------
  function movieCard(m, note) {
    const li = el("li", "movie");
    const h = el("h3");
    h.append(el("span", "movie-title", m.t), el("span", "movie-year", ` (${m.y})`));
    li.append(h);
    if (note) li.append(el("p", "movie-note", note));
    const stars = [m.ha, m.ia].filter(Boolean).join(" & ");
    if (stars) li.append(el("p", "movie-stars", `Starring ${stars}`));
    const facts = el("dl", "facts");
    [["She's", m.hj], ["Where", m.loc], ["He's", m.ij]].forEach(([k, v]) => {
      if (v) facts.append(el("dt", null, k), el("dd", null, v));
    });
    if (facts.children.length) li.append(facts);
    if (m.s) li.append(el("p", "movie-sum", m.s));
    const a = el("a", "lookup", "Look it up ↗");
    a.href = `https://www.imdb.com/find/?q=${encodeURIComponent(`${m.t} ${m.y}`)}`;
    a.target = "_blank"; a.rel = "noopener";
    li.append(a);
    return li;
  }

  function diffNote(m, missing) {
    if (m.idx[missing] < 0) return "Two for two. We could not confirm the third detail, so this may secretly be a jackpot.";
    return {
      her: `Same movie, except she's ${withArticle(lowerFirst(m.hj))}.`,
      place: m.loc ? `Same movie, except it happens here: ${noParens(m.loc)}.` : `Same movie, different setting.`,
      him: `Same movie, except he's ${withArticle(lowerFirst(m.ij))}.`,
    }[missing];
  }

  // "They made it in 2014. And 2017. And 2021."
  function yearsLine(movies) {
    const years = [...new Set(movies.map((m) => m.y))].sort();
    const shown = years.slice(0, 4);
    let line = `They made it in ${shown[0]}.` + shown.slice(1).map((y) => ` And ${y}.`).join("");
    if (years.length > shown.length) line += ` And ${years.length - shown.length} more times after that.`;
    else if (movies.length > years.length) line += " Some years, twice.";
    return line;
  }

  function renderVerdict(state, pitch) {
    const tiers = findMatches(state);
    const rand = mulberry32(state.seed ^ 0x5eed);
    const shuffle = (a) => a.map((x) => [rand(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const head = $("verdict-head"), sub = $("verdict-sub"), list = $("matches"), meter = $("meter");
    list.innerHTML = "";
    let level, shown;

    if (tiers[3].length) {
      level = 3;
      const n = tiers[3].length;
      shown = shuffle(tiers[3]).slice(0, 4);
      head.textContent = yearsLine(tiers[3].map((x) => x.m));
      sub.textContent = n === 1
        ? `You called it “${pitch.title}.” They called it “${shown[0].m.t}.” The Institute regrets to inform you that your idea is taken.`
        : `You called it “${pitch.title}.” Hallmark has made this movie ${n} times, under the following names:`;
      shown.forEach(({ m }) => list.append(movieCard(m)));
      if (n > shown.length) list.append(el("li", "more", `…and ${n - shown.length} more. Pitch it again to meet them.`));
    } else if (tiers[2].length) {
      level = 2;
      const n = tiers[2].length;
      shown = shuffle(tiers[2]).slice(0, 3);
      head.textContent = "Not yet. But close.";
      sub.textContent = `“${pitch.title}” has not been made. ${plural(n, "existing film is", "existing films are")} one detail away from it.`;
      shown.forEach(({ m, hits }) => list.append(movieCard(m, diffNote(m, KEYS.find((k) => !hits.includes(k))))));
    } else {
      level = tiers[1].length ? 1 : 0;
      shown = shuffle(tiers[1]).slice(0, 2);
      head.textContent = "No record of this film.";
      sub.textContent = `The Institute considers “${pitch.title}” available. Hallmark, our inbox is open.` +
        (shown.length ? " The nearest known relatives:" : "");
      shown.forEach(({ m }) => list.append(movieCard(m)));
    }
    meter.innerHTML = "";
    for (let i = 0; i < 3; i++) meter.append(el("span", i < level ? "pip on" : "pip", "❄"));
    meter.setAttribute("aria-label", `${level} of 3 details match a real movie`);
    $("verdict").dataset.level = level;
  }

  // ---------- reels ----------
  const reelEls = {};
  document.querySelectorAll(".reel").forEach((node) => {
    const key = node.dataset.key;
    const r = (reelEls[key] = {
      el: node, value: node.querySelector(".value"),
      tally: node.querySelector(".tally"), lock: node.querySelector(".lock"),
    });
    r.lock.addEventListener("click", () => {
      const locked = node.classList.toggle("locked");
      r.lock.setAttribute("aria-pressed", String(locked));
      r.lock.textContent = locked ? "🔒 Locked" : "🔓 Lock";
    });
  });

  function showFinal(key, i) {
    reelEls[key].value.textContent = REELS[key][i].label;
    const n = tallies[key][i];
    reelEls[key].tally.textContent = n ? `in ${plural(n, "real movie", "real movies")}` : "no real movies (yet)";
  }

  function animateReel(key, finalIndex, duration) {
    const r = reelEls[key];
    return new Promise((resolve) => {
      if (reduceMotion) { showFinal(key, finalIndex); return resolve(); }
      r.el.classList.remove("landed");
      r.el.classList.add("spinning");
      r.tally.innerHTML = "&nbsp;";
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        if (elapsed >= duration) {
          r.el.classList.remove("spinning");
          showFinal(key, finalIndex);
          void r.el.offsetWidth;
          r.el.classList.add("landed");
          return resolve();
        }
        r.value.textContent = REELS[key][Math.floor(Math.random() * REELS[key].length)].label;
        setTimeout(tick, 50 + (elapsed / duration) ** 2 * 220);
      };
      tick();
    });
  }

  let state = null;
  let pitchTimers = [];
  const isLocked = (k) => !!state && reelEls[k].el.classList.contains("locked");

  function chooseNext() {
    const next = { seed: newSeed() };
    // Sometimes steer onto a real movie (respecting locked reels) so jackpots actually happen.
    if (Math.random() < JACKPOT_RATE) {
      const pool = complete.filter((m) => KEYS.every((k) => !isLocked(k) || m.idx[k] === state[k]));
      if (pool.length) {
        const m = pool[Math.floor(Math.random() * pool.length)];
        KEYS.forEach((k) => (next[k] = m.idx[k]));
        return next;
      }
    }
    KEYS.forEach((k) => (next[k] = isLocked(k) ? state[k] : Math.floor(Math.random() * REELS[k].length)));
    return next;
  }

  // Show the proposal. The verdict stays hidden until it is pitched, unless `revealed`.
  function show(s, revealed) {
    state = s;
    pitchTimers.forEach(clearTimeout);
    pitchTimers = [];
    const pitch = buildPitch(s);
    $("proposal-no").textContent = `Proposal no. ${pitch.number}`;
    $("title").textContent = pitch.title;
    $("tagline").textContent = pitch.tagline;
    $("synopsis").textContent = pitch.synopsis;
    $("cast").textContent = pitch.cast.length === 2
      ? `Projected cast, based on who has played these parts most often: ${pitch.cast[0][0]} and ${pitch.cast[1][0]}.`
      : "";
    const beats = $("beats");
    beats.innerHTML = "";
    pitch.beats.forEach((b) => {
      const li = el("li");
      li.append(el("span", "beat-min", `Minute ${b.min}`), el("span", "beat-text", b.text));
      beats.append(li);
    });
    renderVerdict(s, pitch);
    $("verdict").hidden = !revealed;
    $("pitch").hidden = !!revealed;
    $("pitch").disabled = false;
    $("pitch-status").innerHTML = "&nbsp;";
    $("result").hidden = false;
    history.replaceState(null, "", "#" + encodeState(s));
    spinBtn.textContent = "Spin Again ✨";
  }

  const spinBtn = $("spin");
  spinBtn.addEventListener("click", async () => {
    spinBtn.disabled = true;
    const next = chooseNext();
    await Promise.all(KEYS.filter((k) => !isLocked(k)).map((k, i) => animateReel(k, next[k], 1200 + i * 550)));
    show(next, false);
    scrollTo($("result"));
    spinBtn.disabled = false;
  });

  // The pause before the verdict is the joke. Do not shorten it.
  $("pitch").addEventListener("click", () => {
    const btn = $("pitch"), status = $("pitch-status");
    const reveal = () => {
      btn.hidden = true;
      status.innerHTML = "&nbsp;";
      $("verdict").hidden = false;
      scrollTo($("verdict"));
    };
    if (reduceMotion) return reveal();
    btn.disabled = true;
    const lines = ["Calling the network…", "They are checking the vault…", "Someone is laughing…"];
    lines.forEach((line, i) => pitchTimers.push(setTimeout(() => (status.textContent = line), i * 750)));
    pitchTimers.push(setTimeout(reveal, lines.length * 750));
  });

  // ---------- share links: #herId-placeId-himId-seed ----------
  const encodeState = (s) => [HER[s.her].id, PLACE[s.place].id, HIM[s.him].id, s.seed.toString(36)].join("-");
  function decodeState(hash) {
    const p = hash.replace(/^#/, "").split("-");
    if (p.length !== 4) return null;
    const s = { her: indexOf.her[p[0]], place: indexOf.place[p[1]], him: indexOf.him[p[2]], seed: parseInt(p[3], 36) };
    return KEYS.every((k) => s[k] !== undefined) && Number.isFinite(s.seed) ? s : null;
  }
  $("share").addEventListener("click", async () => {
    const btn = $("share");
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = "Copied. Send it to your mom 💌";
    } catch {
      btn.textContent = "Couldn't copy. Use your browser's share button instead.";
    }
    setTimeout(() => (btn.textContent = "Copy link to this finding"), 2500);
  });

  // ---------- Which Hallmark movie is your life? ----------
  const option = (value, label) => { const o = el("option", null, label); o.value = value; return o; };
  LIFE_JOBS.forEach((j, i) => {
    $("life-job").append(option(i, j.label));
    $("life-partner").append(option(i, j.label));
  });
  $("life-partner").append(option("none", "No partner at the moment"));
  PLACE.forEach((p, i) => $("life-place").append(option(i, p.life)));
  $("life-place").value = String(indexOf.place.city);

  $("life-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const me = LIFE_JOBS[$("life-job").value];
    const partnerValue = $("life-partner").value;
    const partner = partnerValue === "none" ? null : LIFE_JOBS[partnerValue];
    const place = Number($("life-place").value);
    // Try the user as the heroine and as the hero; keep whichever fits a real movie better.
    const tries = [
      { mine: "her", s: { her: indexOf.her[me.her], place, him: partner ? indexOf.him[partner.him] : -2 } },
      { mine: "him", s: { him: indexOf.him[me.him], place, her: partner ? indexOf.her[partner.her] : -2 } },
    ].map((t) => ({ ...t, tiers: findMatches(t.s) }));
    const level = (t) => (t.tiers[3].length ? 3 : t.tiers[2].length ? 2 : t.tiers[1].length ? 1 : 0);
    const best = tries.sort((a, b) => level(b) - level(a) || b.tiers[2].length - a.tiers[2].length)[0];
    const lvl = level(best);
    const head = $("life-head"), sub = $("life-sub"), list = $("life-matches");
    list.innerHTML = "";
    const theirs = best.mine === "her" ? "him" : "her";
    const lifeNote = (m, hits) => {
      if (hits.length === 3) return null;
      const missing = KEYS.filter((k) => !hits.includes(k));
      if (missing.length > 1) return null;
      const k = missing[0];
      if (m.idx[k] < 0) return "A match on everything we could confirm.";
      const job = k === "her" ? m.hj : m.ij;
      if (k === "place") return m.loc ? `You would need to move here: ${noParens(m.loc)}.` : "You would need to move.";
      if (k === best.mine) return `You would need to become ${withArticle(lowerFirst(job))}.`;
      return partner
        ? `Your partner would need to become ${withArticle(lowerFirst(job))}.`
        : `Still to arrive: ${withArticle(lowerFirst(job))}.`;
    };
    const showCards = (items, n) => items.slice(0, n).forEach(({ m, hits }) => list.append(movieCard(m, lifeNote(m, hits))));

    if (lvl === 3) {
      const m = best.tiers[3][0].m;
      head.textContent = "Your life is a real Hallmark movie.";
      sub.textContent = `It aired in ${m.y} under the title “${m.t}.” You were not consulted.`;
      showCards(best.tiers[3], 3);
    } else if (lvl === 2 && !partner) {
      head.textContent = "You are living the first eight minutes of a real Hallmark movie.";
      sub.textContent = "Everything matches so far. According to our files, he arrives in minute nine.";
      showCards(best.tiers[2], 3);
    } else if (lvl === 2) {
      // Films whose third detail we could not confirm go first: they may be exact matches.
      const missingOf = (x) => KEYS.find((k) => !x.hits.includes(k));
      const items = best.tiers[2].slice().sort((a, b) => (a.m.idx[missingOf(a)] < 0 ? 0 : 1) - (b.m.idx[missingOf(b)] < 0 ? 0 : 1));
      const missing = missingOf(items[0]);
      if (items[0].m.idx[missing] < 0) {
        head.textContent = "Your life may already be a Hallmark movie.";
        sub.textContent = "Two of your three answers match, and we could not confirm the third. The Institute is looking into it.";
      } else {
        head.textContent = missing === "place"
          ? "You are one move away from a real Hallmark movie."
          : missing === theirs
            ? "Your partner is one career change away from a real Hallmark movie."
            : "You are one career change away from a real Hallmark movie.";
        sub.textContent = `${plural(items.length, "film matches", "films match")} two of your three answers.`;
      }
      showCards(items, 3);
    } else if (lvl === 1) {
      head.textContent = "You are two life decisions away from a real Hallmark movie.";
      sub.textContent = "The Institute suggests starting with whichever is cheaper.";
      showCards(best.tiers[1], 2);
    } else {
      head.textContent = "Your life has not been filmed.";
      sub.textContent = "The Institute recommends moving to a small town and waiting.";
    }
    $("life-result").hidden = false;
  });

  // ---------- Real or Fake? ----------
  function fakeTitle() {
    for (let i = 0; i < 50; i++) {
      const t = fill(pick(Math.random, FAKE_TEMPLATES), {
        adj: pick(Math.random, FAKE_ADJ), thing: pick(Math.random, FAKE_THING), place: pick(Math.random, FAKE_PLACE),
      });
      if (!realTitles.has(t.toLowerCase())) return t;
    }
    return "A Very Algorithmic Christmas";
  }
  const fakePlot = () =>
    `${pick(Math.random, FAKE_PLOT_HER)} ${fill(pick(Math.random, FAKE_PLOT_GOES), { biz: pick(Math.random, FAKE_PLOT_BIZ) })} ${pick(Math.random, FAKE_PLOT_HIM)}.`;
  const withPlots = MOVIES.filter((m) => m.s);
  const game = { mode: "plots", real: null, fake: null, done: false, streak: 0, best: 0 };
  try { game.best = Number(localStorage.getItem("hmg-best")) || 0; } catch {}
  const choiceEls = [$("choice-a"), $("choice-b")];

  function newRound() {
    const plots = game.mode === "plots";
    game.real = pick(Math.random, plots ? withPlots : MOVIES);
    game.fake = plots ? fakePlot() : fakeTitle();
    game.done = false;
    const realFirst = Math.random() < 0.5;
    choiceEls.forEach((b, i) => {
      const isReal = (i === 0) === realFirst;
      b.textContent = isReal ? (plots ? game.real.s : game.real.t) : game.fake;
      b.dataset.real = String(isReal);
      b.className = plots ? "choice plot" : "choice";
      b.disabled = false;
    });
    $("game-sub").textContent = plots
      ? "One of these is the plot of a real Hallmark Christmas movie. We wrote the other one thirty seconds ago."
      : "One of these is the title of a real Hallmark Christmas movie. We made the other one up thirty seconds ago.";
    $("game-msg").innerHTML = "&nbsp;";
    $("game-next").hidden = true;
    $("best").textContent = game.best;
  }
  choiceEls.forEach((b) => b.addEventListener("click", () => {
    if (game.done) return;
    game.done = true;
    const right = b.dataset.real === "true";
    choiceEls.forEach((c) => { c.disabled = true; c.classList.add(c.dataset.real === "true" ? "is-real" : "is-fake"); });
    const m = game.real;
    const stars = [m.ha, m.ia].filter(Boolean).join(" and ");
    const credit = `“${m.t}” (${m.y}${stars ? `, with ${stars}` : ""})`;
    $("game-msg").textContent = (right ? "Correct. " : "Incorrect. ") + (game.mode === "plots"
      ? `The real one is ${credit}. The other one is ours. For now.`
      : `${credit} is real. “${game.fake}” is ours. For now.`);
    game.streak = right ? game.streak + 1 : 0;
    if (game.streak > game.best) {
      game.best = game.streak;
      try { localStorage.setItem("hmg-best", String(game.best)); } catch {}
    }
    $("streak").textContent = game.streak;
    $("best").textContent = game.best;
    $("game-next").hidden = false;
  }));
  $("game-next").addEventListener("click", newRound);
  [["plots", $("mode-plots")], ["titles", $("mode-titles")]].forEach(([mode, btn]) =>
    btn.addEventListener("click", () => {
      game.mode = mode;
      $("mode-plots").setAttribute("aria-pressed", String(mode === "plots"));
      $("mode-titles").setAttribute("aria-pressed", String(mode === "titles"));
      newRound();
    }));

  // ---------- findings ----------
  function bars(target, rows) {
    const max = Math.max(...rows.map((r) => r[1]), 1);
    rows.forEach(([label, n]) => {
      const li = el("li");
      const bar = el("span", "bar");
      bar.style.width = `${(n / max) * 100}%`;
      li.append(el("span", "bar-label", label), el("span", "bar-n", String(n)), bar);
      target.append(li);
    });
  }

  function renderFacts() {
    const N = MOVIES.length;
    const facts = [];
    const stop = new Set("a the of for in to at and on my with me you our it is all".split(" "));
    const words = tally(MOVIES.flatMap((m) => [...new Set(m.t.toLowerCase().match(/[a-z']+/g) || [])].filter((w) => !stop.has(w))));
    const ranked = top(words, 4);
    const cap = (w) => w[0].toUpperCase() + w.slice(1);
    if (ranked.length > 3 && ranked[0][0] === "christmas") {
      facts.push(`${ranked[0][1]} of ${N} titles contain the word “Christmas.” The runner-up is “${cap(ranked[1][0])},” with ${ranked[1][1]}.`);
      facts.push(`Assembled from the most common title words, the statistically average film is called “A ${cap(ranked[1][0])} ${cap(ranked[2][0])} Christmas.” It has not been made. We checked.`);
    }
    const inAt = MOVIES.filter((m) => /^(a )?christmas (in|at) /i.test(m.t)).length;
    if (inAt) facts.push(`${inAt} titles are simply “Christmas in” or “Christmas at” followed by a place.`);

    const combos = new Set(complete.map((m) => KEYS.map((k) => m.idx[k]).join(",")));
    const total = HER.length * PLACE.length * HIM.length;
    const years = complete.map((m) => m.y);
    const span = Math.max(...years) - Math.min(...years) + 1;
    const doneBy = Math.max(...years) + Math.ceil((total - combos.size) / (combos.size / span));
    facts.push(`The films we have fully documented cover ${combos.size} of the ${total.toLocaleString()} possible combinations of heroine, setting and love interest. At the current rate, the set will be complete in the year ${doneBy}.`);

    const pronouns = MOVIES.map((m) => (m.t.match(/^Time for (\w+) to Come Home for Christmas$/) || [])[1]).filter(Boolean);
    if (pronouns.length > 2) {
      facts.push(`One series is titled “Time for ___ to Come Home for Christmas.” Pronouns used so far, per our files: ${pronouns.join(", ")}. Awaiting: It, Y'all, Thou.`);
    }
    const dads = tallies.him[indexOf.him.dad];
    if (dads) facts.push(`In ${dads} films, the only occupation we could confirm for the male lead is “father.”`);
    const noJob = MOVIES.filter((m) => m.idx.her >= 0 && m.idx.him < 0).length;
    if (noJob) facts.push(`In ${noJob} films we could confirm what she does for a living but not what he does. The synopses do not appear to think it matters.`);
    facts.forEach((f) => $("facts").append(el("li", null, f)));
  }

  function renderStats() {
    const years = MOVIES.map((m) => m.y);
    const span = `${Math.min(...years)}–${Math.max(...years)}`;
    $("count").textContent = `${MOVIES.length} real Hallmark Christmas movies on file, ${span}`;
    $("stats-sub").textContent =
      `Methodology: we read the synopses of ${MOVIES.length} real movies (${span}). We are fine. Full details are confirmed for ${complete.length} so far.`;
    renderFacts();
    KEYS.forEach((k) => {
      const rows = REELS[k].map((b, i) => [b.label, tallies[k][i]]).sort((a, b) => b[1] - a[1]).slice(0, 6);
      bars($(`stat-${k}`), rows);
    });
    bars($("stat-tropes"), top(tally(MOVIES.flatMap((m) => m.tr || []).filter((t) => TROPE_LABELS[t])), 6)
      .map(([t, n]) => [TROPE_LABELS[t], n]));
    bars($("stat-actress"), top(tally(MOVIES.map((m) => m.ha).filter(Boolean)), 6));
    bars($("stat-actor"), top(tally(MOVIES.map((m) => m.ia).filter(Boolean)), 6));

    const combos = {};
    complete.filter((m) => KEYS.every((k) => m[k] !== "other")).forEach((m) => {
      const key = KEYS.map((k) => m.idx[k]).join(",");
      (combos[key] = combos[key] || []).push(m);
    });
    const best = Object.entries(combos).sort((a, b) => b[1].length - a[1].length)[0];
    if (best && best[1].length > 1) {
      const [h, p, i] = best[0].split(",").map(Number);
      const line = $("stat-combo");
      line.append(
        el("b", null, "The most Hallmark movie of all: "),
        `${HER[h].label} + ${PLACE[p].label} + ${HIM[i].label}. They have made it ${best[1].length} times. `
      );
      const btn = el("button", "ghost small", "Show me");
      btn.type = "button";
      btn.addEventListener("click", () => {
        const s = { her: h, place: p, him: i, seed: newSeed() };
        KEYS.forEach((k) => showFinal(k, s[k]));
        show(s, true);
        scrollTo($("result"));
      });
      line.append(btn);
    }
  }

  // Exhibit A: real jobs.
  const exhibits = HALL_OF_FAME.map(([title, who]) => {
    const m = byTitle.get(title);
    const job = m && (who === "her" ? m.hj : m.ij);
    return job ? { job: noParens(job), m, who } : null;
  }).filter(Boolean);
  let exhibitAt = Math.floor(Math.random() * Math.max(exhibits.length, 1));
  function showExhibit() {
    if (!exhibits.length) return;
    const x = exhibits[exhibitAt % exhibits.length];
    $("exhibit-job").textContent = `“${x.job}”`;
    $("exhibit-src").textContent = `${x.who === "her" ? "Her" : "His"} job in ${x.m.t} (${x.m.y})`;
  }
  $("exhibit-next").addEventListener("click", () => { exhibitAt++; showExhibit(); });

  // ---------- browse everything ----------
  const sorted = MOVIES.slice().sort((a, b) => b.y - a.y || a.t.localeCompare(b.t));
  const haystack = new Map(sorted.map((m) => [m, [m.t, m.y, m.ha, m.ia, m.hj, m.ij, m.loc, m.s].join(" ").toLowerCase()]));
  function renderBrowse() {
    const q = $("filter").value.trim().toLowerCase();
    const hits = q ? sorted.filter((m) => haystack.get(m).includes(q)) : sorted;
    const list = $("all-movies");
    list.innerHTML = "";
    hits.slice(0, 60).forEach((m) => list.append(movieCard(m)));
    $("filter-count").textContent = hits.length > 60
      ? `Showing 60 of ${hits.length}. Search to narrow it down.`
      : plural(hits.length, "movie", "movies");
  }
  $("filter").addEventListener("input", renderBrowse);
  $("browse-h").textContent = `The full filmography (${MOVIES.length} movies)`;

  // ---------- decoration ----------
  const lights = document.querySelector(".lights");
  const colors = ["#d7263d", "#f2c14e", "#2e8b57", "#1b98e0", "#f46036"];
  for (let i = 0; i < 30; i++) {
    const li = el("li");
    li.style.background = colors[i % colors.length];
    li.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
    li.style.animationDelay = `${(i % 5) * 0.4}s`;
    lights.appendChild(li);
  }
  if (!reduceMotion) {
    const snow = document.querySelector(".snow");
    for (let i = 0; i < 40; i++) {
      const f = el("span", "flake", "❄");
      f.style.left = `${Math.random() * 100}%`;
      f.style.fontSize = `${8 + Math.random() * 14}px`;
      f.style.opacity = String(0.4 + Math.random() * 0.5);
      f.style.animationDuration = `${8 + Math.random() * 12}s`;
      f.style.animationDelay = `${-Math.random() * 20}s`;
      snow.appendChild(f);
    }
  }

  // ---------- go ----------
  renderStats();
  showExhibit();
  renderBrowse();
  newRound();
  const shared = decodeState(location.hash);
  if (shared) {
    KEYS.forEach((k) => showFinal(k, shared[k]));
    show(shared, true); // a shared link shows the punchline straight away
  }
})();
