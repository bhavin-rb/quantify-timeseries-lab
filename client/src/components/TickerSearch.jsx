import { useState, useRef, useEffect } from "react";
import COMPANIES from "../data/companies.js";
import { apiGet } from "../api.js";

const MAX_SUGGESTIONS = 8;
const DEBOUNCE_MS = 250;

function searchLocal(query) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const matches = [];
  for (const [ticker, name] of Object.entries(COMPANIES)) {
    if (ticker.includes(q) || name.toUpperCase().includes(q)) {
      matches.push({ ticker, name });
      if (matches.length >= MAX_SUGGESTIONS) break;
    }
  }
  return matches;
}

function getSegment(value) {
  const parts = value.split(",");
  return parts[parts.length - 1].trim();
}

function replaceSegment(value, ticker) {
  const parts = value.split(",");
  parts[parts.length - 1] = ticker;
  return parts.join(",") + ",";
}

export default function TickerSearch({ value, onChange, placeholder, maxLength }) {
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  const runDynamicSearch = (seg) => {
    clearTimeout(timerRef.current);
    if (!seg || seg.trim().length < 2) return;
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError(false);
      setSuggestions([]);
      try {
        const list = await apiGet(`/search?query=${encodeURIComponent(seg)}`);
        setSuggestions(Array.isArray(list) ? list : []);
      } catch {
        setSearchError(true);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const updateSuggestions = (seg) => {
    clearTimeout(timerRef.current);
    const local = searchLocal(seg);
    if (local.length) {
      setLoading(false);
      setSearchError(false);
      setSuggestions(local);
    } else {
      runDynamicSearch(seg);
    }
  };

  const handleChange = (e) => {
    const v = e.target.value.toUpperCase();
    onChange(v);
    updateSuggestions(getSegment(v));
    setFocused(true);
  };

  const handleSelect = (ticker) => {
    clearTimeout(timerRef.current);
    onChange(replaceSegment(value, ticker));
    setSuggestions([]);
    setFocused(false);
  };

  const showDropdown = focused && (suggestions.length > 0 || loading || searchError);

  return (
    <div className="ticker-search" ref={wrapRef}>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true);
          const seg = getSegment(value);
          if (seg) updateSuggestions(seg);
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
      />
      {showDropdown && (
        <ul className="ticker-suggestions">
          {loading && (
            <li className="ticker-suggestion-item ticker-suggestion-hint">
              Searching Tiingo…
            </li>
          )}
          {searchError && (
            <li className="ticker-suggestion-item ticker-suggestion-hint">
              Search unavailable — try typing the ticker symbol directly.
            </li>
          )}
          {!loading &&
            !searchError &&
            suggestions.map((s) => (
              <li
                key={s.ticker}
                className="ticker-suggestion-item"
                onMouseDown={() => handleSelect(s.ticker)}
              >
                <span className="ticker-suggestion-symbol">{s.ticker}</span>
                <span className="ticker-suggestion-name">{s.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}