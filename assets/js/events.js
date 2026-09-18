// Renders the calendar section on act.html from data/events.json. Kept
// separate from contact-tool.js so either can fail to load without taking
// the other down.
//
// Highlight rule: the soonest upcoming event with featured:true wins over
// the plain soonest-by-date event, so an admin can override which event
// leads just by flipping that column in the events sheet — no code change.

// "2026-09-27" must not go through `new Date(string)`, which parses
// date-only strings as UTC midnight; in US timezones that renders as the
// previous evening. Build the Date from local-time parts instead.
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function todayLocalStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function highlightCard(event) {
  const card = document.createElement('div');
  card.className = 'event-highlight';
  card.innerHTML = `
    <p class="event-highlight-badge">${event.featured ? 'Featured Event' : 'Next Up'}</p>
    <p class="event-highlight-date">${formatDate(event.date)}</p>
    <h3 class="event-highlight-title"></h3>
    <p class="event-highlight-meta"></p>
    <p class="event-highlight-desc" hidden></p>
  `;
  card.querySelector('.event-highlight-title').textContent = event.title;
  card.querySelector('.event-highlight-meta').textContent = [event.time, event.location].filter(Boolean).join(' · ');
  if (event.description) {
    const desc = card.querySelector('.event-highlight-desc');
    desc.textContent = event.description;
    desc.hidden = false;
  }
  if (event.link) {
    const a = document.createElement('a');
    a.className = 'btn btn-primary';
    a.href = event.link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'More Info →';
    card.append(a);
  }
  return card;
}

function listRow(event) {
  const row = document.createElement('div');
  row.className = 'event-row';
  row.innerHTML = `
    <div class="event-row-date"></div>
    <div class="event-row-body">
      <div class="event-row-title"></div>
      <div class="event-row-meta"></div>
    </div>
  `;
  row.querySelector('.event-row-date').textContent = formatDate(event.date);
  row.querySelector('.event-row-title').textContent = event.title;
  row.querySelector('.event-row-meta').textContent = [event.time, event.location].filter(Boolean).join(' · ');
  return row;
}

async function init() {
  const highlightEl = document.getElementById('calendar-highlight');
  const listEl = document.getElementById('calendar-list');
  if (!highlightEl || !listEl) return;

  let data;
  try {
    const res = await fetch('data/events.json');
    if (!res.ok) throw new Error(`${res.status}`);
    data = await res.json();
  } catch {
    highlightEl.innerHTML = '<p class="ct-error">The calendar couldn’t load right now.</p>';
    return;
  }

  const today = todayLocalStr();
  const upcoming = (data.events ?? [])
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    highlightEl.innerHTML = '<p class="event-empty">No upcoming events yet — check back soon.</p>';
    return;
  }

  const featured = upcoming.find((e) => e.featured);
  const highlighted = featured ?? upcoming[0];
  highlightEl.replaceChildren(highlightCard(highlighted));

  const rest = upcoming.filter((e) => e !== highlighted);
  if (rest.length === 0) {
    listEl.hidden = true;
  } else {
    listEl.hidden = false;
    listEl.replaceChildren(...rest.map(listRow));
  }
}

init();
