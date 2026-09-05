const TIINGO_BASE = "https://api.tiingo.com/tiingo";

function getToken() {
  const token = process.env.TIINGO_API_KEY;
  if (!token) {
    const err = new Error("TIINGO_API_KEY is not set in the .env file");
    err.status = 500;
    throw err;
  }
  return token;
}

function parseDateParam(value, fallback) {
  const iso = value && value.trim() ? value.trim() : fallback;
  return new Date(iso).toISOString().slice(0, 10);
}

function defaultEndDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultStartDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().slice(0, 10);
}

const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;
const MAX_SEARCH_RESULTS = 8;

export function isValidTicker(value) {
  return TICKER_PATTERN.test(String(value || "").trim().toUpperCase());
}

export async function searchTickers(rawQuery) {
  const query = String(rawQuery || "").trim();
  if (!query) {
    const err = new Error("Missing search query");
    err.status = 400;
    throw err;
  }
  if (query.length > 64) {
    const err = new Error("Search query too long");
    err.status = 400;
    throw err;
  }

  const url =
    `${TIINGO_BASE}/utilities/search` +
    `?query=${encodeURIComponent(query)}&token=${getToken()}`;

  let res;
  try {
    res = await fetch(url);
  } catch (netErr) {
    const err = new Error(`Network error contacting Tiingo search: ${netErr.message}`);
    err.status = 502;
    throw err;
  }

  if (!res.ok) {
    let message = `Tiingo search API error: HTTP ${res.status}`;
    try {
      const body = await res.json();
      message += ` - ${JSON.stringify(body)}`;
    } catch {
      /* ignore body parse errors */
    }
    const err = new Error(message);
    err.status = 502;
    throw err;
  }

  const results = await res.json();
  const seen = new Set();
  const validated = [];
  for (const item of Array.isArray(results) ? results : []) {
    const ticker = String(item.ticker || "").trim().toUpperCase();
    const name = String(item.name || "").trim();
    if (!isValidTicker(ticker) || seen.has(ticker)) continue;
    seen.add(ticker);
    validated.push({ ticker, name });
    if (validated.length >= MAX_SEARCH_RESULTS) break;
  }
  return validated;
}

export async function fetchDailyPrices({ ticker, startDate, endDate }) {
  const symbol = String(ticker || "").trim().toUpperCase();
  if (!isValidTicker(symbol)) {
    const err = new Error(`Invalid ticker: "${ticker}"`);
    err.status = 400;
    throw err;
  }

  const url =
    `${TIINGO_BASE}/daily/${encodeURIComponent(symbol)}/prices` +
    `?startDate=${parseDateParam(startDate, defaultStartDate())}` +
    `&endDate=${parseDateParam(endDate, defaultEndDate())}` +
    `&token=${getToken()}`;

  let res;
  try {
    res = await fetch(url);
  } catch (netErr) {
    const err = new Error(`Network error contacting Tiingo for ${symbol}: ${netErr.message}`);
    err.status = 502;
    throw err;
  }

  if (!res.ok) {
    let message = `Tiingo API error for ${symbol}: HTTP ${res.status}`;
    try {
      const body = await res.json();
      message += ` - ${JSON.stringify(body)}`;
    } catch {
      /* ignore body parse errors */
    }
    const err = new Error(message);
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }

  return res.json();
}
