# AGNET.md

##  Introduction
**TimeSeries Lab** is a web application for preparing, cleaning, and exploring financial time series data from the **Tiingo API**.  
The goal is to provide a **modern, intuitive React.js frontend** with a **Node.js/Express backend** that supports exploratory data analysis: descriptive statistics, return diagnostics, rolling volatility, and portfolio correlation analysis.

The project should remain focused on a practical MVP, avoiding unnecessary complexity.

---

##  Updated Approach
- **Frontend:** React.js (or Next.js for SSR if needed)
- **Backend:** Node.js + Express REST API
- **Data source:** Tiingo API (unchanged)
- **Analysis:** Implement core EDA logic in backend (Node.js with math/stat libraries) or via Python microservice if needed
- **Deployment:** Local dev → cloud hosting (Vercel)

---

##  Architecture
- **Frontend (React.js/Next.js)**  
  - Interactive dashboard UI  
  - Charts via libraries like Chart.js, D3.js, or Recharts  
  - CSV export via client-side download  
  **Hero section with image + animated headline**  
  - **About section with image + fade-in animation**  
  - **Dark mode as default theme** (toggle available for light mode)  
  - **Smooth parallax scrolling** for hero and about sections  
  - **Micro-animations** (hover effects, transitions on charts, button highlights)  
  - **Responsive design** for desktop and mobile  

- **Backend (Node.js/Express)**  
  - REST endpoints for Tiingo data ingestion  
  - Cleaning & preprocessing logic  
  - EDA metrics computation (returns, volatility, correlations)  

- **Configuration**  
  - Tiingo API key stored in `.env` file  
  - Opencode API Key stored in `.env` file
  - Secure handling of API requests  

---

##  Implementation Phases

### Phase 1: Project Setup
- Initialize Node.js + React.js project structure
- Add dependency management (`npm`/`yarn`)
- Configure `.env` for Tiingo API key
- Basic Express server + React frontend scaffold

 **Success criteria checklist**
- Backend server runs locally (`npm start`)  
- React frontend runs locally (`npm run dev`)  
- API key is securely loaded from `.env`  
- Health-check endpoint (`/api/health`) returns status 200  

---

### Phase 2: Data Ingestion & Cleaning
- Backend fetches historical price data from Tiingo
- Standardize schema: `Date`, `Close`, `Volume`
- Handle missing values & duplicates
- Expose cleaned dataset via REST endpoint
- Frontend preview table + CSV download

**Success criteria checklist**
- API endpoint `/api/data?ticker=AAPL` returns cleaned JSON  
- Schema always includes `Date, Close, Volume`  
- No duplicate dates in output  
- Frontend displays raw + cleaned preview tables  
- CSV download produces valid file  

---

### Phase 3: Single Ticker EDA
- Compute log returns
- Summary statistics (mean, volatility, skewness, kurtosis)
- Histogram + KDE chart
- Q-Q plot for normality
- Rolling mean & volatility chart

 **Success criteria checklist**
- API endpoint `/api/eda?ticker=AAPL` returns metrics JSON  
- Summary includes: Mean, Volatility, Skewness, Kurtosis, Observations  
- Histogram/KDE chart renders in frontend  
- Q-Q plot renders correctly  
- Rolling diagnostics update when user changes window size  

---

### Phase 4: Portfolio EDA
- Load multiple tickers
- Merge into portfolio dataset
- Compute log returns + correlation metrics
- Correlation heatmap
- Rolling correlations + portfolio volatility chart

 **Success criteria checklist**
- API endpoint `/api/portfolio?tickers=AAPL,MSFT` returns merged dataset  
- Correlation matrix JSON available  
- Heatmap renders correctly in frontend  
- Rolling portfolio volatility chart updates dynamically  

---

### Phase 5: Dashboard & Export
- Build React dashboard with tabs:  
  - Single ticker analysis  
  - Portfolio analysis  
- Display charts + summary tables in clean layout  
- CSV export for cleaned data  

 **Success criteria checklist**
- Dashboard navigation works without reload  
- All charts render responsively  
- CSV export button downloads correct dataset  
- UI passes basic usability test (minimalist, intuitive)  

---

### Phase 6: Verification & Refinement
- Test with sample tickers (AAPL, MSFT, TSLA)  
- Verify charts, summaries, and exports  
- Refine UI/UX for simplicity and usability  
- Optimize backend for performance  

## Phase 7 — Portfolio Insights Expansion

### Objectives
Enhance the portfolio dashboard with deeper risk and performance analytics, while maintaining consistent UI/UX across single‑ticker and portfolio views.

### New Metrics (Info Tabs)
- **Max Drawdown** — worst peak‑to‑trough decline.
- **Cumulative Return** — total portfolio growth over the selected period.
- **Sortino Ratio** — risk‑adjusted return penalizing only downside volatility.
- **Beta vs Benchmark** — sensitivity of portfolio returns to a chosen market index.

### New Charts
- **Drawdown Curve** — visualize portfolio declines and recovery periods.
- **Rolling Sharpe Ratio** — track changes in risk‑adjusted performance over time.
- **Contribution to Volatility** — show which tickers drive portfolio risk the most.
- **Cumulative Return Curve** — growth‑of‑$1 visualization for intuitive performance tracking.

### UI/UX Enhancements
- Ensure **axis labels** are clear, padded, and consistently styled.
- Maintain **uniform spacing** between info boxes and chart enclosures.
- Improve **mobile view fitting** so portfolio charts align with single‑ticker charts.
- Apply **consistent font scaling and legend placement** across all charts.

### Implementation Notes
- Add these features without altering existing functionality.
- Keep new metrics and charts toggleable to avoid clutter for casual users.
- Ensure styling matches the established dashboard theme.

## Phase 8 — Mode-Specific Insights Tabs

### Scope
For each analysis mode (Single Ticker, Portfolio Overview, Advanced Portfolio Insights), add a dedicated **Insights tab**.  
- Each Insights tab contains interpretive summaries only for the metrics in that mode.  
- Summaries should be concise (1–2 sentences per metric).  
- Use plain language with light technical jargon.  
- Keep styling consistent: muted secondary text, small font, aligned with Quantify branding.  
- This ensures users can view both raw analytics and explanations **within the same mode**, without switching back and forth.

---

### Glossary + Layman Summaries

#### Single Ticker Insights
- **Mean Daily Return (%)** → Average daily gain/loss. Positive means growth, negative means decline.  
- **Annual Volatility (%)** → How much the stock price swings in a year. Higher = riskier.  
- **Skewness** → Shows if returns lean more to gains or losses. Negative skew = more downside risk.  
- **Excess Kurtosis** → Measures “fat tails.” High kurtosis = more extreme ups/downs than normal.  
- **Total Return (%)** → Overall growth over the period.  
- **Return OBS** → Number of return observations used in the analysis.  
- **Max/Min/Last Close** → Obvious values, no explanation needed.  

#### Portfolio Overview Insights
- **Mean Daily Return (%)** → Average daily portfolio gain/loss.  
- **Portfolio Annual Volatility (%)** → How much the portfolio fluctuates yearly. Lower volatility = smoother ride.  
- **Sharpe Ratio (Daily)** → Risk‑adjusted return. >1 is strong, <1 means returns don’t justify the risk.  

#### Advanced Portfolio Insights
- **Max Drawdown (%)** → Worst peak‑to‑trough loss. Shows how much you could lose in a downturn.  
- **Cumulative Return (%)** → Total portfolio growth over time. Positive = wealth increase.  
- **Sortino Ratio** → Like Sharpe but focuses only on downside risk. >1 is good, <1 means weak risk‑adjusted returns.  
- **Beta vs SPY** → Sensitivity to the market. ~1 = moves with market, <1 = less volatile, >1 = more volatile.  

---

### Agent Instruction
Refer to AGENTS.md and Implement Phase 8:  
- Add a dedicated **Insights tab** for each mode (Single Ticker, Portfolio Overview, Advanced Portfolio Insights).  
- Populate each tab with interpretive summaries relevant to that mode only.  
- Keep explanations concise and layman‑friendly.  
- Use muted secondary text styling to avoid clutter.  
- Ensure consistency across all modes.
---

## Phase 9 - Risk Management Tab (Hybrid Stop-Loss & Target)

- Add a new tab labeled "Risk Management" in the dashboard.
  - **Navigation logic**:
    - At initial launch, dashboard shows only *Single Ticker* and *Portfolio* tabs (unchanged).
    - When *Single Ticker* is active → Tabs: Single Ticker + Risk Management + Portfolio.
    - When *Portfolio* is active → Tabs: Single Ticker + Portfolio + Advanced Insights + Risk Management.
    - Reset button clears everything (unchanged).
- Inside this tab:
  - **Hybrid input fields per ticker**:
    - Stop-Loss: auto-calculated default (e.g., 10% below current price or 1× volatility), user can override with % or absolute price.
    - Target: auto-calculated default (e.g., 20% above current price or 2× stop-loss distance), user can override with % or absolute price.
    - Toggle option to switch between % and absolute price entry.
  - **Per‑ticker summary cards**:
    - One card per ticker (e.g., 4 tickers → 4 cards).
    - Each card shows Stop-Loss 🔴, Target 🟢, and Risk/Reward ratio.
    - Desktop: cards arranged in grid (2×2 for 4 tickers).
    - Mobile: cards stack vertically for readability.
  - **Chart overlays**:
    - Red horizontal line for Stop-Loss.
    - Green horizontal line for Target.
    - Annotations: "Sell if price ≤ Stop-Loss" / "Take profit if price ≥ Target."
  - **Responsive design**:
    - Desktop: cards + charts with overlays.
    - Mobile: compact stacked cards view showing Stop-Loss 🔴, Target 🟢, and Risk/Reward ratio + Charts with overlays.
    
- Default dashboard (Phases 1–8) remains unchanged, ensuring seamless UI/UX.
- Do not change any other functionality.

## Phase 10 – Collapsible Explanation Tab (Plain-Language Guidance)

- Add a collapsible "Explanation" section inside the Risk Management tab.
- **Dynamic values**:
  - Use live values for current price, stop-loss, target, and risk/reward ratio.
  - Explanations update automatically when user overrides inputs or toggles %/$.
- **Plain-language guidance** (non-technical, user-friendly):
  - Explain what the stop-loss means: "If price falls to $X or lower, you should sell to avoid bigger losses."
  - Explain what the target means: "If price rises to $Y or higher, you can take profit and lock in gains."
  - Explain the risk/reward ratio in simple terms: "For every $1 you risk, you aim to make $Z."
  - Provide hold/sell logic: "Hold as long as price stays between stop-loss and target."
  - Include short-sell explanation: "For short selling, reverse the logic — profit if price falls below stop-loss, cut losses if it rises above target."
- **UI behavior**:
  - Collapsible by default, expandable on click/tap.
  - Place explanation directly under each per-ticker card and chart.
  - Ensure responsive design: collapsible section works smoothly on both desktop and mobile.
- **Constraints**:
  - Do not introduce technical jargon; keep explanations simple and intuitive.
  - Do not alter existing Risk Management functionality (Phase 9).

---
 **Success criteria checklist**
- End-to-end flow works: data fetch → clean → analyze → visualize → export  
- No console errors in frontend or backend