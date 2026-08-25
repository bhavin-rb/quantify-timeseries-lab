export function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function variance(values, ddof = 1) {
  const n = values.length;
  if (n - ddof <= 0) return 0;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (n - ddof);
}

export function std(values, ddof = 1) {
  return Math.sqrt(variance(values, ddof));
}

export function skewness(values) {
  const n = values.length;
  if (n < 3) return 0;
  const m = mean(values);
  const s = std(values);
  if (s === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * values.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0);
}

export function kurtosis(values) {
  const n = values.length;
  if (n < 4) return 0;
  const m = mean(values);
  const s = std(values);
  if (s === 0) return 0;
  const excess =
    (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * values.reduce((sum, v) => sum + ((v - m) / s) ** 4, 0) -
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return excess;
}

export function quantile(sorted, q) {
  const n = sorted.length;
  if (n === 0) return 0;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}

export function minMax(values) {
  if (values.length === 0) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

export function annualizedVolatility(values, periodsPerYear = 252) {
  const sigma = std(values);
  return sigma * Math.sqrt(periodsPerYear);
}

export function pearsonCorrelation(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i += 1) {
    cov += (a[i] - ma) * (b[i] - mb);
    va += (a[i] - ma) ** 2;
    vb += (b[i] - mb) ** 2;
  }
  if (va === 0 || vb === 0) return 0;
  return cov / Math.sqrt(va * vb);
}

const NORMAL_PPF_A = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
  1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
];
const NORMAL_PPF_B = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
  6.680131188771972e1, -1.328068155288572e1,
];
const NORMAL_PPF_C = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
  -2.549732539343734, 4.374664141464968, 2.938163982698783,
];
const NORMAL_PPF_D = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
  3.754408661907416,
];

function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const r =
    t * Math.exp(
      -z * z -
        1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? r : 2 - r;
}

export function normalCdf(x) {
  return 0.5 * erfc(-x / Math.SQRT2);
}

export function normalPpf(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      ((((NORMAL_PPF_C[0] * q + NORMAL_PPF_C[1]) * q + NORMAL_PPF_C[2]) * q + NORMAL_PPF_C[3]) * q + NORMAL_PPF_C[4]) * q +
      NORMAL_PPF_C[5]
    ) / ((((NORMAL_PPF_D[0] * q + NORMAL_PPF_D[1]) * q + NORMAL_PPF_D[2]) * q + NORMAL_PPF_D[3]) * q + 1);
  }
  if (p > 0.97575) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      ((((NORMAL_PPF_C[0] * q + NORMAL_PPF_C[1]) * q + NORMAL_PPF_C[2]) * q + NORMAL_PPF_C[3]) * q + NORMAL_PPF_C[4]) * q +
      NORMAL_PPF_C[5]
    ) / ((((NORMAL_PPF_D[0] * q + NORMAL_PPF_D[1]) * q + NORMAL_PPF_D[2]) * q + NORMAL_PPF_D[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    (((((NORMAL_PPF_A[0] * r + NORMAL_PPF_A[1]) * r + NORMAL_PPF_A[2]) * r + NORMAL_PPF_A[3]) * r + NORMAL_PPF_A[4]) * r +
      NORMAL_PPF_A[5]) *
    q
  ) / (((((NORMAL_PPF_B[0] * r + NORMAL_PPF_B[1]) * r + NORMAL_PPF_B[2]) * r + NORMAL_PPF_B[3]) * r + NORMAL_PPF_B[4]) * r + 1);
}

export function histogram(values, binCount = null) {
  const n = values.length;
  if (n === 0) return { bins: [], density: [] };

  const { min, max } = minMax(values);
  if (max === min) return { bins: [min], density: [n] };

  let count = binCount;
  if (!count) {
    const range = max - min;
    const iqr =
      quantile([...values].sort((a, b) => a - b), 0.75) -
      quantile([...values].sort((a, b) => a - b), 0.25);
    const width = 2 * (iqr || std(values)) / Math.cbrt(n);
    count = Math.max(8, Math.min(60, Math.ceil(range / width)));
  }

  const width = (max - min) / count;
  const bins = [];
  const counts = new Array(count).fill(0);
  for (let i = 0; i < count; i += 1) {
    bins.push(min + (i + 0.5) * width);
  }
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= count) idx = count - 1;
    if (idx < 0) idx = 0;
    counts[idx] += 1;
  }

  // ✅ Density histogram (bars integrate to ~1)
  const density = counts.map((c) => c / (n * width));
  return { bins, density };
}

export function kdeBandwidth(values, rule = "silverman") {
  const n = values.length;
  if (n < 2) return 0;
  const sigma = std(values);
  if (!sigma) return 0;
  const factor = rule === "scott" ? 1.059 : 1.06;
  return factor * sigma * Math.pow(n, -0.2);
}

function gaussianKernel(values, bw, x) {
  let sum = 0;
  for (const v of values) {
    const z = (x - v) / bw;
    sum += Math.exp(-0.5 * z * z);
  }
  return sum / (values.length * bw * Math.sqrt(2 * Math.PI));
}

export function kernelDensityEstimate(values, gridPoints = 100, bwRule = "silverman") {
  const n = values.length;
  if (n === 0) return { x: [], y: [], bandwidth: 0 };

  const { min, max } = minMax(values);
  const pad = (max - min) * 0.1 || 1;
  const x = [];
  for (let i = 0; i < gridPoints; i += 1) {
    x.push(min - pad + ((max - min + 2 * pad) * i) / (gridPoints - 1));
  }

  const bw = kdeBandwidth(values, bwRule);
  if (!bw) return { x, y: x.map(() => 0), bandwidth: 0 };

  // ✅ Raw KDE is already a density function
  return { x, y: x.map((xi) => gaussianKernel(values, bw, xi)), bandwidth: bw };
}

// Evaluate the KDE at specific x positions (e.g. histogram bin centers)
// so the curve is plotted on the same axis as the histogram bars.
export function kdeAtPoints(values, points, bwRule = "silverman") {
  const bw = kdeBandwidth(values, bwRule);
  const y = points.map((xi) => (bw ? gaussianKernel(values, bw, xi) : 0));
  return { x: points, y, bandwidth: bw };
}



export function qqPlotData(values, gridPoints = 100) {
  const n = values.length;
  if (n < 3) return { points: [], reference: [] };
  const sorted = [...values].sort((a, b) => a - b);

  const points = [];
  for (let i = 0; i < gridPoints; i += 1) {
    const q = (i + 0.5) / gridPoints;
    const sample = quantile(sorted, q);
    points.push({ theoretical: normalPpf(q), sample });
  }

  const { min, max } = minMax(points.map((p) => p.theoretical));
  const refSlope =
    (quantile(sorted, 0.75) - quantile(sorted, 0.25)) / (normalPpf(0.75) - normalPpf(0.25));
  const refIntercept = quantile(sorted, 0.5) - refSlope * normalPpf(0.5);
  const reference = [
    { theoretical: min, sample: refIntercept + refSlope * min },
    { theoretical: max, sample: refIntercept + refSlope * max },
  ];

  return { points, reference };
}

export function rollingStats(values, window) {
  const out = [];
  for (let i = 0; i < values.length; i += 1) {
    if (i + 1 < window) continue;
    const slice = values.slice(i - window + 1, i + 1);
    const sigma = std(slice);
    out.push({
      mean: mean(slice),
      volatility: sigma * Math.sqrt(252),
    });
  }
  return out;
}

export function correlationMatrix(seriesByTicker) {
  const tickers = Object.keys(seriesByTicker);
  const matrix = [];
  const valuesByTicker = {};
  for (const t of tickers) valuesByTicker[t] = seriesByTicker[t];

  for (const a of tickers) {
    const row = { ticker: a, values: [] };
    for (const b of tickers) {
      row.values.push(pearsonCorrelation(valuesByTicker[a], valuesByTicker[b]));
    }
    matrix.push(row);
  }
  return { tickers, matrix };
}

export function cumulativeReturns(returns) {
  const cum = [1];
  for (let i = 0; i < returns.length; i += 1) {
    cum.push(cum[cum.length - 1] * Math.exp(returns[i]));
  }
  return cum;
}

export function cumulativeReturnPct(returns) {
  const cum = cumulativeReturns(returns);
  return (cum[cum.length - 1] - 1) * 100;
}

export function drawdownCurve(returns) {
  const cum = cumulativeReturns(returns);
  const peak = [cum[0]];
  const dd = [0];
  for (let i = 1; i < cum.length; i += 1) {
    peak.push(Math.max(peak[i - 1], cum[i]));
    dd.push(peak[i] > 0 ? (cum[i] - peak[i]) / peak[i] : 0);
  }
  return dd;
}

export function maxDrawdown(returns) {
  const dd = drawdownCurve(returns);
  let min = 0;
  for (const v of dd) {
    if (v < min) min = v;
  }
  return min * 100;
}

export function downsideDeviation(returns, riskFreeDaily = 0) {
  const down = returns.filter((r) => r < riskFreeDaily).map((r) => r - riskFreeDaily);
  if (down.length === 0) return 0;
  const m = mean(down);
  return Math.sqrt(down.reduce((s, v) => s + (v - m) ** 2, 0) / down.length);
}

export function sortinoRatio(returns, riskFreeDaily = 0, periodsPerYear = 252) {
  const annReturn = mean(returns) * periodsPerYear;
  const dd = downsideDeviation(returns, riskFreeDaily);
  const annDownside = dd * Math.sqrt(periodsPerYear);
  return annDownside === 0 ? 0 : annReturn / annDownside;
}

export function beta(portfolioReturns, benchmarkReturns) {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;
  const rp = portfolioReturns.slice(0, n);
  const rb = benchmarkReturns.slice(0, n);
  const mp = mean(rp);
  const mb = mean(rb);
  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i += 1) {
    cov += (rp[i] - mp) * (rb[i] - mb);
    varB += (rb[i] - mb) ** 2;
  }
  return varB === 0 ? 0 : cov / varB;
}

export function rollingSharpe(returns, window, riskFreeDaily = 0, periodsPerYear = 252) {
  const out = [];
  for (let i = 0; i < returns.length; i += 1) {
    if (i + 1 < window) continue;
    const slice = returns.slice(i - window + 1, i + 1);
    const m = mean(slice);
    const s = std(slice);
    const annReturn = m * periodsPerYear;
    const annVol = s * Math.sqrt(periodsPerYear);
    out.push({
      date: null,
      sharpe: annVol === 0 ? 0 : (annReturn - riskFreeDaily * periodsPerYear) / annVol,
    });
  }
  return out;
}

export function contributionToVolatility(returnsByTicker, window) {
  const tickers = Object.keys(returnsByTicker);
  const n = Math.min(...tickers.map((t) => returnsByTicker[t].length));
  if (n < window + 1) return [];

  const weights = {};
  for (const t of tickers) weights[t] = 1 / tickers.length;

  const results = [];
  for (let i = 0; i <= n - window - 1; i += 1) {
    const date = null;
    const sliceReturns = {};
    for (const t of tickers) {
      sliceReturns[t] = returnsByTicker[t].slice(i, i + window);
    }

    const portSlice = [];
    for (let j = 0; j < window; j += 1) {
      let r = 0;
      for (const t of tickers) {
        r += weights[t] * (sliceReturns[t][j] || 0);
      }
      portSlice.push(r);
    }
    const portVol = std(portSlice) * Math.sqrt(252);

    const contributions = {};
    for (const t of tickers) {
      const mcr = pearsonCorrelation(sliceReturns[t], portSlice) * (std(sliceReturns[t]) * Math.sqrt(252)) / (portVol || 1);
      contributions[t] = weights[t] * mcr;
    }
    results.push({ date, contributions });
  }
  return results;
}
