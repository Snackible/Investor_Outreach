"use client";

import { useEffect, useRef, useState } from "react";

const THEMES = [
  { id: "purple", label: "Purple & magenta", colors: ["#3b0a78", "#e6007e", "#00b3e6", "#ffd100"] },
  { id: "blue", label: "Blue & orange", colors: ["#0b3b8c", "#f26522", "#2ec4b6", "#ffc72c"] },
  { id: "green", label: "Green & rose", colors: ["#0b5d3b", "#e0245e", "#3fb6ff", "#f5e663"] },
  { id: "red", label: "Red & amber", colors: ["#8e0e25", "#ff8a00", "#3da5ff", "#ffd100"] },
] as const;
const MODES = [
  { id: "system", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

function save(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("purple");
  const [mode, setMode] = useState("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "purple");
    setMode(document.documentElement.dataset.mode ?? "system");
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const pickTheme = (id: string) => {
    setTheme(id);
    document.documentElement.dataset.theme = id;
    save("hub_theme", id);
  };
  const pickMode = (id: string) => {
    setMode(id);
    document.documentElement.dataset.mode = id;
    save("hub_mode", id);
  };
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme" ref={ref}>
      <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        <span className="swatch" aria-hidden>
          {current.colors.slice(0, 2).map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        Theme
      </button>
      {open && (
        <div className="theme-panel" role="dialog" aria-label="Theme">
          <h3>Mode</h3>
          <div className="seg">
            {MODES.map((m) => (
              <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => pickMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <h3>Colours</h3>
          <div className="themes">
            {THEMES.map((t) => (
              <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => pickTheme(t.id)}>
                <span className="swatch" aria-hidden>
                  {t.colors.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
