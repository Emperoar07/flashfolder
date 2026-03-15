"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    const t = stored ?? "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light / dark mode"
      title="Toggle light / dark mode"
      className="theme-toggle"
    >
      <span className="theme-toggle__bg-icon theme-toggle__bg-icon--moon">☽</span>
      <span className="theme-toggle__bg-icon theme-toggle__bg-icon--sun">☀</span>
      <span className="theme-toggle__thumb">
        {theme === "dark" ? "☽" : "☀"}
      </span>
    </button>
  );
}
