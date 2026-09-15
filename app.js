// Urban flood resilience — locale and market state handling (MINED-T440-V2)
const supportedLanguages = ['en', 'nl'];
const supportedMarkets = ['NL', 'UK'];
const defaultLang = 'en';
const defaultMarket = 'NL';

// Resolve the site base path from this script tag so both / and /explainer/ work.
const basePath = new URL(document.currentScript.src).pathname.replace(/app\.js$/, '');

function readState() {
  const params = new URLSearchParams(window.location.search);
  let lang = params.get('lang');
  // The explicit market value is preserved verbatim — including legacy aliases
  // such as "gb" — until a separately approved canonicalization decision.
  let market = params.get('market');
  if (!supportedLanguages.includes(lang)) lang = defaultLang;
  if (!market) market = defaultMarket;
  return { lang, market };
}

function writeState(state) {
  // Only lang and market are updated; every other query parameter
  // (ref, utm_source, mode=print, ...) is retained untouched.
  // mode=print is retained as-is and never used to infer a market.
  const url = new URL(window.location.href);
  url.searchParams.set('lang', state.lang);
  url.searchParams.set('market', state.market);
  window.history.replaceState(null, '', url);
}

async function loadLocale(lang) {
  const res = await fetch(basePath + 'locales/' + lang + '.json');
  if (!res.ok) throw new Error('Missing locale: ' + lang);
  return res.json();
}

async function render(state) {
  const dict = await loadLocale(state.lang);
  document.documentElement.lang = state.lang;

  // UI copy is applied per key; missing keys keep the existing text.
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  // Accessible diagram equivalent: observed baseline vs user-controlled adoption scenario.
  const visual = document.getElementById('visual');
  if (visual) {
    visual.setAttribute('aria-label', dict['visual.aria']);
    visual.textContent = dict['visual.text'];
  }

  const langSelect = document.getElementById('lang');
  if (langSelect) langSelect.value = state.lang;
  const marketSelect = document.getElementById('market');
  if (marketSelect) {
    // Surface the explicit value even when it is a legacy alias outside NL/UK,
    // without rewriting it.
    if (!Array.from(marketSelect.options).some((o) => o.value === state.market)) {
      const opt = document.createElement('option');
      opt.value = state.market;
      opt.textContent = state.market;
      marketSelect.appendChild(opt);
    }
    marketSelect.value = state.market;
  }

  // Route links between landing and explainer carry the complete current query:
  // lang, market and every extra parameter (ref=policy, utm_source, mode=print, ...).
  document.querySelectorAll('a[data-nav]').forEach((link) => {
    const target = link.getAttribute('data-nav'); // '' = landing, 'explainer/' = how-to-read
    const params = new URLSearchParams(window.location.search);
    params.set('lang', state.lang);
    params.set('market', state.market);
    link.setAttribute('href', basePath + target + '?' + params.toString());
  });
}

const state = readState();
writeState(state);
render(state);

const langSelect = document.getElementById('lang');
if (langSelect) {
  langSelect.addEventListener('change', function () {
    // Language change: copy only. The current explicit market value is retained.
    state.lang = this.value;
    writeState(state);
    render(state);
  });
}
const marketSelect = document.getElementById('market');
if (marketSelect) {
  marketSelect.addEventListener('change', function () {
    // Market change: explicit visitor action; market context changes, language is retained.
    state.market = this.value;
    writeState(state);
    render(state);
  });
}
