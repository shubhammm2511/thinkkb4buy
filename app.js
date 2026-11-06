(function () {
  "use strict";
  const { SOURCES, DIMS, HUBS, LOCALITIES, DEVELOPERS, PROJECTS, MONTHS, DATA_DATE } = window.TB;
  let $app = document.getElementById("app");

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => LOCALITIES.find((l) => l.id === id);
  const dimById = (id) => DIMS.find((d) => d.id === id);
  const devById = (id) => DEVELOPERS.find((d) => d.id === id);
  const projById = (id) => PROJECTS.find((p) => p.id === id);
  const hubById = (id) => HUBS.find((h) => h.id === id) || HUBS[0];
  const store = {
    get(k, d) { try { const v = localStorage.getItem("tb4b3." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("tb4b3." + k, JSON.stringify(v)); } catch (e) { /* storage unavailable: app still works */ } },
  };
  function inr(n) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(n >= 1e6 ? 0 : 1).replace(/\.0$/, "") + " L";
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }
  const num = (n) => Math.round(n).toLocaleString("en-IN");
  const r0 = (n) => Math.round(n);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const srcChip = (id) => `<a class="src" href="#method" title="${esc(SOURCES[id].name)}">${id}</a>`;
  const initials = (name) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  const svg = (paths) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const IC = {
    mark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    warn: svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>'),
    cols: svg('<path d="M4 5h6v14H4zM14 5h6v14h-6z"/>'),
    office: svg('<path d="M4 21V6l8-3v18M12 9h8v12M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2M2 21h20"/>'),
    plane: svg('<path d="M3 13l18-7-5 14-3-6z"/><path d="M13 14l3-3"/>'),
    family: svg('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20c0-4 2.2-6.5 5-6.5s5 2.5 5 6.5M13.5 20c0-3 1.5-5 3.5-5s3.5 2 3.5 5"/>'),
    heart: svg('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
    laptop: svg('<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>'),
    chart: svg('<path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7"/>'),
    calc: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>'),
    wallet: svg('<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4z"/><path d="M4 7l11-3v3M16 13.5h.01"/>'),
    receipt: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
    list: svg('<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
  };
  const DIM_IC = {
    schools: svg('<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>'),
    air: svg('<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>'),
    water: svg('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),
    power: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
    safety: svg('<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>'),
    infra: svg('<path d="M4 21h16M7 21V9l8-4v16M15 9h4v12M10 12h2M10 16h2"/>'),
    metro: svg('<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4"/>'),
    commute: svg('<path d="M5 16l1.5-5h11L19 16M4 16h16v3H4zM7 19v1M17 19v1"/>'),
    flood: svg('<path d="M4 12a8 8 0 0 1 16 0zM12 12v6a2 2 0 0 0 4 0"/>'),
    traffic: svg('<rect x="8" y="3" width="8" height="18" rx="3"/><circle cx="12" cy="8" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="16" r="1.3"/>'),
  };
  IC.pin = svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>');
  IC.x = svg('<path d="M6 6l12 12M18 6L6 18"/>');
  const reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Smooth DOM swaps with the View Transitions API where available; plain swap otherwise.
  function vt(fn) { if (document.startViewTransition && !reduceMotion) { try { document.startViewTransition(fn); return; } catch (e) { /* fall through */ } } fn(); }
  let toastTimer;
  function hideToast() { const t = document.getElementById("toast"); if (!t) return; t.classList.remove("in"); setTimeout(() => { if (!t.classList.contains("in")) t.hidden = true; }, 220); }
  function toast(msg, action) {
    const t = document.getElementById("toast"); if (!t) return;
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="toast-act">${esc(action.label)}</button>` : ""}`;
    if (action) t.querySelector("button").onclick = (e) => { e.stopPropagation(); action.fn(); hideToast(); };
    t.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("in")));
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, action ? 5000 : 2200);
  }

  /* ---------------- state ---------------- */
  const state = {
    quiz: store.get("quiz", { budget: "", bhk: 3, done: false }),
    saved: store.get("saved", { areas: [], projects: [] }),
    notes: store.get("notes", {}),
    checks: store.get("checks", {}),
    seen: store.get("seen", {}),
    hidden: store.get("hidden", []),
    place: store.get("place", null),
    factors: store.get("factors", null),
    must: store.get("must", null),
    preset: store.get("preset", "all"),
    maxc: store.get("maxc", 0),
    tools: store.get("tools", { income: 200000, emis: 0, savings: 3000000, rate: 8.5, years: 20, price: 12000000, down: 20, status: "Under construction", stamp: 5.6, reg: 1, gst: 5, parking: 400000, legal: 50000, deposit: 250000, interiors: 800000 }),
    pf: { dev: "", loc: "", bhk: "", budget: "", status: "", sort: "price" },
  };
  function persist() { ["quiz", "saved", "notes", "checks", "seen", "tools", "hidden", "place", "factors", "must", "preset", "maxc"].forEach((k) => store.set(k, state[k])); updateSavedCount(); }
  function updateSavedCount() { const c = document.getElementById("savedCount"); if (!c) return; const n = state.saved.areas.length + state.saved.projects.length; c.textContent = n; c.hidden = !n; }

  const SIZE = { 1: 650, 2: 1150, 3: 1650, 4: 2600 };
  const BUDGETS = [
    { id: "a", label: "Under ₹75 L", sub: "Starter homes", min: 0, max: 75e5 }, { id: "b", label: "₹75 L – 1.5 Cr", sub: "Most popular", min: 75e5, max: 15e6 },
    { id: "c", label: "₹1.5 – 3 Cr", sub: "Upgrade", min: 15e6, max: 3e7 }, { id: "d", label: "Above ₹3 Cr", sub: "Premium", min: 3e7, max: Infinity },
  ];
  const budgetById = (id) => BUDGETS.find((b) => b.id === id);
  const estPrice = (l, bhk) => l.psf * SIZE[bhk];
  const projFrom = (p) => byId(p.loc).psf * p.factor * p.minSqft;
  const projTo = (p) => byId(p.loc).psf * p.factor * p.maxSqft;
  function emi(P, rate, years) { const r = rate / 1200, n = years * 12; if (!r) return P / n; const f = Math.pow(1 + r, n); return (P * r * f) / (f - 1); }

  /* ---------------- commute + scoring (deterministic, no AI) ---------------- */
  function km(a, b) {
    const R = 6371, t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lon - a.lon) * t;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const commuteFrom = (p, l) => r0(((km(p, l) * 1.35) / (((l.v.speed || 15) + 18) / 2)) * 60 + 6);
  const myCommute = (l) => commuteFrom(state.place, l);
  const val = (l, k) => (k === "hub_min" ? myCommute(l) : l.v[k]);
  function percentile(m, l) {
    const have = LOCALITIES.filter((x) => val(x, m.k) != null);
    if (have.length < 2) return 50;
    const mine = val(l, m.k);
    return (have.filter((x) => (m.dir === 1 ? val(x, m.k) < mine : val(x, m.k) > mine)).length / (have.length - 1)) * 100;
  }
  function recency(srcId) { const age = (new Date("2026-11-06") - new Date(DATA_DATE)) / 864e5; return Math.max(0.5, Math.min(1, (SOURCES[srcId].cadence * 1.5) / Math.max(age, 1))); }
  let memo = { hub: null, data: {} };
  function scoresFor(l) {
    const pk = state.place.lat + "," + state.place.lon; if (memo.hub !== pk) memo = { hub: pk, data: {} };
    if (memo.data[l.id]) return memo.data[l.id];
    const out = {};
    DIMS.forEach((d) => {
      const signals = d.metrics.filter((m) => val(l, m.k) != null).map((m) => ({ ...m, value: val(l, m.k), pct: percentile(m, l), srcId: m.src || d.src }));
      const score = signals.length ? signals.reduce((a, s) => a + s.pct, 0) / signals.length : null;
      const conf = signals.length ? (signals.length / d.metrics.length) * (signals.reduce((a, s) => a + recency(s.srcId), 0) / signals.length) : 0;
      out[d.id] = { score, conf, signals, missing: d.metrics.filter((m) => val(l, m.k) == null) };
    });
    return (memo.data[l.id] = out);
  }
  function overall(l) { const sc = scoresFor(l), w = weights(); let n = 0, d = 0; DIMS.forEach((x) => { if (sc[x.id].score != null) { n += w[x.id] * sc[x.id].score; d += w[x.id]; } }); return d ? n / d : 0; }
  const ranked = () => LOCALITIES.slice().sort((a, b) => overall(b) - overall(a));
  const rankOf = (l) => ranked().indexOf(l) + 1;
  const tier = (s) => (s == null ? "neutral" : s >= 67 ? "good" : s >= 34 ? "mid" : "low");
  const rankTier = (l) => { const r = rankOf(l), n = LOCALITIES.length; return r <= n / 3 ? "good" : r <= (2 * n) / 3 ? "mid" : "low"; };
  const fmtVal = (s) => `${s.value}${s.unit ? (s.unit.startsWith("/") || s.unit === "%" ? "" : " ") + s.unit : ""}`;
  const yieldPct = (l) => ((l.rent2 * 1000 * 12) / estPrice(l, 2)) * 100;
  const sortedDims = (l) => { const sc = scoresFor(l); return DIMS.filter((d) => sc[d.id].score != null).sort((a, b) => sc[b.id].score - sc[a.id].score); };

  /* ---------------- plain-language copy ---------------- */
  const WORD = { good: "Great", mid: "Okay", low: "Weak", neutral: "No data" };
  function plain(l, id) {
    const v = l.v, t = tier(scoresFor(l)[id].score);
    const P = {
      schools: { good: `Plenty of schools close by: ${v.schools_3km} within 3 km.`, mid: `A fair choice of schools: ${v.schools_3km} within 3 km.`, low: `Fewer schools nearby: ${v.schools_3km} within 3 km. Plan for a longer school run.` },
      air: { good: `Cleaner air than most of the city.`, mid: `Air is about average for Bengaluru.`, low: `Air is poorer than most areas: ${v.days_100} days a year above AQI 100.` },
      water: { good: `Steady piped water, about ${v.supply_hrs} hours a day.`, mid: `Water is usually fine; ${v.tanker}% of homes still use tankers.`, low: `Water can be a worry: ${v.tanker}% of homes rely on tankers.` },
      power: { good: `Power cuts are rare, about ${v.outage_hrs} hours a month.`, mid: `Some power cuts, about ${v.outage_hrs} hours a month.`, low: `More power cuts than most: ${v.outage_hrs} hours a month. Ask about backup.` },
      safety: { good: `Fewer reported incidents and well-lit streets.`, mid: `Reported incidents are around the city average.`, low: `More reported incidents than most areas. Visit at night before you decide.` },
      infra: { good: `Lots of new public projects coming up nearby.`, mid: `Some public projects under way nearby.`, low: `Little new public infrastructure planned nearby.` },
      metro: { good: `A metro station about ${v.metro_km} km away.`, mid: `Metro is ${v.metro_km} km away, so plan a short feeder ride.`, low: `Metro is far: about ${v.metro_km} km.` },
      commute: { good: `Short trip to work: about ${myCommute(l)} min at peak.`, mid: `A manageable commute: about ${myCommute(l)} min at peak.`, low: `A long commute: about ${myCommute(l)} min at peak.` },
      flood: { good: `Rarely floods; few waterlogging spots.`, mid: `A few waterlogging spots in heavy rain.`, low: `Known for waterlogging: ${v.hotspots} hotspots nearby.` },
      traffic: { good: `Roads move better than most at rush hour.`, mid: `Typical Bengaluru rush-hour traffic.`, low: `Heavy rush-hour traffic, around ${v.speed} km/h.` },
    };
    return t === "neutral" ? "Not enough data yet." : P[id][t];
  }
  const goodFor = (l) => selDims(l).slice(0, 3).filter((d) => scoresFor(l)[d.id].score >= 50);
  const watchOut = (l) => selDims(l).slice(-2).reverse().filter((d) => scoresFor(l)[d.id].score < 50);
  const grade = (s) => (s == null ? "–" : s >= 80 ? "A" : s >= 60 ? "B" : s >= 40 ? "C" : s >= 20 ? "D" : "E");
  const gradeTier = (s) => (s == null ? "neutral" : s >= 60 ? "good" : s >= 40 ? "mid" : "low");

  /* ---------------- places: type a locality or use GPS; an unknown one resolves to the nearest tracked area ---------------- */
  const SHORT_HUB = { orr: "ORR, Bellandur", manyata: "Manyata Tech Park", itpl: "ITPL, Whitefield", ecity: "Electronic City", cbd: "MG Road", airport: "The airport" };
  const GAZ = window.TB.GAZETTEER;
  const hubPlace = (h) => ({ label: h.name, lat: h.lat, lon: h.lon, kind: "hub" });
  const areaPlace = (l) => ({ label: l.name, lat: l.lat, lon: l.lon, kind: "area" });
  const gazPlace = (g) => ({ label: g[0], lat: g[1], lon: g[2], kind: "place" });
  function nearestArea(p) { let best = null; LOCALITIES.forEach((l) => { const d = km(p, l); if (!best || d < best.d) best = { l, d }; }); return best; }
  function setPlace(p) { state.place = p; state.quiz.done = true; persist(); }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  function searchPlaces(q) {
    q = q.trim().toLowerCase();
    const hubs = HUBS.map((h) => ({ p: hubPlace(h), sub: "Office hub", keys: [h.name.toLowerCase(), (SHORT_HUB[h.id] || "").toLowerCase(), h.id] }));
    if (!q) return { list: hubs.slice(0, 6), fuzzy: false };
    const locs = LOCALITIES.map((l) => ({ p: areaPlace(l), sub: l.zone + " · tracked area", keys: [l.name.toLowerCase()].concat(l.aliases, l.pincodes) }));
    const gaz = GAZ.map((g) => { const p = gazPlace(g), n = nearestArea(p); return { gaz: true, p, sub: `Closest area: ${n.l.name}, ${n.d.toFixed(1)} km`, keys: [g[0].toLowerCase()].concat(g[3] || []) }; });
    const all = locs.concat(hubs, gaz), seen = {};
    const score = (x) => { let s = 0; x.keys.forEach((k) => { if (k === q) s = Math.max(s, x.gaz ? 5 : 4); else if (k.startsWith(q)) s = Math.max(s, 3); else if (k.split(/[\s,]+/).some((w) => w.startsWith(q))) s = Math.max(s, 2); else if (k.includes(q) || (q.length > 3 && q.includes(k))) s = Math.max(s, 1); }); return s; };
    const uniq = (arr) => arr.filter((x) => (seen[x.p.label] ? false : (seen[x.p.label] = true)));
    const hit = uniq(all.map((x) => ({ x, s: score(x) })).filter((r) => r.s).sort((a, b) => b.s - a.s).map((r) => r.x)).slice(0, 7);
    if (hit.length) return { list: hit, fuzzy: false };
    const cand = []; all.forEach((x) => { let m = 99; x.keys.forEach((k) => { if (k.length > 3) m = Math.min(m, lev(q, k)); }); if (m <= Math.max(1, Math.floor(q.length / 4))) cand.push({ x, m }); });
    return { list: uniq(cand.sort((a, b) => a.m - b.m).map((c) => c.x)).slice(0, 5), fuzzy: true };
  }
  const placeBox = (id, value) => `<div class="combo"><input id="${id}" class="input big" role="combobox" aria-expanded="false" aria-controls="${id}-l" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="e.g. Arekere, Bellandur, ITPL, 560066" value="${esc(value || "")}"><ul id="${id}-l" class="sugg" role="listbox" hidden></ul></div>`;
  function placeNote() {
    const p = state.place;
    if (p.def) return `Starting from a sample office at <b>${esc(p.label)}</b>. Type your own above to personalise the list.`;
    if (p.kind === "area") return `Measuring commutes from <b>${esc(p.label)}</b>.`;
    if (p.kind === "hub") return `Measuring commutes to your office at <b>${esc(p.label)}</b>.`;
    const n = nearestArea(p);
    if (p.kind === "gps") return `Using <b>your location</b>. The closest tracked area is <a href="#area-${n.l.id}">${esc(n.l.name)}</a>, ${n.d.toFixed(1)} km away. Commutes are measured from where you are.`;
    return `<b>${esc(p.label)}</b> isn't one of our ${LOCALITIES.length} tracked areas. The closest is <a href="#area-${n.l.id}">${esc(n.l.name)}</a>, ${n.d.toFixed(1)} km away. Commutes are measured from ${esc(p.label)}.`;
  }
  // Location: only offered where the browser can ask for it. We ask in the page first, then the browser asks.
  async function locationAvailable() {
    if (!navigator.geolocation) return false;
    try { if (navigator.permissions && navigator.permissions.query) { const r = await navigator.permissions.query({ name: "geolocation" }); return r.state !== "denied"; } } catch (e) { /* fall through: offer it, hide it if the call fails */ }
    return true;
  }
  function locateMe(done, msg, btn) {
    msg("Waiting for your browser's permission…");
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = { label: "My location", lat: pos.coords.latitude, lon: pos.coords.longitude, kind: "gps" }, n = nearestArea(p);
      if (n.d > 60) { msg(`You seem to be ${Math.round(n.d)} km from Bengaluru. Type a Bengaluru area instead.`); return; }
      setPlace(p); msg(""); done(p);
    }, (err) => {
      if (btn) btn.hidden = true;
      msg(err && err.code === 1 ? "No problem, we won't use your location. Type your area instead." : "We couldn't get your location. Type your area instead.");
    }, { timeout: 8000, maximumAge: 600000 });
  }
  function consentLocate(done, msg, btn) {
    msg(`<span class="consent"><b>Use your location?</b> Your browser will ask you next. We use it only on this device to measure distances, and never send or save it.<span class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm pri" data-loc-yes>Yes, use my location</button><button type="button" class="btn sm" data-loc-no>Not now</button></span></span>`);
    const yes = document.querySelector("[data-loc-yes]"), no = document.querySelector("[data-loc-no]");
    if (yes) yes.onclick = () => locateMe(done, msg, btn);
    if (no) no.onclick = () => msg("");
  }
  // wires a "Use my location" button: hidden unless location can be requested here
  function initLocate(btnId, done, msg) {
    const btn = document.getElementById(btnId); if (!btn) return;
    locationAvailable().then((ok) => { if (ok && document.getElementById(btnId)) btn.hidden = false; });
    btn.addEventListener("click", () => consentLocate(done, msg, btn));
  }
  function wirePlaceBox(id, onPick, msg) {
    const inp = document.getElementById(id), box = document.getElementById(id + "-l");
    let active = -1, sugg = [];
    const close = () => { box.hidden = true; inp.setAttribute("aria-expanded", "false"); active = -1; };
    const opts = () => box.querySelectorAll('[role="option"]');
    const mark = () => { opts().forEach((c, i) => c.setAttribute("aria-selected", i === active)); inp.setAttribute("aria-activedescendant", active >= 0 ? id + "-o" + active : ""); };
    const open = (q) => {
      const r = searchPlaces(q); sugg = r.list; if (!sugg.length) { close(); return r; }
      box.innerHTML = (r.fuzzy ? `<li class="sg-h" aria-hidden="true">Did you mean</li>` : "") + sugg.map((s, i) => `<li role="option" id="${id}-o${i}" data-i="${i}" aria-selected="false"><b>${esc(s.p.label)}</b><span>${esc(s.sub)}</span></li>`).join("");
      box.hidden = false; inp.setAttribute("aria-expanded", "true"); return r;
    };
    const pick = (p) => { setPlace(p); inp.value = p.label; close(); msg(""); onPick(p); };
    inp.addEventListener("focus", () => { inp.select(); open(inp.value === state.place.label ? "" : inp.value); });
    inp.addEventListener("input", () => { active = -1; msg(""); open(inp.value); });
    inp.addEventListener("keydown", (e) => {
      const n = opts().length;
      if (e.key === "ArrowDown") { e.preventDefault(); if (box.hidden) open(""); active = Math.min(n - 1, active + 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); mark(); }
      else if (e.key === "Escape") close();
      else if (e.key === "Enter") {
        e.preventDefault();
        if (active >= 0 && sugg[active]) { pick(sugg[active].p); return; }
        const r = searchPlaces(inp.value);
        if (r.list.length && !r.fuzzy) pick(r.list[0].p);
        else if (r.list.length) { open(inp.value); msg(`We couldn't find “${esc(inp.value)}”. Pick the closest match below.`); }
        else msg(`We couldn't find “${esc(inp.value)}”. Try a nearby landmark, a pincode, or pick an office hub.`);
      }
    });
    box.addEventListener("mousedown", (e) => { e.preventDefault(); const li = e.target.closest('[role="option"]'); if (li) pick(sugg[+li.dataset.i].p); });
    const off = (e) => { if (!document.getElementById(id)) { document.removeEventListener("click", off); return; } if (!e.target.closest(".combo")) close(); };
    document.addEventListener("click", off);
    return pick;
  }

  /* ---------------- what matters: tick, untick, star ---------------- */
  const PRESETS = {
    all: { label: "Show me everything", off: [], must: [] },
    family: { label: "Family with kids", off: [], must: ["schools", "safety", "air", "flood"] },
    pro: { label: "Working professional", off: ["schools"], must: ["commute", "traffic", "metro"] },
    wfh: { label: "Work from home", off: ["schools", "commute", "traffic"], must: ["power", "water", "air"] },
    invest: { label: "Buying to invest", off: [], must: ["infra", "metro", "commute"] },
  };
  function applyPreset(k) {
    const pr = PRESETS[k]; state.preset = k; state.factors = {}; state.must = {};
    DIMS.forEach((d) => { state.factors[d.id] = !pr.off.includes(d.id); state.must[d.id] = pr.must.includes(d.id); });
  }
  const weights = () => {
    const w = {}; let any = false;
    DIMS.forEach((d) => { w[d.id] = state.factors[d.id] ? (state.must[d.id] ? 3 : 1) : 0; if (w[d.id]) any = true; });
    if (!any) DIMS.forEach((d) => (w[d.id] = 1));
    return w;
  };
  const selDims = (l) => { const w = weights(), sc = scoresFor(l); return DIMS.filter((d) => w[d.id] > 0 && sc[d.id].score != null).sort((a, b) => sc[b.id].score - sc[a.id].score); };
  function reasons(l) {
    const w = weights(), sc = scoresFor(l), ds = selDims(l);
    const pos = ds.filter((d) => sc[d.id].score >= 60).sort((a, b) => w[b.id] * sc[b.id].score - w[a.id] * sc[a.id].score).slice(0, 2);
    const neg = ds.filter((d) => sc[d.id].score < 40).sort((a, b) => w[b.id] * (100 - sc[b.id].score) - w[a.id] * (100 - sc[a.id].score)).slice(0, 1);
    return { pos, neg };
  }
  const factorGrid = () => DIMS.map((d) => {
    const on = state.factors[d.id], must = on && state.must[d.id];
    return `<div class="fx ${on ? "" : "off"}"><label class="fxl"><input type="checkbox" data-f="${d.id}" ${on ? "checked" : ""}><span class="fxi" aria-hidden="true">${DIM_IC[d.id]}</span><span class="fxn">${esc(d.name)}</span></label><button type="button" class="star ${must ? "on" : ""}" data-must="${d.id}" aria-pressed="${!!must}" aria-label="Matters most: ${esc(d.name)}" title="Matters most" ${on ? "" : "disabled"}>★</button></div>`;
  }).join("");

  const oneLiner = (l) => {
    const g = goodFor(l).slice(0, 2).map((d) => d.name.toLowerCase()), w = watchOut(l).slice(0, 1).map((d) => d.name.toLowerCase());
    return `${g.length ? "Strong on " + g.join(" and ") : "A balanced all-rounder"}${w.length ? `, weaker on ${w[0]}` : ""}.`;
  };

  /* ---------------- rule-based Q&A (no AI model) ---------------- */
  const INTENTS = [
    ["schools", /school|educat|cbse|icse|board|teacher|kids/], ["air", /\bair\b|aqi|pollut|pm ?2|smog|breath/], ["water", /water|borewell|tanker|supply|bwssb/],
    ["power", /power|electric|outage|cut|bescom|shutdown/], ["safety", /safe|crime|police|light|theft|night/], ["metro", /metro|station/], ["infra", /flyover|infra|upcoming|construct|rail/],
    ["commute", /commute|office|travel|hub|distance|drive/], ["flood", /flood|waterlog|garbage|pothole|civic|rain|drain/], ["traffic", /traffic|congest|jam|speed/],
  ];
  function answer(q, l) {
    const ql = q.toLowerCase();
    const named = LOCALITIES.find((x) => ql.includes(x.name.toLowerCase()) || x.aliases.some((a) => ql.includes(a)));
    if (named) l = named;
    if (/should i (buy|avoid|invest)|worth (it|buying)|good (place )?to buy|recommend/.test(ql)) return `I don't tell anyone to buy or avoid a place. Weigh what's great and what to watch out for in <a href="#area-${l.id}">${esc(l.name)}</a> against what matters to you.`;
    const parts = [];
    if (/price|cost|rate|sq ?ft|afford|budget|expensive|cheap|apprec/.test(ql)) parts.push(`<b>Prices in ${esc(l.name)}</b><ul><li>About ${inr(l.psf)} per sq ft ${srcChip("S12")}</li><li>2 BHK around ${inr(estPrice(l, 2))}, 3 BHK around ${inr(estPrice(l, 3))}</li><li>Prices rose ${l.appr5}% in five years</li></ul>`);
    if (/rent|yield|invest/.test(ql)) parts.push(`<b>Renting in ${esc(l.name)}</b><ul><li>2 BHK rents for about ₹${l.rent2}k a month</li><li>That's a ${yieldPct(l).toFixed(1)}% yearly return on the price</li></ul>`);
    if (/project|builder|developer|prestige|sobha|brigade|sattva|godrej|embassy|purva|apartment|flat/.test(ql)) {
      const ps = PROJECTS.filter((p) => p.loc === l.id);
      parts.push(ps.length ? `<b>Projects in ${esc(l.name)}</b><ul>${ps.map((p) => `<li><a href="#project-${p.id}">${esc(p.name)}</a> by ${esc(devById(p.dev).name)}</li>`).join("")}</ul>` : `We don't track any projects in ${esc(l.name)} yet.`);
    }
    INTENTS.filter(([, re]) => re.test(ql)).forEach(([id]) => {
      const d = dimById(id);
      if (id === "metro") { const ms = l.infra.filter((e) => e.type === "Metro"); parts.push(`<b>Metro: ${WORD[tier(scoresFor(l)[id].score)]}</b><br>${esc(plain(l, id))} ${srcChip(d.src)}${ms.length ? `<ul>${ms.map((e) => `<li>${esc(e.project)}: ${esc(e.status.toLowerCase())}, ${esc(e.expected)}</li>`).join("")}</ul>` : ""}`); return; }
      if (id === "infra") { parts.push(`<b>Coming up in ${esc(l.name)}</b><ul>${l.infra.map((e) => `<li>${esc(e.project)}: ${esc(e.status.toLowerCase())}, ${esc(e.expected)}${e.verified ? "" : " (date unconfirmed)"}</li>`).join("")}</ul>`); return; }
      parts.push(`<b>${d.name}: ${WORD[tier(scoresFor(l)[id].score)]}</b><br>${esc(plain(l, id))} ${srcChip(d.src)}${d.caveat ? `<br><span class="xs faint">${esc(d.caveat)}</span>` : ""}`);
    });
    if (!parts.length && /overall|summary|how is|tell me|about/.test(ql)) return `<b>${esc(l.name)}</b>: ${esc(oneLiner(l))}`;
    return parts.length ? parts.join("<hr>") : `I don't know that one. Try asking about schools, water, power, safety, metro, traffic, flooding, prices, rent or projects.`;
  }

  /* ---------------- SVG pieces ---------------- */
  function heroArt() {
    const b = [[60, 120, 54, 150], [122, 80, 46, 190], [176, 140, 60, 130], [244, 60, 50, 210], [302, 110, 58, 160]];
    const win = b.map(([x, y, w, h]) => { let s = ""; for (let yy = y + 16; yy < y + h - 24; yy += 22) for (let xx = x + 10; xx < x + w - 12; xx += 16) s += `<rect x="${xx}" y="${yy}" width="7" height="10" rx="1.5" fill="var(--paper)" opacity=".9"/>`; return s; }).join("");
    return `<svg viewBox="0 0 420 340" role="img" aria-label="Illustration of Bengaluru apartment towers with a house in front">
      <circle cx="330" cy="70" r="38" fill="var(--sun)"/>
      ${b.map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${i % 2 ? "var(--accent)" : "var(--ink-3)"}" opacity="${i % 2 ? 1 : 0.55}"/>`).join("")}${win}
      <rect x="20" y="268" width="380" height="6" rx="3" fill="var(--line)"/>
      <circle cx="44" cy="232" r="26" fill="var(--accent)" opacity=".75"/><circle cx="70" cy="244" r="20" fill="var(--accent)"/><rect x="54" y="246" width="5" height="24" fill="var(--ink-3)"/>
      <path d="M160 272v-48l40-32 40 32v48z" fill="var(--surface)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
      <path d="M150 230l50-42 50 42" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="190" y="240" width="20" height="32" rx="3" fill="var(--sun)"/>
      <g transform="translate(262 196)"><rect width="138" height="92" rx="14" fill="var(--surface)" stroke="var(--line)" stroke-width="1.5"/>
        ${["Schools", "Water", "Metro"].map((t, i) => `<circle cx="20" cy="${24 + i * 24}" r="8" fill="${i === 1 ? "var(--mid)" : "var(--good)"}"/><path d="M16 ${24 + i * 24}l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><text x="36" y="${29 + i * 24}" style="font:600 13px var(--f-body);fill:var(--ink)">${t}</text>`).join("")}</g>
    </svg>`;
  }
  function spark(series, fc, anomaly, unit) {
    const all = series.concat(fc), W = 320, H = 110, mn = Math.min(...all) * 0.95, mx = Math.max(...all) * 1.03, rg = mx - mn || 1;
    const x = (i) => 30 + (i * (W - 40)) / (all.length - 1), y = (v) => H - 18 - ((v - mn) / rg) * (H - 30);
    const hist = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" "), li = series.length - 1;
    const fut = [li].concat(fc.map((_, i) => series.length + i)).map((i) => `${x(i).toFixed(1)},${y(all[i]).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Twelve months of data with a three-month forecast">
      ${[mn, (mn + mx) / 2, mx].map((v) => `<line x1="30" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="2 3"/><text x="26" y="${y(v) + 3}" text-anchor="end">${r0(v)}${unit}</text>`).join("")}
      <polygon points="${x(0)},${H - 18} ${hist} ${x(li)},${H - 18}" fill="var(--accent)" fill-opacity=".1"/>
      <polyline points="${hist}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>
      <polyline points="${fut}" fill="none" stroke="var(--ink-3)" stroke-width="1.6" stroke-dasharray="4 3"/>
      <circle cx="${x(li)}" cy="${y(series[li])}" r="4.5" fill="${anomaly ? "var(--low)" : "var(--accent)"}" stroke="var(--surface)" stroke-width="2"/>
      <text x="30" y="${H - 3}">${MONTHS[0]}</text><text x="${x(li)}" y="${H - 3}" text-anchor="middle">${MONTHS[li]}</text><text x="${W - 10}" y="${H - 3}" text-anchor="end">forecast</text></svg>`;
  }
  function trend(series) {
    const n = series.length, mx = (n - 1) / 2, my = series.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0; series.forEach((y, x) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; });
    const slope = sxy / sxx, icpt = my - slope * mx, forecast = [1, 2, 3].map((k) => +(icpt + slope * (n - 1 + k)).toFixed(1));
    const prev = series.slice(0, -1), pm = prev.reduce((a, b) => a + b, 0) / prev.length;
    const sd = Math.sqrt(prev.reduce((a, b) => a + (b - pm) ** 2, 0) / prev.length), last = series[n - 1];
    return { forecast, slope, anomaly: sd > 0 && Math.abs(last - pm) > 2 * sd, pm: +pm.toFixed(1), last };
  }
  const LABEL = { hsr: "l", thanisandra: "t", rajajinagar: "l", hebbal: "l", kanakapura: "b", jayanagar: "l", jpnagar: "l", bannerghatta: "b" };
  function cityMap(top, hiddenIds) {
    top = top || []; hiddenIds = hiddenIds || [];
    const W = 520, H = 560, P = 28, lo0 = 77.5, lo1 = 77.8, la0 = 12.83, la1 = 13.27;
    const X = (lon) => P + ((lon - lo0) / (lo1 - lo0)) * (W - 2 * P), Y = (lat) => P + ((la1 - lat) / (la1 - la0)) * (H - 2 * P);
    const hub = state.place, hx = X(hub.lon), hy = Y(hub.lat), col = { good: "var(--good)", mid: "var(--mid)", low: "var(--low)" };
    let g = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="var(--sunk)"/>`;
    g += LOCALITIES.map((l) => {
      const x = X(l.lon), y = Y(l.lat), n = top.indexOf(l.id), isTop = n >= 0, gone = hiddenIds.includes(l.id), side = LABEL[l.id] || "r", rr = isTop ? 10 : 6;
      const [tx, ty, an] = side === "l" ? [x - rr - 4, y + 3.5, "end"] : side === "t" ? [x, y - rr - 4, "middle"] : side === "b" ? [x, y + rr + 10, "middle"] : [x + rr + 4, y + 3.5, "start"];
      return `<a class="pt ${isTop ? "" : "dim"}" data-id="${l.id}" href="#area-${l.id}" aria-label="${esc(l.name)}${gone ? " (hidden)" : ""}"><title>${esc(l.name)}: ${myCommute(l)} min to work</title>
        <circle cx="${x}" cy="${y}" r="${rr}" fill="${gone ? "var(--ink-3)" : col[rankTier(l)]}" stroke="var(--surface)" stroke-width="2"/>${isTop ? `<text class="rn" x="${x}" y="${y + 3.5}" text-anchor="middle">${n + 1}</text>` : ""}<text class="lbl" x="${tx}" y="${ty}" text-anchor="${an}">${esc(l.name)}</text></a>`;
    }).join("");
    g += `<rect x="${hx - 7}" y="${hy - 7}" width="14" height="14" transform="rotate(45 ${hx} ${hy})" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"/>`;
    g += `<text x="${W - 14}" y="${H - 14}" text-anchor="end" style="font-size:9.5px;fill:var(--ink-3)">Schematic, not to scale</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic map of Bengaluru areas, numbered in order of fit">${g}</svg>`;
  }

  /* ---------------- shared fragments ---------------- */
  const bhkOptions = (sel, list) => (list || [1, 2, 3, 4]).map((b) => `<option value="${b}" ${+sel === b ? "selected" : ""}>${b} BHK</option>`).join("");
  const budgetOptions = (sel) => `<option value="">Any budget</option>` + BUDGETS.map((b) => `<option value="${b.id}" ${sel === b.id ? "selected" : ""}>${esc(b.label)}</option>`).join("");
  const saveBtn = (kind, id) => { const on = state.saved[kind].includes(id); return `<button class="save ${on ? "on" : ""}" data-act="save" data-kind="${kind}" data-id="${id}" aria-pressed="${on}" aria-label="${on ? "Remove from saved" : "Save"}">${IC.mark}</button>`; };
  const statusPill = (s) => `<span class="pill ${s === "Ready" ? "good" : s === "Under construction" ? "mid" : "acc"}">${s === "Ready" ? "Ready to move in" : esc(s)}</span>`;
  const backLink = () => "";
  function projCard(p) {
    const l = byId(p.loc), d = devById(p.dev);
    return `<a class="panel pcard" href="#project-${p.id}">
      <div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span class="mono" aria-hidden="true">${initials(d.name)}</span><div style="min-width:0"><div class="nm">${esc(p.name)}</div><div class="sm muted">${esc(d.name)} · ${esc(l.name)}</div></div></div>
      <div class="row">${statusPill(p.status)}<span class="pill neutral">${p.bhk.join(", ")} BHK</span></div>
      <div class="meta"><div><div class="xs faint">Starts around</div><b>${inr(projFrom(p))}</b></div><div style="text-align:right"><div class="xs faint">Area</div><b>${esc(oneLiner(l).split(",")[0].replace(".", ""))}</b></div></div></a>`;
  }
  function toggleSave(kind, id) {
    const list = state.saved[kind], i = list.indexOf(id);
    if (i < 0) { list.push(id); toast("Saved to your shortlist"); } else { list.splice(i, 1); toast("Removed"); }
    persist();
    document.querySelectorAll(`[data-act="save"][data-kind="${kind}"][data-id="${id}"]`).forEach((b) => { const on = list.includes(id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); if (on) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); } if (b.dataset.label) b.lastChild.textContent = on ? " Saved" : " Save"; });
  }
  document.addEventListener("click", (e) => { const b = e.target.closest('[data-act="save"]'); if (b) { e.preventDefault(); e.stopPropagation(); toggleSave(b.dataset.kind, b.dataset.id); } });

  /* ---------------- Landing: the problem, said the way buyers say it ---------------- */
  function heroArt() {
    const b = [[60, 120, 54, 150], [122, 80, 46, 190], [176, 140, 60, 130], [244, 60, 50, 210], [302, 110, 58, 160]];
    const win = b.map(([x, y, w, h]) => { let s = ""; for (let yy = y + 16; yy < y + h - 24; yy += 22) for (let xx = x + 10; xx < x + w - 12; xx += 16) s += `<rect x="${xx}" y="${yy}" width="7" height="10" rx="1.5" fill="var(--paper)" opacity=".85"/>`; return s; }).join("");
    return `<svg viewBox="0 0 420 340" role="img" aria-label="Illustration of apartment towers with a house in front and a checklist of schools, water and metro">
      <circle cx="330" cy="70" r="36" fill="var(--hi)"/>
      ${b.map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="var(--ink)" opacity="${i % 2 ? 0.9 : 0.35}"/>`).join("")}${win}
      <rect x="20" y="268" width="380" height="5" rx="2.5" fill="var(--line)"/>
      <circle cx="44" cy="232" r="26" fill="var(--ink)" opacity=".3"/><circle cx="70" cy="244" r="20" fill="var(--ink)" opacity=".6"/><rect x="54" y="246" width="5" height="24" fill="var(--ink-3)"/>
      <path d="M160 272v-48l40-32 40 32v48z" fill="var(--surface)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
      <path d="M150 230l50-42 50 42" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="190" y="240" width="20" height="32" rx="3" fill="var(--hi)"/>
      <g transform="translate(262 196)"><rect width="138" height="92" rx="10" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>
        ${["Schools", "Water", "Metro"].map((t, i) => `<circle cx="20" cy="${24 + i * 24}" r="8" fill="${i === 1 ? "var(--mid)" : "var(--good)"}"/><path d="M16 ${24 + i * 24}l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><text x="36" y="${29 + i * 24}" style="font:600 13px var(--f-body);fill:var(--ink)">${t}</text>`).join("")}</g></svg>`;
  }
  function viewLanding() {
    const doneChecks = Object.values(state.checks).filter(Boolean).length;
    const J = [["Tell us where you work", state.quiz.done, "#find"], ["Save an area you like", state.saved.areas.length > 0, "#find"], ["Check what you can afford", !!state.seen.afford, "#tool-afford"], ["Do the paperwork checks", doneChecks >= 6, "#tool-checklist"]];
    const SAID = [
      ["The flat was perfect. Nobody said the drive to office is 90 minutes.", "Rush-hour drive time to your office, for all 20 areas.", "#find"],
      ["We moved in, and then the water tankers started.", "Piped water hours and how many homes depend on tankers.", "#find"],
      ["It floods outside the gate every monsoon.", "Waterlogging hotspots and civic complaints, area by area.", "#find"],
      ["Is this builder's project even registered?", "A paperwork checklist, with a link to Karnataka RERA.", "#tool-checklist"],
    ];
    const pop = ["whitefield", "hsr", "hebbal"].map(byId);
    $app.innerHTML = `
      <section class="hero fade">
        <div class="stack" style="gap:22px">
          <h1>Buying a flat?<br>Know the area first.</h1>
          <p class="lede">The broker shows you the flat. We show you the neighbourhood: water, power cuts, schools, flooding and your real commute, in plain words.</p>
          <div class="heroSearch"><label for="hs" class="eyebrow">Where do you work, or where do you want to live?</label>
            ${placeBox("hs", "")}
            <div class="row" style="gap:10px"><button type="button" class="btn" id="hloc" hidden>${IC.pin} Use my location</button><span class="xs faint">Or start from</span></div>
            <div class="chips">${HUBS.map((h) => `<button type="button" class="chip" data-hubchip="${h.id}">${esc(SHORT_HUB[h.id])}</button>`).join("")}</div>
            <p class="sm" id="hmsg" aria-live="polite" style="min-height:20px"></p>
            <p class="sm faint">Next, tick what matters to you and see the best-fit areas, with reasons. No sign-up.</p></div>
        </div>
        <div class="hero-art">${heroArt()}</div>
      </section>
      <section class="blk"><div class="sech"><h2>Sound familiar?</h2><span class="xs faint">What buyers tell us after the token amount is paid</span></div>
        <ul class="said">${SAID.map(([q, a, h]) => `<li><a href="${h}"><span class="sq">“${esc(q)}”</span><span class="sa"><span class="eyebrow">We show</span>${esc(a)}</span></a></li>`).join("")}</ul></section>
      <section class="blk"><h2>How it works</h2>
        <ol class="how">${[["Tell us where", "Type your office or any Bengaluru locality, or use your location. If we don't track it, we find the closest area."], ["Tick what matters to you", "Don't need schools? Untick them. Metro and floods matter most? Star them. The ranking changes instantly."], ["See the best fits, and why", "Each area comes with reasons, plus the societies and builder projects in it."]].map(([t, d], i) => `<li><span class="hn num">${i + 1}</span><span><b>${t}</b><span>${d}</span></span></li>`).join("")}</ol></section>
      <section class="blk"><div class="sech" style="margin-bottom:6px"><h2>Popular right now</h2><a class="btn ghost" href="#find">All ${LOCALITIES.length} areas ${IC.arrow}</a></div>
        <ul class="ranked">${pop.map((l) => `<li class="rrow"><a class="rlink" href="#area-${l.id}"><span class="rk num"></span><span class="rmain"><b class="rnm">${esc(l.name)}</b><span class="rwhy">${esc(oneLiner(l))}</span></span><span class="rfacts"><span class="num">${inr(estPrice(l, 2))}</span><span class="num faint">2 BHK from</span></span><span class="gr ${gradeOfCls(l)}">${gradeOf(l)}</span></a></li>`).join("")}</ul></section>
      <section class="blk"><div class="sech"><h2>Your home-buying checklist</h2><span class="sm muted">${J.filter((j) => j[1]).length} of 4 done</span></div>
        <div class="journey">${J.map(([t, done, href]) => `<a class="jstep ${done ? "done" : ""}" href="${href}"><span class="tick">${done ? "✓" : ""}</span>${esc(t)}</a>`).join("")}</div></section>
      <div class="cta"><div><h2>How much flat can you afford?</h2><p class="muted" style="margin-top:6px">Enter your salary and see your budget and the areas that fit, in 30 seconds.</p></div><a class="btn sun big" href="#tool-afford">Work it out ${IC.arrow}</a></div>`;
    const go = () => { location.hash = "find"; };
    const hmsg = (m) => { document.getElementById("hmsg").innerHTML = m; };
    wirePlaceBox("hs", go, hmsg);
    initLocate("hloc", go, hmsg);
    $app.addEventListener("click", (e) => { const h = e.target.closest("[data-hubchip]"); if (h) { setPlace(hubPlace(hubById(h.dataset.hubchip))); go(); } });
  }

  /* ---------------- Find: where + what matters -> best fits, with reasons ---------------- */
  const SHOW = 8;
  const gradeOf = (l) => "ABCDE"[Math.min(4, Math.floor((rankOf(l) - 1) / (LOCALITIES.length / 5)))];
  const gradeOfCls = (l) => ({ A: "good", B: "good", C: "mid", D: "low", E: "low" }[gradeOf(l)]);
  const budgetFits = (l) => { const b = budgetById(state.quiz.budget), p = estPrice(l, state.quiz.bhk); return !b || (p >= b.min && p < b.max); };
  const MAXC = [[0, "Any"], [20, "20 min"], [30, "30 min"], [45, "45 min"], [60, "1 hour"], [90, "1.5 hours"]];
  function orderedAreas() {
    const r = ranked().filter((l) => !state.hidden.includes(l.id) && (!state.maxc || myCommute(l) <= state.maxc));
    return r.filter(budgetFits).concat(r.filter((l) => !budgetFits(l)));
  }
  const distTxt = (l) => { const d = km(state.place, l); return d < 0.5 ? "in this area" : (d < 10 ? d.toFixed(1) : r0(d)) + " km"; };
  function areaRow(l, i) {
    const Q = state.quiz, fit = budgetFits(l), on = state.saved.areas.includes(l.id), R = reasons(l);
    const lines = R.pos.map((d) => `<span class="rr p">${esc(plain(l, d.id))}</span>`).concat(R.neg.map((d) => `<span class="rr n">${esc(plain(l, d.id))}</span>`));
    return `<li class="rrow ${fit ? "" : "over"}" data-id="${l.id}" style="--i:${Math.min(i, 8)}">
      <a class="rlink" href="#area-${l.id}"><span class="rk num">${String(i + 1).padStart(2, "0")}</span>
        <span class="rmain"><b class="rnm">${esc(l.name)}</b>${lines.length ? lines.join("") : '<span class="rr">A balanced option on your list.</span>'}</span>
        <span class="rfacts"><span class="num">${inr(estPrice(l, Q.bhk))}</span><span class="num faint">${myCommute(l)} min · ${distTxt(l)}${fit ? "" : " · over budget"}</span></span>
        <span class="gr ${gradeOfCls(l)}" title="Fit grade for you">${gradeOf(l)}</span></a>
      <span class="racts"><button type="button" class="save ${on ? "on" : ""}" data-act="save" data-kind="areas" data-id="${l.id}" aria-pressed="${on}" aria-label="${on ? "Remove " : "Save "}${esc(l.name)}">${IC.mark}</button>
        <button type="button" class="hide" data-act="hide" data-id="${l.id}" aria-label="Hide ${esc(l.name)}">${IC.x}</button></span></li>`;
  }
  const statusShort = (s) => (s === "Ready" ? "ready" : s === "Under construction" ? "building" : "phased");
  function projRow(r, i) {
    const { p, l, d } = r, sv = state.saved.projects.includes(p.id), dv = devById(p.dev), from = state.place;
    return `<li class="rrow" data-id="${p.id}" style="--i:${Math.min(i, 8)}"><a class="rlink" href="#project-${p.id}"><span class="rk num">${d < 0.5 ? "In<small> area</small>" : (d < 10 ? d.toFixed(1) : r0(d)) + "<small> km</small>"}</span>
      <span class="rmain"><b class="rnm">${esc(p.name)}</b><span class="rwhy">${esc(dv.name)} · ${esc(p.micro)}, ${esc(l.name)}</span></span>
      <span class="rfacts"><span class="num">from ${inr(projFrom(p))}</span><span class="num faint">~${commuteFrom(from, l)} min · ${statusShort(p.status)}</span></span>
      <span class="gr ${gradeOfCls(l)}" title="How the area fits you">${gradeOf(l)}</span></a>
      <span class="racts"><button type="button" class="save ${sv ? "on" : ""}" data-act="save" data-kind="projects" data-id="${p.id}" aria-pressed="${sv}" aria-label="${sv ? "Remove " : "Save "}${esc(p.name)}">${IC.mark}</button></span></li>`;
  }
  // FLIP: remember where each row was, apply the change, then animate rows from old to new position
  function flip(listEl, mutate) {
    const first = {}; listEl.querySelectorAll(".rrow").forEach((el) => (first[el.dataset.id] = el.getBoundingClientRect().top));
    mutate();
    if (reduceMotion) return;
    listEl.querySelectorAll(".rrow").forEach((el) => {
      const id = el.dataset.id;
      if (id in first) { const d = first[id] - el.getBoundingClientRect().top; if (Math.abs(d) > 1) el.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.23,1,.32,1)" }); }
      else el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.23,1,.32,1)" });
    });
  }
  function viewFind() {
    let showAll = false;
    $app.innerHTML = `
      <section class="intro fade" style="padding:10px 0 26px"><h1 class="fh">Find the area that fits your life</h1>
        <p class="lede">Tell us where, untick what you don't need, and we'll rank ${LOCALITIES.length} Bengaluru areas for you, with the reasons.</p></section>
      <div class="findgrid">
        <aside class="ctl" aria-label="Your preferences">
          <section class="cs"><h2><span class="sn num">1</span>Where?</h2>
            <label for="fp" class="sm muted">Your office, or where you'd like to live</label>${placeBox("fp", state.place.def ? "" : state.place.label)}
            <div class="row" style="gap:8px"><button type="button" class="btn sm" id="floc" hidden>${IC.pin} Use my location</button></div>
            <p class="sm" id="fmsg" aria-live="polite"></p>
            <div class="chips">${HUBS.map((h) => `<button type="button" class="chip" data-hubchip="${h.id}">${esc(SHORT_HUB[h.id])}</button>`).join("")}</div>
            <p class="pnote" id="pnote"></p></section>
          <section class="cs"><h2><span class="sn num">2</span>What matters to you?</h2>
            <div class="chips" id="presets" role="group" aria-label="Quick picks"></div>
            <div class="fxs" id="fxs"></div><p class="xs faint">Untick what you don't need. Tap ★ for what matters most.</p></section>
          <section class="cs"><h2><span class="sn num">3</span>Your home</h2>
            <div class="fgrid3"><label class="field"><span>Size</span><select class="input" id="fb">${bhkOptions(state.quiz.bhk, [1, 2, 3, 4])}</select></label>
              <label class="field"><span>Budget</span><select class="input" id="fbud">${budgetOptions(state.quiz.budget)}</select></label>
              <label class="field"><span>Max commute</span><select class="input" id="fmc">${MAXC.map(([v, t]) => `<option value="${v}" ${+state.maxc === v ? "selected" : ""}>${t}</option>`).join("")}</select></label></div></section>
        </aside>
        <div class="res">
          <div id="nearest"></div>
          <div class="rhead"><h2>Best fits for you</h2><span class="sm muted" id="rcount"></span></div>
          <ol class="ranked first" id="ranked"></ol><div class="rfoot" id="rfoot"></div><p class="sm muted" id="ignored" style="margin-top:10px"></p>
          <section class="blk" id="projsec" style="margin-top:44px"></section>
          <section class="blk"><h2>On the map</h2><div class="map" id="map" style="margin-top:12px"></div>
            <div class="legend"><span><i style="background:var(--ink)"></i>You</span><span><i style="background:var(--good)"></i>Strong fit</span><span><i style="background:var(--mid)"></i>Middling</span><span><i style="background:var(--low)"></i>Weaker</span></div></section>
        </div></div>`;
    const $ = (id) => document.getElementById(id);
    const drawControls = () => {
      $("presets").innerHTML = Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip ${state.preset === k ? "on" : ""}" data-preset="${k}" aria-pressed="${state.preset === k}">${esc(p.label)}</button>`).join("");
      $("fxs").innerHTML = factorGrid();
    };
    const paint = () => {
      const all = orderedAreas(), list = showAll ? all : all.slice(0, SHOW), p = state.place;
      $("pnote").innerHTML = placeNote();
      $("ranked").innerHTML = list.map(areaRow).join("") || `<li class="empty"><h3>No areas match</h3><p class="sm" style="margin:6px 0 14px">${state.maxc ? "Try a longer maximum commute." : "Every area is hidden."}</p>${state.hidden.length ? '<button class="btn sm" data-act="restore">Restore hidden areas</button>' : ""}</li>`;
      $("rcount").textContent = `${list.length} of ${all.length} areas`;
      const hid = state.hidden.length;
      $("rfoot").innerHTML = (all.length > SHOW ? `<button type="button" class="btn" data-act="more">${showAll ? "Show fewer" : `Show all ${all.length} areas`}</button>` : "") + (hid ? `<span class="sm muted">${hid} hidden · <button type="button" class="btn ghost sm" data-act="restore" style="padding:2px 6px">Restore</button></span>` : "");
      const off = DIMS.filter((d) => !state.factors[d.id]).map((d) => d.name.toLowerCase());
      $("ignored").innerHTML = off.length ? `Not counted: ${esc(off.join(", "))}. Tick them again to include.` : "";
      if (p.kind === "place" || p.kind === "gps") {
        const n = nearestArea(p);
        $("nearest").innerHTML = `<div class="nearest"><span class="eyebrow">Closest tracked area to ${esc(p.label)}</span><div class="row between" style="align-items:flex-end"><div style="min-width:0"><b class="rnm">${esc(n.l.name)}</b><span class="rwhy">${n.d.toFixed(1)} km away · ${esc(oneLiner(n.l))}</span></div><a class="btn" href="#area-${n.l.id}">See ${esc(n.l.name)} ${IC.arrow}</a></div></div>`;
      } else $("nearest").innerHTML = "";
      // societies and projects in the best-fit areas
      const topIds = all.slice(0, 3).map((l) => l.id);
      const items = PROJECTS.filter((q) => topIds.includes(q.loc)).map((q) => ({ p: q, l: byId(q.loc), d: km(p, byId(q.loc)) })).sort((a, b) => topIds.indexOf(a.p.loc) - topIds.indexOf(b.p.loc) || projFrom(a.p) - projFrom(b.p));
      $("projsec").innerHTML = items.length ? `<div class="sech" style="margin-bottom:10px"><div><h2>Societies and projects in your top areas</h2><p class="sm muted" style="margin-top:4px">${items.length} in ${all.slice(0, 3).map((l) => esc(l.name)).join(", ")}</p></div><a class="btn ghost" href="#projects">Nearest to ${esc(p.label.split(",")[0])} ${IC.arrow}</a></div><ol class="ranked">${items.slice(0, 9).map(projRow).join("")}</ol>${items.length > 9 ? `<p class="sm muted" style="margin-top:10px">Showing 9 of ${items.length}. <a href="#projects">See every project near ${esc(p.label.split(",")[0])}</a>.</p>` : ""}` : "";
      $("map").innerHTML = cityMap(list.map((l) => l.id), state.hidden);
    };
    const redraw = (animate) => { if (animate) flip($("ranked"), paint); else paint(); };
    drawControls(); redraw(false);
    setTimeout(() => $("ranked") && $("ranked").classList.remove("first"), 900);
    const msg = (m) => { $("fmsg").innerHTML = m; };
    const placed = () => { $("ranked").classList.remove("first"); redraw(true); };
    const pickPlace = wirePlaceBox("fp", placed, msg);
    initLocate("floc", (p) => { $("fp").value = p.label; placed(); }, msg);
    const hl = (id, on) => { const m = $("map"); m.classList.toggle("has-hl", on); m.querySelectorAll(".pt").forEach((x) => x.classList.toggle("hl", on && x.dataset.id === id)); $("ranked").querySelectorAll(".rrow").forEach((r) => r.classList.toggle("hl", on && r.dataset.id === id)); };
    $("ranked").addEventListener("mouseover", (e) => { const r = e.target.closest(".rrow"); if (r) hl(r.dataset.id, true); });
    $("ranked").addEventListener("mouseleave", () => hl("", false));
    $("map").addEventListener("mouseover", (e) => { const x = e.target.closest(".pt"); if (x) hl(x.dataset.id, true); });
    $("map").addEventListener("mouseleave", () => hl("", false));
    $app.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.f) { state.factors[t.dataset.f] = t.checked; if (!t.checked) state.must[t.dataset.f] = false; state.preset = "custom"; persist(); drawControls(); redraw(true); const n = $app.querySelector(`[data-f="${t.dataset.f}"]`); if (n) n.focus({ preventScroll: true }); }
      if (t.id === "fb") { state.quiz.bhk = +t.value; persist(); redraw(true); }
      if (t.id === "fbud") { state.quiz.budget = t.value; persist(); redraw(true); }
      if (t.id === "fmc") { state.maxc = +t.value; persist(); redraw(true); }
    });
    $app.addEventListener("click", (e) => {
      const hc = e.target.closest("[data-hubchip]"), ps = e.target.closest("[data-preset]"), ms = e.target.closest("[data-must]"), b = e.target.closest("[data-act]");
      if (hc) { const p = hubPlace(hubById(hc.dataset.hubchip)); setPlace(p); $("fp").value = p.label; msg(""); placed(); }
      else if (ps) { applyPreset(ps.dataset.preset); persist(); drawControls(); redraw(true); }
      else if (ms) { state.must[ms.dataset.must] = !state.must[ms.dataset.must]; state.preset = "custom"; persist(); drawControls(); redraw(true); const n = $app.querySelector(`[data-must="${ms.dataset.must}"]`); if (n) n.focus({ preventScroll: true }); }
      else if (b) {
        const act = b.dataset.act;
        if (act === "hide") { e.preventDefault(); const id = b.dataset.id, nm = byId(id).name; state.hidden.push(id); persist(); redraw(true); toast(`${nm} hidden`, { label: "Undo", fn: () => { state.hidden = state.hidden.filter((x) => x !== id); persist(); redraw(true); } }); }
        else if (act === "restore") { state.hidden = []; persist(); redraw(true); }
        else if (act === "more") { showAll = !showAll; redraw(true); }
      }
    });
    void pickPlace;
  }

  /* ---------------- Area guide ---------------- */
  function aqiLabel(v) { return v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 150 ? "Unhealthy for sensitive groups" : "Unhealthy"; }
  function liveAqi(l) {
    const el = document.getElementById("live"); if (!el) return;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 6000);
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${l.lat}&longitude=${l.lon}&current=us_aqi`, { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw 0; return r.json(); })
      .then((j) => { const a = j.current && j.current.us_aqi; if (a == null) throw 0; el.innerHTML = `<b>Right now:</b> AQI ${r0(a)}, ${aqiLabel(a)} (Open-Meteo estimate)`; })
      .catch(() => { el.hidden = true; })
      .finally(() => clearTimeout(timer));
  }
  function viewArea(id) {
    const l = byId(id); if (!l) { location.hash = ""; return; }
    const sc = scoresFor(l), Q = state.quiz, projs = PROJECTS.filter((p) => p.loc === l.id), price = estPrice(l, Q.bhk);
    const tA = trend(l.series.aqi), tO = trend(l.series.outage), g = goodFor(l), w = watchOut(l);
    const asks = ["Is water a problem?", "Is it safe at night?", "Which metro is coming?", "What do flats cost?", "Which projects are here?"];
    const sv = state.saved.areas.includes(l.id);
    $app.innerHTML = `<div class="fade">
      <div class="ahead"><div><span class="eyebrow">${esc(l.zone)} Bengaluru · ${l.pincodes.join(", ")}</span><h1 style="margin-top:10px">${esc(l.name)}</h1><p class="sub">${esc(oneLiner(l))}</p></div>
        <div class="row"><button class="btn ${sv ? "on" : ""}" data-act="save" data-kind="areas" data-id="${l.id}" data-label="1">${IC.mark}<span> ${sv ? "Saved" : "Save"}</span></button><a class="btn" href="#compare-${l.id}">${IC.cols} Compare</a></div></div>
      <div class="band">
        <div class="bi"><span class="eyebrow">${Q.bhk} BHK costs about</span><span class="bv">${inr(price)}</span><span class="bd">EMI near ${inr(emi(price * 0.8, 8.5, 20))} a month</span></div>
        <div class="bi"><span class="eyebrow">Your commute</span><span class="bv">${myCommute(l)}<small> min</small></span><span class="bd">to ${esc(state.place.label)} at rush hour · <a href="#find">change</a></span></div>
        <div class="bi"><span class="eyebrow">Prices grew</span><span class="bv">${l.appr5}%</span><span class="bd">over five years</span></div>
        <div class="bi"><span class="eyebrow">2 BHK rent</span><span class="bv">₹${l.rent2}k</span><span class="bd">a month</span></div></div>
      <section class="blk twocol"><div><h2>What's good</h2><ul class="plist plus">${(g.length ? g : sortedDims(l).slice(0, 2)).map((d) => `<li><span>${esc(plain(l, d.id))}</span></li>`).join("")}</ul></div>
        <div><h2>Watch out for</h2><ul class="plist minus">${(w.length ? w : sortedDims(l).slice(-1)).map((d) => `<li><span>${esc(plain(l, d.id))}</span></li>`).join("")}</ul></div></section>
      <section class="blk"><div class="sech"><h2>Daily life</h2><span class="xs faint">Graded against the other ${LOCALITIES.length - 1} areas · open a row for the numbers · demo data</span></div>
        <div class="lrows">${DIMS.map((d) => { const r = sc[d.id], gc = gradeTier(r.score); return `<details class="lrow" id="d-${d.id}"><summary><span class="li">${DIM_IC[d.id]}</span><span class="lt"><b>${esc(d.name)}</b><span>${esc(plain(l, d.id))}</span></span><span class="gr s ${gc}" title="${WORD[tier(r.score)]}">${grade(r.score)}</span></summary>
          <div class="ld"><div class="tw"><table><thead><tr><th>Measure</th><th>Value</th><th>Better than</th><th>Source</th></tr></thead><tbody>${r.signals.map((x) => `<tr><td>${esc(x.label)}</td><td class="num">${esc(fmtVal(x))}</td><td class="num">${r0(x.pct)}% of areas</td><td>${srcChip(x.srcId)}</td></tr>`).join("")}${r.missing.map((m) => `<tr><td>${esc(m.label)}</td><td colspan="3" class="faint">No data yet</td></tr>`).join("")}</tbody></table></div>${d.caveat ? `<p class="xs faint" style="margin-top:8px">${esc(d.caveat)}</p>` : ""}</div></details>`; }).join("")}</div></section>
      ${l.infra.length ? `<section class="blk"><h2>Coming soon nearby</h2><div class="timeline">${l.infra.map((e) => `<div class="ev"><span class="yr">${esc(e.expected)}</span><div><b>${esc(e.project)}</b><div class="sm muted">${esc(e.status)}</div></div><span class="pill ${e.verified ? "good" : "neutral"}">${e.verified ? "Confirmed" : "Date not confirmed"}</span></div>`).join("")}</div></section>` : ""}
      <section class="blk"><div class="sech" style="margin-bottom:14px"><h2>Homes in ${esc(l.name)}</h2><a class="btn ghost" href="#projects">All projects ${IC.arrow}</a></div>
        ${projs.length ? `<div class="pgrid">${projs.map(projCard).join("")}</div>` : `<p class="muted">We don't track any projects here yet. See <a href="#projects">all ${PROJECTS.length}</a>.</p>`}</section>
      <section class="blk"><h2>Ask about ${esc(l.name)}</h2><p class="sm muted" style="margin:4px 0 14px">Answers come straight from our data. No AI involved.</p>
        <div class="chips" style="margin-bottom:14px">${asks.map((x) => `<button class="chip" data-ask="${esc(x)}">${esc(x)}</button>`).join("")}</div>
        <div class="chat" id="log" aria-live="polite"></div>
        <form class="row" id="askf" style="flex-wrap:nowrap"><input class="input" id="aq" placeholder="Type a question…" aria-label="Your question"><button class="btn pri">Ask</button></form></section>
      <details class="fold"><summary><div><h3>Trends and live air quality</h3><p class="sm muted">Twelve months of air and power data</p></div></summary>
        <div class="g2"><div class="stack"><b>Air quality ${tA.anomaly ? '<span class="pill low">Unusual spike</span>' : ""}</b><div class="spark">${spark(l.series.aqi, tA.forecast, tA.anomaly, "")}</div><p class="notice" id="live">Checking live air quality…</p></div>
          <div class="stack"><b>Power cuts, hours a month ${tO.anomaly ? '<span class="pill low">Unusual spike</span>' : ""}</b><div class="spark">${spark(l.series.outage, tO.forecast, tO.anomaly, "h")}</div></div></div></details>
      <p class="notice">Before you pay a token amount, <a href="#tool-checklist">run the paperwork checklist</a> and look the project up on <a href="https://rera.karnataka.gov.in" target="_blank" rel="noopener">Karnataka RERA</a>.</p></div>`;
    liveAqi(l);
    const log = document.getElementById("log");
    const ask = (t) => { if (!t.trim()) return; log.insertAdjacentHTML("beforeend", `<div class="q">${esc(t)}</div><div class="a">${answer(t, l)}</div>`); log.scrollTop = log.scrollHeight; };
    document.getElementById("askf").addEventListener("submit", (e) => { e.preventDefault(); const i = document.getElementById("aq"); ask(i.value); i.value = ""; });
    $app.addEventListener("click", (e) => { const t = e.target.closest("[data-ask]"); if (t) ask(t.dataset.ask); });
  }

  /* ---------------- Projects ---------------- */
  /* ---------------- Projects near a place: type a locality, get projects nearest to it ---------------- */
  function viewProjects(dev) {
    const pf = state.pf;
    if (dev && devById(dev)) pf.dev = dev;
    if (pf.rad == null) pf.rad = 10;
    $app.innerHTML = `<div class="fade">
      <div class="stack" style="margin-bottom:26px"><h1 style="font-size:clamp(30px,4.4vw,52px)">Societies and projects near you</h1>
        <p class="lede">Type your office or a locality, or use your location. We list ${PROJECTS.length} apartment projects from ${DEVELOPERS.length} builders, nearest first, with the drive at rush hour.</p></div>
      <div class="finder"><label for="pp" class="eyebrow">Near</label>
        ${placeBox("pp", state.place.def ? "" : state.place.label)}
        <div class="row" style="gap:8px"><button type="button" class="btn sm" id="ploc" hidden>${IC.pin} Use my location</button></div>
        <p class="sm" id="pmsg" aria-live="polite" style="min-height:20px"></p>
        <div class="chips">${HUBS.map((h) => `<button type="button" class="chip" data-hubchip="${h.id}">${esc(SHORT_HUB[h.id])}</button>`).join("")}</div>
        <p class="pnote" id="pnote"></p></div>
      <div class="pfilt"><div class="chips" id="rad" role="group" aria-label="Distance">${[[5, "Within 5 km"], [10, "Within 10 km"], [20, "Within 20 km"], [0, "Any distance"]].map(([v, t]) => `<button type="button" class="chip" data-rad="${v}">${t}</button>`).join("")}</div>
        <div class="row" style="gap:10px"><select class="input" id="f-dev" aria-label="Builder" style="width:auto"><option value="">All builders</option>${DEVELOPERS.map((d) => `<option value="${d.id}" ${pf.dev === d.id ? "selected" : ""}>${esc(d.name)}</option>`).join("")}</select>
          <select class="input" id="f-budget" aria-label="Budget" style="width:auto">${budgetOptions(pf.budget)}</select></div></div>
      <div class="rhead" style="margin-top:22px"><h2 id="ptitle"></h2><span class="sm muted" id="pcount"></span></div>
      <ol class="ranked first" id="pres"></ol>
      <p class="notice" style="margin-top:22px"><b>Please note:</b> this is a growing list of well-known projects, not every society in Bengaluru. Distances are measured to the middle of each project's area. Sizes and status are indicative and prices are our estimates, not the builder's price list. Always confirm with the builder and on Karnataka RERA.</p></div>`;
    const $ = (id) => document.getElementById(id);
    const paint = () => {
      const bud = budgetById(pf.budget), from = state.place;
      let list = PROJECTS.map((p) => ({ p, l: byId(p.loc), d: km(from, byId(p.loc)) })).filter((r) => (!pf.dev || r.p.dev === pf.dev) && (!bud || (projFrom(r.p) < bud.max && projTo(r.p) >= bud.min)));
      const total = list.length;
      if (pf.rad) list = list.filter((r) => r.d <= pf.rad);
      list.sort((a, b) => a.d - b.d);
      $("pnote").innerHTML = placeNote();
      $("ptitle").textContent = `Nearest to ${from.label}`;
      $("pcount").textContent = `${list.length} project${list.length === 1 ? "" : "s"}${pf.rad ? ` within ${pf.rad} km` : ""}`;
      document.querySelectorAll("[data-rad]").forEach((b) => { const on = +b.dataset.rad === pf.rad; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      $("pres").innerHTML = list.length ? list.map(projRow).join("")
        : `<li class="empty"><h3>No projects ${pf.rad ? `within ${pf.rad} km of ${esc(from.label)}` : "match"}</h3><p class="sm" style="margin:6px 0 14px">${total ? `${total} match your filters farther away.` : "Try another builder or budget."}</p>${pf.rad ? `<button type="button" class="btn" data-rad="0">Show any distance</button>` : ""}</li>`;
    };
    const redraw = () => { $("pres").classList.remove("first"); flip($("pres"), paint); };
    paint(); setTimeout(() => $("pres") && $("pres").classList.remove("first"), 900);
    const msg = (m) => { $("pmsg").innerHTML = m; };
    wirePlaceBox("pp", redraw, msg);
    initLocate("ploc", (p) => { $("pp").value = p.label; redraw(); }, msg);
    $app.addEventListener("click", (e) => {
      const h = e.target.closest("[data-hubchip]"), r = e.target.closest("[data-rad]");
      if (h) { const p = hubPlace(hubById(h.dataset.hubchip)); setPlace(p); $("pp").value = p.label; msg(""); redraw(); }
      if (r) { pf.rad = +r.dataset.rad; redraw(); }
    });
    $app.addEventListener("change", (e) => { if (e.target.id === "f-dev") { pf.dev = e.target.value; redraw(); } if (e.target.id === "f-budget") { pf.budget = e.target.value; redraw(); } });
  }

  const QUESTIONS = [
    "What's the RERA number, and does its completion date match what sales promised?",
    "Is the land title clear, with a 30-year encumbrance certificate?",
    "Will the flat get an A-khata? Who sanctioned the plan: BBMP, BDA or BMRDA?",
    "What's the delay penalty, and is it the same rate you charge me for late payment?",
    "Which banks have approved home loans for this project?",
    "Where does the water come from: BWSSB, borewell or tankers?",
    "What's the carpet area, not the super built-up area?",
    "What are the monthly maintenance charges and the corpus deposit?",
  ];
  function viewProject(id) {
    const p = projById(id); if (!p) { location.hash = "projects"; return; }
    const l = byId(p.loc), d = devById(p.dev), others = PROJECTS.filter((x) => x.dev === p.dev && x.id !== p.id);
    let bhk = p.bhk.includes(state.quiz.bhk) ? state.quiz.bhk : p.bhk[Math.min(1, p.bhk.length - 1)];
    $app.innerHTML = `<div class="fade">
      ${backLink("#projects", "All projects")}
      <div class="ahead"><div class="row" style="flex-wrap:nowrap;align-items:center;gap:16px"><span class="mono" style="width:60px;height:60px;font-size:21px;border-radius:16px">${initials(d.name)}</span><div><span class="eyebrow">${esc(d.name)}${d.founded ? " · since " + d.founded : ""}</span><h1 style="margin-top:6px;font-size:clamp(28px,4vw,44px)">${esc(p.name)}</h1><p class="sub">${esc(p.micro)}, <a href="#area-${l.id}">${esc(l.name)}</a></p></div></div>
        <div class="row">${statusPill(p.status)}<button class="btn ${state.saved.projects.includes(p.id) ? "on" : ""}" data-act="save" data-kind="projects" data-id="${p.id}" data-label="1">${IC.mark}<span> ${state.saved.projects.includes(p.id) ? "Saved" : "Save"}</span></button></div></div>
      <div class="quick">
        <div class="panel qk"><span class="eyebrow">Homes</span><span class="v">${p.bhk.join(", ")}<small> BHK</small></span><span class="d">indicative</span></div>
        <div class="panel qk"><span class="eyebrow">Sizes</span><span class="v">${num(p.minSqft)}–${num(p.maxSqft)}</span><span class="d">sq ft</span></div>
        <div class="panel qk"><span class="eyebrow">Price, roughly</span><span class="v" style="font-size:21px">${inr(projFrom(p))} – ${inr(projTo(p))}</span><span class="d">our estimate</span></div>
        <div class="panel qk"><span class="eyebrow">Commute</span><span class="v">${myCommute(l)}<small> min</small></span><span class="d">to ${esc(state.place.label)}</span></div></div>
      <div class="g2">
        <div class="panel pad stack"><h2>What would I pay each month?</h2>
          <div class="fgrid"><label class="field"><span>Size</span><select class="input" id="pb">${bhkOptions(bhk, p.bhk)}</select></label><label class="field"><span>Down payment</span><select class="input" id="pdn">${[10, 20, 30, 40].map((x) => `<option value="${x}" ${x === 20 ? "selected" : ""}>${x}%</option>`).join("")}</select></label></div>
          <div id="pest"></div><button class="btn pri" id="fullcost" style="align-self:flex-start">See the full cost with taxes ${IC.arrow}</button></div>
        <div class="panel pad stack"><h2>About the area</h2><p class="muted">${esc(oneLiner(l))}</p><div class="pros" style="gap:10px;font-size:15px">${goodFor(l).slice(0, 2).map((x) => `<div><span class="g">${IC.check}</span>${esc(plain(l, x.id))}</div>`).join("")}${watchOut(l).slice(0, 1).map((x) => `<div><span class="w">${IC.warn}</span>${esc(plain(l, x.id))}</div>`).join("")}</div><a class="btn" href="#area-${l.id}" style="align-self:flex-start">Full ${esc(l.name)} guide ${IC.arrow}</a></div>
      </div>
      <div class="g2" style="margin-top:18px">
        <div class="panel pad stack"><h2>Ask the builder</h2><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:9px;font-size:15px">${QUESTIONS.map((x) => `<li>${esc(x)}</li>`).join("")}</ol><a class="btn" href="https://rera.karnataka.gov.in" target="_blank" rel="noopener" style="align-self:flex-start">Check on Karnataka RERA ${IC.arrow}</a></div>
        <div class="panel pad stack"><h2>My site-visit notes</h2><p class="sm muted">Kept on this device only.</p><textarea class="input" id="note" style="min-height:160px" placeholder="Visited Saturday 11am. Gate traffic was heavy. Ask about the water source…">${esc(state.notes["p:" + p.id] || "")}</textarea><span class="xs faint" id="noteok"></span></div>
      </div>
      ${others.length ? `<div class="row between" style="margin:32px 0 14px"><h2>More from ${esc(d.name)}</h2><a class="btn ghost" href="#projects-${d.id}">See all ${IC.arrow}</a></div><div class="pgrid">${others.slice(0, 3).map(projCard).join("")}</div>` : ""}
      <p class="notice" style="margin-top:22px">Sizes and status are indicative and unverified. Prices are estimated from our demo area average, not taken from ${esc(d.name)}.</p></div>`;
    const $ = (x) => document.getElementById(x);
    const calc = () => {
      const size = clamp(SIZE[bhk], p.minSqft, p.maxSqft), price = l.psf * p.factor * size, dn = +$("pdn").value, loan = price * (1 - dn / 100);
      $("pest").innerHTML = `<div><span class="eyebrow">About</span><div class="kpi">${inr(emi(loan, state.tools.rate, 20))}<span class="sm muted" style="font-family:var(--f-body);letter-spacing:0;font-weight:500"> / month</span></div><p class="sm muted">For a ${bhk} BHK of about ${num(size)} sq ft at ${inr(price)}: pay ${inr(price - loan)} upfront, then a ${inr(loan)} loan over 20 years at ${state.tools.rate}%.</p></div>`;
      return price;
    };
    calc();
    $app.addEventListener("change", (e) => { if (e.target.id === "pb") bhk = +e.target.value; if (["pb", "pdn"].includes(e.target.id)) calc(); });
    $app.addEventListener("input", (e) => { if (e.target.id === "note") { state.notes["p:" + p.id] = e.target.value; persist(); $("noteok").textContent = "Saved"; } });
    $app.addEventListener("click", (e) => { if (e.target.closest("#fullcost")) { state.tools.price = r0(calc()); state.tools.status = p.status === "Ready" ? "Ready" : "Under construction"; state.tools.down = +$("pdn").value; persist(); location.hash = "tool-cost"; } });
  }

  /* ---------------- Compare ---------------- */
  function viewCompare(arg) {
    let ids = (arg || "").split(",").filter((i) => byId(i));
    const target = arg ? Math.max(2, ids.length) : 3;
    ranked().forEach((l) => { if (ids.length < target && !ids.includes(l.id)) ids.push(l.id); });
    ids = ids.slice(0, 3);
    const ls = ids.map(byId), Q = state.quiz;
    const sel = (k) => `<label class="field"><span>Area ${k + 1}</span><select class="input" data-slot="${k}"><option value="">None</option>${LOCALITIES.slice().sort((a, b) => a.name.localeCompare(b.name)).map((l) => `<option value="${l.id}" ${ids[k] === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>`;
    const row = (label, vals, fmt, lowBest) => { const best = lowBest ? Math.min(...vals) : Math.max(...vals); return `<tr><td>${label}</td>${vals.map((v) => `<td class="${v === best ? "best" : ""}">${fmt(v)}</td>`).join("")}</tr>`; };
    const lifeRow = (d) => `<tr><td><span class="row" style="gap:8px;flex-wrap:nowrap"><span style="width:18px;display:inline-flex">${DIM_IC[d.id]}</span>${esc(d.name)}</span></td>${ls.map((l) => { const t = tier(scoresFor(l)[d.id].score); return `<td><span class="pill ${t}">${WORD[t]}</span></td>`; }).join("")}</tr>`;
    $app.innerHTML = `<div class="fade">
      <div class="stack" style="margin-bottom:20px"><h1 style="font-size:clamp(30px,4.4vw,48px)">Compare areas</h1><p class="lede">Side by side, for a ${Q.bhk} BHK and your commute.</p></div>
      <div class="panel" style="padding:16px;margin-bottom:18px"><div class="g3" style="gap:12px">${[0, 1, 2].map(sel).join("")}</div></div>
      <div class="panel tw"><table><thead><tr><th></th>${ls.map((l) => `<th><a href="#area-${l.id}" style="text-decoration:none;color:var(--ink);font:700 17px var(--f-display);letter-spacing:-.01em;text-transform:none">${esc(l.name)}</a></th>`).join("")}</tr></thead><tbody>
        ${row(`${Q.bhk} BHK costs about`, ls.map((l) => estPrice(l, Q.bhk)), inr, true)}
        ${row("Commute to work", ls.map(myCommute), (v) => v + " min", true)}
        ${row("Prices grew (5 yrs)", ls.map((l) => l.appr5), (v) => v + "%")}
        ${row("2 BHK rent", ls.map((l) => l.rent2), (v) => "₹" + v + "k/mo")}
        ${DIMS.map(lifeRow).join("")}
      </tbody></table><p class="xs faint" style="padding:12px 14px">Green numbers are the best in each row.</p></div></div>`;
    $app.addEventListener("change", (e) => {
      if (e.target.dataset.slot == null) return;
      const next = ids.slice(); next[+e.target.dataset.slot] = e.target.value;
      const clean = next.filter((v, i) => v && next.indexOf(v) === i);
      location.hash = clean.length ? "compare-" + clean.join("-") : "compare";
    });
  }

  /* ---------------- Calculators: hub + one page each ---------------- */
  const TOOLS = [
    { id: "afford", icon: IC.wallet, title: "What can I afford?", desc: "Your salary in, your budget and matching areas out." },
    { id: "emi", icon: IC.calc, title: "EMI calculator", desc: "Monthly payment, and how much goes to interest." },
    { id: "cost", icon: IC.receipt, title: "True cost of a flat", desc: "Stamp duty, GST, parking and more, added up." },
    { id: "checklist", icon: IC.list, title: "Paperwork checklist", desc: "RERA, khata, OC: what to check before you pay." },
  ];
  function viewTools() {
    $app.innerHTML = `<div class="fade"><div class="stack" style="margin-bottom:24px"><h1 style="font-size:clamp(30px,4.4vw,48px)">Calculators</h1><p class="lede">Simple tools for the money and the paperwork. Pick one.</p></div>
      <ul class="linklist">${TOOLS.map((t) => `<li><a href="#tool-${t.id}"><span class="ico">${t.icon}</span><span><b>${t.title}</b><span class="d">${t.desc}</span></span>${IC.arrow}</a></li>`).join("")}</ul></div>`;
  }
  const field = (k, label, step, help) => `<label class="field"><span>${label}</span><input class="input num" type="number" id="t-${k}" data-t="${k}" value="${state.tools[k]}" step="${step || 1}" min="0">${help ? `<span class="xs faint">${help}</span>` : ""}</label>`;
  const toolShell = (t, inner) => `<div class="narrow fade">${backLink("#tools", "All calculators")}<div class="row" style="gap:16px;margin-bottom:22px;flex-wrap:nowrap"><span class="tico">${t.icon}</span><div><h1 style="font-size:clamp(28px,4vw,40px)">${t.title}</h1><p class="muted" style="margin-top:4px">${t.desc}</p></div></div>${inner}
    <div class="row" style="margin-top:22px;justify-content:space-between">${TOOLS.filter((x) => x.id !== t.id).map((x) => `<a class="btn sm" href="#tool-${x.id}">${x.title}</a>`).join("")}</div></div>`;
  function bindTools(calc) {
    const onT = (e) => { const k = e.target.dataset.t; if (!k) return; state.tools[k] = k === "status" ? e.target.value : +e.target.value || 0; persist(); calc(); };
    $app.addEventListener("input", onT); $app.addEventListener("change", onT); calc();
  }
  function viewTool(id) {
    const t = TOOLS.find((x) => x.id === id); if (!t) { location.hash = "tools"; return; }
    const T = state.tools, $ = (x) => document.getElementById(x);
    if (id === "afford") {
      state.seen.afford = true; persist();
      $app.innerHTML = toolShell(t, `<div class="panel pad stack"><div class="fgrid">${field("income", "Monthly take-home salary (₹)", 5000, "After tax, for you and any co-borrower")}${field("emis", "EMIs you already pay (₹/month)", 1000, "Car loan, personal loan…")}${field("savings", "Savings for the down payment (₹)", 50000)}${field("rate", "Home-loan interest rate (%)", 0.05)}</div></div><div class="panel pad stack" style="margin-top:16px" id="out"></div>`);
      bindTools(() => {
        const maxEmi = Math.max(0, T.income * 0.5 - T.emis), r = T.rate / 1200, n = 240, f = Math.pow(1 + r, n);
        const maxLoan = r ? (maxEmi * (f - 1)) / (r * f) : maxEmi * n, budget = (maxLoan + T.savings) / 1.08, bhk = state.quiz.bhk;
        const fits = LOCALITIES.filter((l) => estPrice(l, bhk) <= budget).sort((a, b) => overall(b) - overall(a));
        $("out").innerHTML = `<span class="eyebrow">You can comfortably afford about</span><div class="kpi" style="font-size:52px">${inr(budget)}</div>
          <p class="muted">Banks usually keep all your EMIs under half your take-home, so your EMI can be up to ${inr(maxEmi)} a month. That gets a loan of about ${inr(maxLoan)} over 20 years. We keep 8% aside for stamp duty and fees.</p>
          <h3 style="margin-top:8px">Where a ${bhk} BHK fits</h3><div class="chips">${fits.length ? fits.map((l) => `<a class="chip" href="#area-${l.id}">${esc(l.name)} · ${inr(estPrice(l, bhk))}</a>`).join("") : `<span class="muted">No tracked area fits a ${bhk} BHK yet. Try a smaller home in the sentence on the <a href="#">Areas page</a>.</span>`}</div>`;
      });
    } else if (id === "emi") {
      $app.innerHTML = toolShell(t, `<div class="panel pad stack"><div class="fgrid">${field("price", "Flat price (₹)", 100000)}${field("down", "Down payment (%)")}${field("rate", "Interest rate (%)", 0.05)}${field("years", "Loan length (years)")}</div></div><div class="panel pad stack" style="margin-top:16px" id="out"></div>`);
      bindTools(() => {
        const loan = T.price * (1 - T.down / 100), m = emi(loan, T.rate, T.years), total = m * T.years * 12, interest = total - loan;
        $("out").innerHTML = `<span class="eyebrow">Your monthly EMI</span><div class="kpi" style="font-size:52px">${inr(m)}</div>
          <div class="splitbar" aria-hidden="true"><i style="width:${(loan / total) * 100}%;background:var(--accent)"></i><i style="width:${(interest / total) * 100}%;background:var(--sun)"></i></div>
          <div class="legend"><span><i style="background:var(--accent)"></i>Loan ${inr(loan)}</span><span><i style="background:var(--sun)"></i>Interest ${inr(interest)}</span></div>
          <p class="muted">Over ${T.years} years you pay ${inr(total)} in total. Interest is ${r0((interest / loan) * 100)}% of the loan, so prepaying early saves the most.</p>`;
      });
    } else if (id === "cost") {
      $app.innerHTML = toolShell(t, `<div class="panel pad stack"><div class="fgrid">${field("price", "Quoted price (₹)", 100000)}<label class="field"><span>Is it ready?</span><select class="input" data-t="status"><option ${T.status === "Under construction" ? "selected" : ""}>Under construction</option><option value="Ready" ${T.status === "Ready" ? "selected" : ""}>Ready to move in (no GST)</option></select></label>
          ${field("stamp", "Stamp duty + cess (%)", 0.1)}${field("reg", "Registration fee (%)", 0.1)}${field("gst", "GST, if under construction (%)", 1)}${field("parking", "Car park (₹)", 50000)}${field("deposit", "Maintenance deposit (₹)", 25000)}${field("legal", "Legal and loan fees (₹)", 5000)}${field("interiors", "Interiors (₹)", 50000)}</div>
          <p class="xs faint">Typical Karnataka defaults. Rates change, so confirm with the sub-registrar or your lawyer.</p></div><div class="panel pad stack" style="margin-top:16px" id="out"></div>`);
      bindTools(() => {
        const gst = T.status === "Ready" ? 0 : (T.price * T.gst) / 100;
        const items = [["Quoted price", T.price], ["GST", gst], ["Stamp duty", (T.price * T.stamp) / 100], ["Registration", (T.price * T.reg) / 100], ["Car park", T.parking], ["Maintenance deposit", T.deposit], ["Legal and loan fees", T.legal], ["Interiors", T.interiors]];
        const sum = items.reduce((a, x) => a + x[1], 0);
        $("out").innerHTML = `<span class="eyebrow">What you'll really spend</span><div class="kpi" style="font-size:52px">${inr(sum)}</div><p class="muted">That's <b style="color:var(--ink)">${(((sum - T.price) / T.price) * 100).toFixed(0)}% more</b> than the quoted price.</p><div class="lines">${items.map(([k, v]) => `<div><span>${k}</span><b>${inr(v)}</b></div>`).join("")}<div><span>Total</span><b>${inr(sum)}</b></div></div>`;
      });
    } else {
      const C = [
        ["rera", "RERA registration", "Search the project on rera.karnataka.gov.in. The completion date should match your agreement."],
        ["title", "Title deed and 30-year encumbrance certificate", "Shows the land is owned free of loans and disputes."],
        ["khata", "A-khata, not B-khata", "B-khata homes can be harder to get loans for, resell or get building licences for."],
        ["plan", "Approved building plan", "Sanctioned by BBMP, BDA or BMRDA, and the floors match what's being built."],
        ["conv", "Land-use conversion order", "Needed on the outskirts, where farmland was converted."],
        ["cc", "Commencement certificate", "Construction was officially allowed to start."],
        ["oc", "Occupancy certificate (ready homes)", "Without it, water, power and resale can be difficult."],
        ["bank", "Bank approvals", "Banks that already lend on the project have checked its papers."],
        ["agreement", "Agreement terms", "Delay penalty, carpet area, refund on cancellation, possession date in writing."],
        ["water", "Water source", "BWSSB, borewell or tanker? Ask residents what they pay each month."],
        ["visit", "Visit at rush hour and after rain", "Drive your commute at 9 am and look for waterlogging after a heavy shower."],
      ];
      $app.innerHTML = toolShell(t, `<div class="panel pad stack"><div class="row between"><b id="chkn"></b><span class="sm muted">Saved on this device</span></div><div class="progress"><i id="chkbar"></i></div>
        <div>${C.map(([k, title, why]) => `<label class="check ${state.checks[k] ? "done" : ""}"><input type="checkbox" data-chk="${k}" ${state.checks[k] ? "checked" : ""}><span><b>${esc(title)}</b><span class="sm muted">${esc(why)}</span></span></label>`).join("")}</div></div>`);
      const upd = () => { const n = C.filter(([k]) => state.checks[k]).length; $("chkn").textContent = n === C.length ? "All done. Nice work!" : `${n} of ${C.length} checked`; $("chkbar").style.width = (n / C.length) * 100 + "%"; };
      upd();
      $app.addEventListener("change", (e) => { const k = e.target.dataset.chk; if (!k) return; state.checks[k] = e.target.checked; e.target.closest(".check").classList.toggle("done", e.target.checked); persist(); upd(); if (C.every(([x]) => state.checks[x])) toast("Checklist complete"); });
    }
  }

  /* ---------------- Saved ---------------- */
  function viewSaved() {
    const A = state.saved.areas.map(byId).filter(Boolean), P = state.saved.projects.map(projById).filter(Boolean);
    $app.innerHTML = `<div class="fade"><div class="stack" style="margin-bottom:24px"><h1 style="font-size:clamp(30px,4.4vw,48px)">Your shortlist</h1><p class="lede">Areas and projects you've saved, with your notes. Kept on this device.</p></div>
      ${!A.length && !P.length ? `<div class="panel empty"><h3>Nothing saved yet</h3><p style="margin:8px 0 18px">Tap the bookmark on any area or project to keep it here.</p><a class="btn pri" href="#">Find my area</a></div>` : ""}
      ${A.length ? `<div class="row between" style="margin-bottom:12px"><h2>Areas</h2>${A.length > 1 ? `<a class="btn sm" href="#compare-${A.slice(0, 3).map((l) => l.id).join("-")}">${IC.cols} Compare</a>` : ""}</div>
        <div class="pgrid" style="margin-bottom:32px">${A.map((l) => `<div class="panel pcard"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><a class="nm" href="#area-${l.id}" style="text-decoration:none">${esc(l.name)}</a><div class="sm muted">${esc(oneLiner(l))}</div></div>${saveBtn("areas", l.id)}</div>
          <div class="facts"><div class="fact"><span class="xs">${state.quiz.bhk} BHK</span><b>${inr(estPrice(l, state.quiz.bhk))}</b></div><div class="fact"><span class="xs">To work</span><b>${myCommute(l)} min</b></div></div>
          <textarea class="input" data-note="a:${l.id}" placeholder="Your notes" aria-label="Notes on ${esc(l.name)}">${esc(state.notes["a:" + l.id] || "")}</textarea></div>`).join("")}</div>` : ""}
      ${P.length ? `<h2 style="margin-bottom:12px">Projects</h2><div class="pgrid">${P.map((p) => `<div class="panel pcard"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><a class="nm" href="#project-${p.id}" style="text-decoration:none">${esc(p.name)}</a><div class="sm muted">${esc(devById(p.dev).name)} · ${esc(byId(p.loc).name)}</div></div>${saveBtn("projects", p.id)}</div>
          <div class="row">${statusPill(p.status)}<span class="pill neutral">From ${inr(projFrom(p))}</span></div>
          <textarea class="input" data-note="p:${p.id}" placeholder="Site-visit notes" aria-label="Notes on ${esc(p.name)}">${esc(state.notes["p:" + p.id] || "")}</textarea></div>`).join("")}</div>` : ""}</div>`;
    $app.addEventListener("input", (e) => { const k = e.target.dataset.note; if (k) { state.notes[k] = e.target.value; persist(); } });
  }

  /* ---------------- Method ---------------- */
  function viewMethod() {
    $app.innerHTML = `<div class="narrow fade"><div class="stack" style="margin-bottom:24px"><h1 style="font-size:clamp(30px,4.4vw,48px)">How it works</h1><p class="lede">Every rating comes from a fixed formula and a named source. No AI, and missing data is shown, never guessed.</p></div>
      <div class="panel pad stack" style="margin-bottom:16px"><h2>Ratings</h2>
        <p>Each measure (schools within 3 km, tanker use, power cuts…) is compared across all ${LOCALITIES.length} areas. “Great” means the area is in the top third, “Okay” the middle third, “Weak” the bottom third.</p>
        <p>Your quiz answers change which factors count most. A family puts schools and safety first; someone working from home puts power and water first.</p>
        <p>Commute is estimated from distance, adjusted for road winding and the area's rush-hour speed. Prices are area averages × a typical home size.</p></div>
      <div class="panel pad stack" style="margin-bottom:16px"><h2>Our rules</h2><div class="pros" style="gap:10px">${["We never tell you to buy or avoid a place or a builder.", "Safety is based on reported incidents, which depend on how much people report.", "Infrastructure dates stay “not confirmed” until a second source agrees.", "Project prices are our estimates, never the builder's price list.", "Everything runs in your browser. No accounts, no tracking, nothing paid."].map((x) => `<div><span class="g">${IC.check}</span>${x}</div>`).join("")}</div></div>
      <div class="panel"><div class="pad" style="padding-bottom:0"><h2>Where the data would come from</h2><p class="sm muted" style="margin-top:4px">This preview uses demo values. These are the public sources a live version would use.</p></div><div class="tw" style="padding:8px 12px 12px"><table><thead><tr><th>Id</th><th>Source</th><th>Updated every</th></tr></thead><tbody>${Object.entries(SOURCES).map(([id, s]) => `<tr><td class="num">${id}</td><td>${s.url.startsWith("http") ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name)}</td><td>${s.cadence} day${s.cadence > 1 ? "s" : ""}</td></tr>`).join("")}</tbody></table></div></div></div>`;
  }

  /* ---------------- router ---------------- */
  function render(keep) {
    const fresh = $app.cloneNode(false); $app.replaceWith(fresh); $app = fresh;
    const parts = location.hash.replace(/^#/, "").split("-"), r = parts[0];
    const nav = { "": "home", find: "find", results: "find", area: "find", compare: "find", projects: "projects", project: "projects", tools: "tools", tool: "tools", saved: "saved" }[r] || "";
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === nav));
    if (r === "find" || r === "results") viewFind();
    else if (r === "area") viewArea(parts[1]);
    else if (r === "projects") viewProjects(parts[1]);
    else if (r === "project") viewProject(parts[1]);
    else if (r === "compare") viewCompare(parts.slice(1).join(","));
    else if (r === "tools") viewTools();
    else if (r === "tool") viewTool(parts[1]);
    else if (r === "saved") viewSaved();
    else if (r === "method") viewMethod();
    else viewLanding();
    if (location.hash.replace(/^#/, "")) $app.insertAdjacentHTML("afterbegin", `<div class="backbar"><button type="button" class="back" data-back>${IC.back}<span>Back</span></button></div>`);
    if (!keep) window.scrollTo(0, 0);
  }
  let depth = 0, popping = false;
  window.addEventListener("hashchange", () => { if (popping) { popping = false; depth = Math.max(0, depth - 1); } else depth++; render(); });
  document.addEventListener("click", (e) => { if (!e.target.closest("[data-back]")) return; if (depth > 0) { popping = true; history.back(); } else location.hash = ""; });
  if (!state.factors || !state.must) applyPreset("all");
  DIMS.forEach((d) => { if (!(d.id in state.factors)) state.factors[d.id] = true; if (!(d.id in state.must)) state.must[d.id] = false; });
  if (!state.place) state.place = Object.assign(hubPlace(HUBS[0]), { def: true });
  updateSavedCount();
  render();
})();
