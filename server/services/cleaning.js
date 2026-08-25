export function cleanDailySeries(rows) {
  const stats = {
    totalRaw: rows.length,
    missingClose: 0,
    invalidClose: 0,
    duplicatesRemoved: 0,
    finalCount: 0,
  };

  const byDate = new Map();

  for (const row of rows) {
    const rawDate = row.date || row.Date || row.DATETIME || row.dateTime;
    const rawClose = row.close ?? row.Close;
    const rawVolume = row.volume ?? row.Volume;

    let missing = false;
    if (rawDate == null) missing = true;
    if (rawClose == null || Number.isNaN(Number(rawClose))) missing = true;

    if (missing) {
      stats.missingClose += 1;
      continue;
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
      stats.missingClose += 1;
      continue;
    }

    const close = Number(rawClose);
    const volume = rawVolume == null ? 0 : Number(rawVolume);

    if (!Number.isFinite(close) || close <= 0) {
      stats.invalidClose += 1;
      continue;
    }

    const key = date.toISOString().slice(0, 10);
    if (byDate.has(key)) {
      stats.duplicatesRemoved += 1;
    }
    byDate.set(key, {
      date: key,
      close,
      volume: Number.isFinite(volume) && volume >= 0 ? volume : 0,
    });
  }

  const cleaned = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  stats.finalCount = cleaned.length;

  return { cleaned, stats };
}

export function toLogReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i += 1) {
    if (prices[i - 1] > 0 && prices[i] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }
  return returns;
}
