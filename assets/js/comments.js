// Renders the public-comment-script boxes on act.html from
// data/comments.json. Kept separate from site.js (which still owns the
// jurisdiction/length tab buttons and the copy-to-clipboard button — neither
// cares how the .comment-box elements got into the DOM) so this can fail to
// load without taking the rest of the page down, same reasoning as
// contact-tool.js and events.js.

const JURISDICTIONS = ['gj', 'mesa'];
const LENGTHS = ['short', 'personal', 'long'];

// Turns "My name is [your name] and I'm a resident of [neighborhood]." into
// text nodes plus <span class="comment-blank"> for the bracketed parts —
// built with textContent/createElement, never innerHTML, so a stray "<" in
// someone's sheet cell can't inject markup.
function renderInlineBlanks(text) {
  const frag = document.createDocumentFragment();
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) frag.append(document.createTextNode(text.slice(last, m.index)));
    const span = document.createElement('span');
    span.className = 'comment-blank';
    span.textContent = m[1];
    frag.append(span);
    last = re.lastIndex;
  }
  if (last < text.length) frag.append(document.createTextNode(text.slice(last)));
  return frag;
}

function commentBox(jurisdiction, length, message) {
  const box = document.createElement('div');
  box.className = 'comment-box';
  box.dataset.jurisdiction = jurisdiction;
  box.dataset.length = length;
  box.hidden = true;
  for (const para of message.split('\n\n').filter((p) => p.trim() !== '')) {
    const p = document.createElement('p');
    p.append(renderInlineBlanks(para));
    box.append(p);
  }
  return box;
}

function emptyBox(jurisdiction, length) {
  const box = document.createElement('div');
  box.className = 'comment-box comment-box-empty';
  box.dataset.jurisdiction = jurisdiction;
  box.dataset.length = length;
  box.hidden = true;
  const p = document.createElement('p');
  p.textContent = "This script hasn't been written yet.";
  box.append(p);
  return box;
}

// Mirrors site.js's updateCommentBoxes for the boxes rendered here. site.js
// runs (and calls its own version) before this module's fetch resolves, so
// this box set needs its own sync once rendering is done, and again on every
// tab click going forward — site.js's click handlers already re-run its
// version too, and both operate on the same DOM harmlessly.
function syncVisibility() {
  const jurisdiction = document.querySelector('.comment-jurisdiction.active')?.dataset.jurisdiction;
  const length = document.querySelector('.comment-tab.active')?.dataset.show;
  document.querySelectorAll('#comment-boxes .comment-box').forEach((box) => {
    box.hidden = !(box.dataset.jurisdiction === jurisdiction && box.dataset.length === length);
  });
}

async function init() {
  const container = document.getElementById('comment-boxes');
  if (!container) return;

  let data = { comments: [] };
  try {
    const res = await fetch('data/comments.json');
    if (res.ok) data = await res.json();
  } catch {
    /* fall through to the empty-box placeholders below */
  }

  const byCombo = new Map(data.comments.map((c) => [`${c.jurisdiction}:${c.length}`, c.message]));
  container.replaceChildren(
    ...JURISDICTIONS.flatMap((j) =>
      LENGTHS.map((l) => {
        const message = byCombo.get(`${j}:${l}`);
        return message ? commentBox(j, l, message) : emptyBox(j, l);
      }),
    ),
  );
  syncVisibility();
  document.querySelectorAll('.comment-jurisdiction, .comment-tab').forEach((btn) => {
    btn.addEventListener('click', syncVisibility);
  });
}

init();
