(() => {
  const REELS = {
    heroine: HEROINES,
    location: LOCATIONS,
    hero: HEROES,
  };

  // ---------- seeded randomness, so a movie can be shared by URL ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rand, list) => list[Math.floor(rand() * list.length)];
  const randIndex = (list) => Math.floor(Math.random() * list.length);
  function sample(rand, list, n) {
    const copy = list.slice();
    const out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    return out;
  }
  // lowercase a job title for mid-sentence use, but keep acronyms like TV / CEO
  const lower = (s) => s.split(" ").map((w) => (/^[A-Z&]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");
  const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

  // ---------- the movie itself ----------
  function buildMovie(state) {
    const her = HEROINES[state.heroine];
    const place = LOCATIONS[state.location];
    const him = HEROES[state.hero];
    const rand = mulberry32(state.seed);

    const herName = pick(rand, HEROINE_NAMES);
    const hisName = pick(rand, HERO_NAMES);
    const vars = {
      town: place.town,
      landmark: place.landmark,
      herPun: pick(rand, her.puns),
      heroPun: pick(rand, him.puns),
      heroLabel: him.label.replace(/^(Single-Dad|Widowed|Small-Town|Handsome) /, ""),
      hero: hisName,
      secret: him.secret,
      rival: pick(rand, RIVALS),
    };

    // avoid "Sweet & Sweet" style titles when both puns collide
    let title;
    for (let i = 0; i < 10; i++) {
      title = fill(pick(rand, TITLE_TEMPLATES), vars);
      if (vars.herPun !== vars.heroPun || !title.includes(vars.herPun + " & ")) break;
    }

    const city = pick(rand, CITIES);
    const inciting = pick(rand, INCITING);
    const climax = fill(pick(rand, CLIMAXES), vars);
    const article = /^[AEIOU]/i.test(her.label) ? "an" : "a";
    const himArticle = /^[AEIOU]/i.test(him.label) ? "an" : "a";

    const synopsis =
      `${herName}, ${article} ${lower(her.label)} from ${city}, ${her.goal}. ` +
      `But when ${inciting}, she ends up in ${/^(A|Her) /.test(place.label) ? lower(place.label) : place.label} ` +
      `with nothing but ${her.thing}. There she meets ${hisName}, ${himArticle} ${lower(him.label)} who ${him.trait}. ` +
      `They clash. They bake. They are somehow put in charge of ${place.event}. ` +
      `And just when everything seems lost, ${climax}.`;

    const taglines = [
      `This Christmas, she came for business. She stayed for ${hisName}.`,
      `Some things can't be planned. Some things are ${vars.heroPun.toLowerCase()}.`,
      `She had a five-year plan. ${place.town} had other ideas.`,
      `Home is where the ${vars.herPun.toLowerCase()} is.`,
      `${place.event.replace(/^the /, "The ")} will never be the same.`,
      `Love is the best gift of all. (So is ${her.thing}.)`,
    ];

    return {
      title,
      tagline: pick(rand, taglines),
      synopsis,
      cast: `${herName} & ${hisName}`,
      cozy: 3 + Math.floor(rand() * 3),
      tropes: sample(rand, TROPES, 6),
    };
  }

  // ---------- DOM ----------
  const els = {
    spin: document.getElementById("spin"),
    result: document.getElementById("result"),
    title: document.getElementById("title"),
    tagline: document.getElementById("tagline"),
    synopsis: document.getElementById("synopsis"),
    cast: document.getElementById("cast"),
    cozy: document.getElementById("cozy"),
    tropes: document.getElementById("tropes"),
    share: document.getElementById("share"),
  };
  const reelEls = {};
  document.querySelectorAll(".reel").forEach((el) => {
    const key = el.dataset.key;
    reelEls[key] = { el, value: el.querySelector(".value"), lock: el.querySelector(".lock") };
    reelEls[key].lock.addEventListener("click", () => {
      const locked = el.classList.toggle("locked");
      reelEls[key].lock.setAttribute("aria-pressed", String(locked));
      reelEls[key].lock.textContent = locked ? "🔒 Locked" : "🔓 Lock";
    });
  });

  let state = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render(movie) {
    els.title.textContent = movie.title;
    els.tagline.textContent = movie.tagline;
    els.synopsis.textContent = movie.synopsis;
    els.cast.textContent = movie.cast;
    els.cozy.textContent = "❄".repeat(movie.cozy) + "·".repeat(5 - movie.cozy);
    els.cozy.setAttribute("aria-label", `${movie.cozy} out of 5 snowflakes`);
    els.tropes.innerHTML = "";
    movie.tropes.forEach((t) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = t;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")));
      li.appendChild(b);
      els.tropes.appendChild(li);
    });
    els.result.hidden = false;
  }

  function showFinal(key, index) {
    reelEls[key].value.textContent = REELS[key][index].label;
  }

  function animateReel(key, finalIndex, duration) {
    const r = reelEls[key];
    return new Promise((resolve) => {
      if (reduceMotion) { showFinal(key, finalIndex); return resolve(); }
      r.el.classList.remove("landed");
      r.el.classList.add("spinning");
      const start = performance.now();
      let delay = 50;
      const tick = () => {
        const elapsed = performance.now() - start;
        if (elapsed >= duration) {
          r.el.classList.remove("spinning");
          showFinal(key, finalIndex);
          void r.el.offsetWidth; // restart the thunk animation
          r.el.classList.add("landed");
          return resolve();
        }
        r.value.textContent = REELS[key][randIndex(REELS[key])].label;
        delay = 50 + (elapsed / duration) ** 2 * 220; // slow down near the end
        setTimeout(tick, delay);
      };
      tick();
    });
  }

  async function spin() {
    els.spin.disabled = true;
    const next = { seed: Math.floor(Math.random() * 1e9) };
    const jobs = [];
    Object.keys(REELS).forEach((key, i) => {
      const locked = reelEls[key].el.classList.contains("locked") && state;
      next[key] = locked ? state[key] : randIndex(REELS[key]);
      if (!locked) jobs.push(animateReel(key, next[key], 1200 + i * 550));
    });
    await Promise.all(jobs);
    state = next;
    render(buildMovie(state));
    history.replaceState(null, "", "#" + encodeState(state));
    els.result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    els.spin.disabled = false;
    els.spin.textContent = "Spin Again ✨";
  }

  // ---------- share links: #heroine-location-hero-seed ----------
  const encodeState = (s) => [s.heroine, s.location, s.hero, s.seed.toString(36)].join("-");
  function decodeState(hash) {
    const parts = hash.replace(/^#/, "").split("-");
    if (parts.length !== 4) return null;
    const [h, l, m] = parts.slice(0, 3).map(Number);
    const seed = parseInt(parts[3], 36);
    const ok = (n, list) => Number.isInteger(n) && n >= 0 && n < list.length;
    if (!ok(h, HEROINES) || !ok(l, LOCATIONS) || !ok(m, HEROES) || !Number.isFinite(seed)) return null;
    return { heroine: h, location: l, hero: m, seed };
  }

  els.share.addEventListener("click", async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      els.share.textContent = "Copied! Send it to your mom 💌";
    } catch {
      window.prompt("Copy this link:", url);
    }
    setTimeout(() => (els.share.textContent = "Copy link to this movie"), 2500);
  });

  els.spin.addEventListener("click", spin);

  // ---------- decoration ----------
  const lights = document.querySelector(".lights");
  const colors = ["#d7263d", "#f2c14e", "#2e8b57", "#1b98e0", "#f46036"];
  for (let i = 0; i < 30; i++) {
    const li = document.createElement("li");
    li.style.background = colors[i % colors.length];
    li.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
    li.style.animationDelay = `${(i % 5) * 0.4}s`;
    lights.appendChild(li);
  }
  if (!reduceMotion) {
    const snow = document.querySelector(".snow");
    for (let i = 0; i < 40; i++) {
      const f = document.createElement("span");
      f.className = "flake";
      f.textContent = "❄";
      f.style.left = `${Math.random() * 100}%`;
      f.style.fontSize = `${8 + Math.random() * 14}px`;
      f.style.opacity = String(0.4 + Math.random() * 0.5);
      f.style.animationDuration = `${8 + Math.random() * 12}s`;
      f.style.animationDelay = `${-Math.random() * 20}s`;
      snow.appendChild(f);
    }
  }

  // load a shared movie if the URL has one
  const shared = decodeState(location.hash);
  if (shared) {
    state = shared;
    Object.keys(REELS).forEach((key) => showFinal(key, state[key]));
    render(buildMovie(state));
    els.spin.textContent = "Spin Again ✨";
  }
})();
