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

// ── Draft banner ─────────────────────────────────────────
// Dismissible for the session only (sessionStorage, not localStorage) so
// it comes back on the next visit and can't be permanently forgotten while
// placeholder copy is still live.
const draftBanner = document.getElementById("draft-banner");
if (draftBanner) {
  const KEY = "deflock-mesa-draft-banner-dismissed";
  try {
    if (sessionStorage.getItem(KEY) === "1") draftBanner.hidden = true;
  } catch {
    /* private browsing */
  }
  draftBanner.querySelector("button")?.addEventListener("click", () => {
    draftBanner.hidden = true;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* private browsing */
    }
  });
}
