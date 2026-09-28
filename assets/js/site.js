// Campaign-page interactions. Kept separate from contact-tool.js so the
// tool can fail to load (bad JSON, offline) without taking the rest of the
// page's behavior down with it.

// ── Reveal-on-scroll for the data cells ──────────────────
// Respects prefers-reduced-motion by simply not hiding anything.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll(".stat-cell, .demand-item, .agency-item, .step");

if (!reduceMotion && revealTargets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.style.opacity = "1";
        e.target.style.transform = "translateY(0)";
        observer.unobserve(e.target);
      });
    },
    { threshold: 0.1 },
  );

  revealTargets.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(16px)";
    el.style.transition = "opacity 0.5s, transform 0.5s";
    observer.observe(el);
  });
}

// ── Public comment script: jurisdiction × length ─────────
function updateCommentBoxes() {
  const jurisdiction = document.querySelector(".comment-jurisdiction.active")?.dataset.jurisdiction;
  const length = document.querySelector(".comment-tab.active")?.dataset.show;
  document.querySelectorAll(".comment-box").forEach((box) => {
    const match = box.dataset.jurisdiction === jurisdiction && box.dataset.length === length;
    box.hidden = !match;
  });
}

function wireTabGroup(selector) {
  const tabs = document.querySelectorAll(selector);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", String(active));
      });
      updateCommentBoxes();
    });
  });
}

wireTabGroup(".comment-jurisdiction");
wireTabGroup(".comment-tab");
updateCommentBoxes();

// ── Copy to clipboard ────────────────────────────────────
document.querySelectorAll("[data-copy-target]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = document.querySelector(btn.dataset.copyTarget);
    if (!target) return;
    const original = btn.textContent;
    try {
      await navigator.clipboard.writeText(target.innerText.trim());
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1800);
    } catch {
      btn.textContent = "Copy failed — select & copy manually";
      setTimeout(() => {
        btn.textContent = original;
      }, 3000);
    }
  });
});

// ── Mailing list ─────────────────────────────────────────
// Posts into a hidden iframe so the visitor is never bounced to Google's
// own confirmation page. TODO: this stays inert until a real Google Form
// id and entry.* field names are pasted into index.html — see
// CONTENT-TODO.md. The guard below is what keeps an unconfigured form from
// silently pretending to have signed someone up.
const signupForm = document.getElementById("signup-form");
const signupSuccess = document.getElementById("signup-success");
const signupSink = document.getElementById("signup-sink");

if (signupForm && signupSuccess && signupSink) {
  signupForm.addEventListener("submit", (e) => {
    if (signupForm.action.includes("FORM_ID_HERE")) {
      e.preventDefault();
      alert(
        "This signup form isn't connected yet.\n\n" +
          "Create a Google Form, then replace the placeholder action URL and " +
          "entry.* field names in index.html. See CONTENT-TODO.md.",
      );
      return;
    }
    const submit = signupForm.querySelector(".signup-submit");
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Sending…";
    }
    signupSink.addEventListener(
      "load",
      () => {
        signupForm.hidden = true;
        signupSuccess.hidden = false;
        signupSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      { once: true },
    );
  });
}

// ── Ticker ───────────────────────────────────────────────
// Built from data/ticker.json (pulled from the ticker sheet by
// scraper/fetch-ticker.js). The mode falls through custom -> calendar ->
// off: a custom ticker whose rows have all passed their show_until shows
// the next event instead, and a calendar with nothing upcoming hides the
// bar. Anything that fails to load hides it too — a blank bar beats
// scrolling last month's meeting.
const tickerSection = document.querySelector(".ticker-padding");
const tickerEl = tickerSection?.querySelector(".ticker");

// Same local-date helpers as events.js: "2026-09-29" must not go through
// `new Date(string)`, which reads it as UTC midnight (the previous evening
// in Colorado).
function tickerToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tickerDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

// Same pick as the highlight card on act.html: the soonest upcoming
// featured event wins over the plain soonest one.
async function calendarItems(today) {
  const { events = [] } = await fetchJson("data/events.json");
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming.find((e) => e.featured) ?? upcoming[0];
  if (!next) return [];
  return [
    { text: "Next DeFlock Event", style: "heading" },
    { text: next.title, style: "bold" },
    { text: tickerDate(next.date), style: "" },
    { text: next.time, style: "" },
    { text: next.location, style: "" },
  ].filter((item) => item.text);
}

function customItems(items, today) {
  const live = items.filter((item) => !item.showUntil || item.showUntil >= today);
  // A heading with nothing left under it isn't worth scrolling.
  return live.some((item) => item.style !== "heading") ? live : [];
}

function tickerSeparator() {
  const frag = document.createDocumentFragment();
  frag.append("\u00a0", Object.assign(document.createElement("span"), { textContent: "|" }), "\u00a0\u00a0");
  return frag;
}

function tickerItem(item) {
  if (item.style === "heading") {
    const p = document.createElement("p");
    p.className = "ticker-bold";
    p.append(Object.assign(document.createElement("strong"), { textContent: item.text }));
    return p;
  }
  if (item.style === "bold") return Object.assign(document.createElement("b"), { textContent: item.text });
  return document.createTextNode(item.text);
}

// One pass through the list, ending in a separator so back-to-back passes
// join the same way items do. A bold item starts a new group, so it gets a
// double separator — unless it sits right under a heading.
function tickerPass(items) {
  const nodes = [];
  items.forEach((item, i) => {
    const prev = items[i - 1];
    if (i > 0) nodes.push(tickerSeparator());
    if (item.style === "bold" && prev && prev.style !== "heading") nodes.push(tickerSeparator());
    nodes.push(tickerItem(item));
  });
  nodes.push(tickerSeparator());
  return nodes;
}

// The CSS animation slides the strip left by 50% and snaps back, which is
// only seamless if the first half is at least as wide as the screen — so a
// short list (one calendar event) is repeated until it is, then the whole
// half is doubled. The duration is set from the distance so every ticker
// scrolls at the same speed however long it is.
const TICKER_PX_PER_SECOND = 45;
let tickerItems = [];
let tickerReps = 0;

function renderTicker() {
  tickerEl.replaceChildren(...tickerPass(tickerItems));
  const passWidth = tickerEl.getBoundingClientRect().width;
  const screenWidth = tickerEl.parentElement.clientWidth;
  const reps = Math.max(1, Math.ceil(screenWidth / passWidth));
  const nodes = [];
  for (let i = 0; i < reps * 2; i++) nodes.push(...tickerPass(tickerItems));
  tickerEl.replaceChildren(...nodes);
  tickerEl.style.animationDuration = `${(passWidth * reps) / TICKER_PX_PER_SECOND}s`;
  tickerReps = reps;
}

// Only re-render when widening the window changes how many passes are
// needed; re-rendering otherwise would visibly restart the scroll.
let tickerResizeTimer;
addEventListener("resize", () => {
  if (!tickerItems.length) return;
  clearTimeout(tickerResizeTimer);
  tickerResizeTimer = setTimeout(() => {
    const passWidth = tickerEl.getBoundingClientRect().width / (tickerReps * 2);
    const reps = Math.max(1, Math.ceil(tickerEl.parentElement.clientWidth / passWidth));
    if (reps !== tickerReps) renderTicker();
  }, 200);
});

async function initTicker() {
  if (!tickerSection || !tickerEl) return;
  let items = [];
  try {
    const { mode, items: rows = [] } = await fetchJson("data/ticker.json");
    const today = tickerToday();
    if (mode === "custom") items = customItems(rows, today);
    if (mode === "calendar" || (mode === "custom" && items.length === 0)) items = await calendarItems(today);
  } catch {
    items = [];
  }
  if (items.length === 0) {
    tickerSection.hidden = true;
    return;
  }
  tickerItems = items;
  // Measure with the real fonts; the fallback font is a different width.
  await document.fonts.ready;
  renderTicker();
}

initTicker();
