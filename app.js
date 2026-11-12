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
  const withArticle = (s) =>
    /^(a|an|the|his|her|one|two|former|\S+'s)\s/i.test(s) ? s : `${/^[aeiou]/i.test(s) ? "an" : "a"} ${s}`;
  // "Hotel executive" -> "hotel executive", but leave "New York planner" and "TV host" alone
  const lowerFirst = (raw, s = raw.replace(/\s*\([^)]*\)/g, "")) =>
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

  function findMatches(state) {
    const tiers = { 3: [], 2: [], 1: [] };
    MOVIES.forEach((m) => {
      const hits = KEYS.filter((k) => m.idx[k] === state[k]);
      if (hits.length) tiers[hits.length].push({ m, hits });
    });
    return tiers;
  }

  // ---------- the parody pitch ----------
  function buildPitch(state) {
    const her = HER[state.her], place = PLACE[state.place], him = HIM[state.him];
    const rand = mulberry32(state.seed);
    const herName = pick(rand, HEROINE_NAMES), hisName = pick(rand, HERO_NAMES);
    const spot = pick(rand, place.spots);
    const vars = {
      town: spot.n.replace(/^the /, ""),
      landmark: pick(rand, LANDMARKS),
      event: pick(rand, EVENTS),
      herPun: pick(rand, her.puns),
      heroPun: pick(rand, him.puns),
      hero: hisName,
      secret: him.secret,
      rival: pick(rand, RIVALS),
    };
    let title;
    for (let i = 0; i < 20; i++) {
      title = fill(pick(rand, TITLE_TEMPLATES), vars);
      const clash = vars.herPun === vars.heroPun && title.split(vars.herPun).length > 2;
      if (!clash && !realTitles.has(title.toLowerCase())) break;
    }
    const synopsis =
      `${herName} is ${her.a} who ${her.goal}. But when ${pick(rand, INCITING)}, she finds herself ` +
      `${spot.at}, with nothing but ${her.thing}. There she meets ${hisName}, ${him.a} who ${him.trait}. ` +
      `They clash. They bake. They are somehow put in charge of ${vars.event}. ` +
      `And just when everything seems lost, ${fill(pick(rand, CLIMAXES), vars)}.`;
    const taglines = [
      `This Christmas, she came for business. She stayed for ${hisName}.`,
      `Some things can't be planned. Like falling for ${him.a}.`,
      `She had a five-year plan. ${hisName} had a truck.`,
      `Home is where the ${vars.herPun.toLowerCase()} is.`,
      `${vars.event.replace(/^the /, "The ")} will never be the same.`,
      `Love is the best gift of all. (So is ${her.thing}.)`,
    ];
    return { title, tagline: pick(rand, taglines), synopsis };
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
    if (m.idx[missing] < 0) return "Two for two. We couldn't confirm the third detail, so this may secretly be a jackpot.";
    return {
      her: `Same movie, except she's ${withArticle(lowerFirst(m.hj))}.`,
      place: `Same movie, except it happens here: ${m.loc}.`,
      him: `Same movie, except he's ${withArticle(lowerFirst(m.ij))}.`,
    }[missing];
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
      head.textContent = n === 1 ? "Jackpot. This is a real movie." : `Jackpot. Hallmark has made this movie ${n} times.`;
      sub.textContent = n === 1
        ? `You called it “${pitch.title}.” They called it “${shown[0].m.t}.”`
        : `You called it “${pitch.title}.” They called it, among other things:`;
      shown.forEach(({ m }) => list.append(movieCard(m)));
      if (n > shown.length) list.append(el("li", "more", `…and ${n - shown.length} more. Spin again to meet them.`));
    } else if (tiers[2].length) {
      level = 2;
      const n = tiers[2].length;
      shown = shuffle(tiers[2]).slice(0, 3);
      head.textContent = "So close.";
      sub.textContent = `No exact match, but ${plural(n, "real movie is", "real movies are")} one detail away from “${pitch.title}.”`;
      shown.forEach(({ m, hits }) => list.append(movieCard(m, diffNote(m, KEYS.find((k) => !hits.includes(k))))));
    } else {
      level = tiers[1].length ? 1 : 0;
      shown = shuffle(tiers[1]).slice(0, 2);
      head.textContent = "Somehow, this one doesn't exist yet.";
      sub.textContent = `“${pitch.title}” is all yours. Hallmark, our inbox is open.` +
        (shown.length ? " The closest they've come:" : "");
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
  const isLocked = (k) => !!state && reelEls[k].el.classList.contains("locked");

  function chooseNext() {
    const next = { seed: Math.floor(Math.random() * 1e9) };
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

  function render(s) {
    const pitch = buildPitch(s);
    $("title").textContent = pitch.title;
    $("tagline").textContent = pitch.tagline;
    $("synopsis").textContent = pitch.synopsis;
    renderVerdict(s, pitch);
    $("result").hidden = false;
  }
  function show(s) {
    state = s;
    render(s);
    history.replaceState(null, "", "#" + encodeState(s));
    $("result").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    spinBtn.textContent = "Spin Again ✨";
  }

  const spinBtn = $("spin");
  spinBtn.addEventListener("click", async () => {
    spinBtn.disabled = true;
    const next = chooseNext();
    await Promise.all(KEYS.filter((k) => !isLocked(k)).map((k, i) => animateReel(k, next[k], 1200 + i * 550)));
    show(next);
    spinBtn.disabled = false;
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
      btn.textContent = "Copied! Send it to your mom 💌";
    } catch {
      btn.textContent = "Couldn't copy. Use your browser's share button instead.";
    }
    setTimeout(() => (btn.textContent = "Copy link to this spin"), 2500);
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
  const game = { real: null, fake: null, done: false, streak: 0, best: 0 };
  try { game.best = Number(localStorage.getItem("hmg-best")) || 0; } catch {}
  const choiceEls = [$("choice-a"), $("choice-b")];

  function newRound() {
    game.real = MOVIES[Math.floor(Math.random() * MOVIES.length)];
    game.fake = fakeTitle();
    game.done = false;
    const realFirst = Math.random() < 0.5;
    choiceEls.forEach((b, i) => {
      const isReal = (i === 0) === realFirst;
      b.textContent = isReal ? game.real.t : game.fake;
      b.dataset.real = String(isReal);
      b.className = "choice";
      b.disabled = false;
    });
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
    $("game-msg").textContent = (right ? "Correct! " : "Nope. ") +
      `“${m.t}” is real (${m.y}${stars ? `, with ${stars}` : ""}). “${game.fake}” is ours. For now.`;
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

  // ---------- stats ----------
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
  function renderStats() {
    const years = MOVIES.map((m) => m.y);
    const span = `${Math.min(...years)}–${Math.max(...years)}`;
    $("count").textContent = `${MOVIES.length} real Hallmark Christmas movies on file, ${span}`;
    $("stats-sub").textContent =
      `${MOVIES.length} real movies, ${span}. Full details are confirmed for ${complete.length} so far; the rest are still being researched.`;
    KEYS.forEach((k) => {
      const rows = REELS[k].map((b, i) => [b.label, tallies[k][i]]).sort((a, b) => b[1] - a[1]).slice(0, 6);
      bars($(`stat-${k}`), rows);
    });
    const counts = {};
    MOVIES.forEach((m) => (m.tr || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    bars($("stat-tropes"), Object.entries(counts).filter(([t]) => TROPE_LABELS[t])
      .map(([t, n]) => [TROPE_LABELS[t], n]).sort((a, b) => b[1] - a[1]).slice(0, 6));

    const combos = {};
    complete.filter((m) => KEYS.every((k) => m[k] !== "other")).forEach((m) => {
      const key = KEYS.map((k) => m.idx[k]).join(",");
      (combos[key] = combos[key] || []).push(m);
    });
    const top = Object.entries(combos).sort((a, b) => b[1].length - a[1].length)[0];
    if (top && top[1].length > 1) {
      const [h, p, i] = top[0].split(",").map(Number);
      const line = $("stat-combo");
      line.append(
        el("b", null, "The most Hallmark movie of all: "),
        `${HER[h].label} + ${PLACE[p].label} + ${HIM[i].label}. They have made it ${top[1].length} times. `
      );
      const btn = el("button", "ghost small", "Show me");
      btn.type = "button";
      btn.addEventListener("click", () => {
        const s = { her: h, place: p, him: i, seed: Math.floor(Math.random() * 1e9) };
        KEYS.forEach((k) => showFinal(k, s[k]));
        show(s);
      });
      line.append(btn);
    }
  }

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
  renderBrowse();
  newRound();
  const shared = decodeState(location.hash);
  if (shared) {
    state = shared;
    KEYS.forEach((k) => showFinal(k, state[k]));
    render(state);
    spinBtn.textContent = "Spin Again ✨";
  }
})();
