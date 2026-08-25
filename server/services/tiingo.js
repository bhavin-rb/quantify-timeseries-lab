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

export async function fetchDailyPrices({ ticker, startDate, endDate }) {
  const symbol = String(ticker || "").trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) {
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
