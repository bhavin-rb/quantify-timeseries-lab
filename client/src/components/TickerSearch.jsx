import { useState, useRef, useEffect } from "react";
import COMPANIES from "../data/companies.js";

const MAX_SUGGESTIONS = 8;

function search(query) {
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
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value.toUpperCase();
    onChange(v);
    setSuggestions(search(getSegment(v)));
    setFocused(true);
  };

  const handleSelect = (ticker) => {
    onChange(replaceSegment(value, ticker));
    setSuggestions([]);
    setFocused(false);
  };

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div className="ticker-search" ref={wrapRef}>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => { setFocused(true); const seg = getSegment(value); if (seg) setSuggestions(search(seg)); }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
      />
      {showDropdown && (
        <ul className="ticker-suggestions">
          {suggestions.map((s) => (
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
