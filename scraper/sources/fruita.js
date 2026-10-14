import * as cheerio from 'cheerio';
import { mailtoEmail } from '../validate.js';

const clean = s => s.replace(/\s+/g, ' ').trim();

// fruita.org sits behind Cloudflare's email obfuscation, which swaps each
// mailto: href for /cdn-cgi/l/email-protection#<hex> (first byte is an XOR key,
// the rest is the address XORed with it). Turn that back into a mailto: href so
// it goes through the same mailtoEmail() validation as a plain link.
function decodeHref(href) {
  const m = /\/cdn-cgi\/l\/email-protection#([0-9a-f]{4,})$/i.exec(href);
  if (!m || m[1].length % 2) return href;
  const bytes = m[1].match(/../g).map(h => parseInt(h, 16));
  const key = bytes.shift();
  return 'mailto:' + Buffer.from(bytes.map(b => b ^ key)).toString('utf8');
}

export async function scrape(fetchHtml, scrapeConfig) {
  const $ = cheerio.load(await fetchHtml(scrapeConfig.urls.list));
  const people = [];
  $('.widgetStaffDirectory li.widgetItem.h-card').each((_, el) => {
    const $el = $(el);
    const title = clean($el.find('.p-job-title').text());
    if (!/mayor|council/i.test(title)) return; // page has extra staff h-cards
    const mailto = decodeHref($el.find('.u-email a').attr('href') ?? '');
    people.push({
      name: clean($el.find('.p-name').text()),
      title,
      district: null,
      email: mailtoEmail(mailto, scrapeConfig.emailDomain),
      phone: clean($el.find('.p-tel a').text()) || null,
      profileUrl: null,
    });
  });
  return people;
}
