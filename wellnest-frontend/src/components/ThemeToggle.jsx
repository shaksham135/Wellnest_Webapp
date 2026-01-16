import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle-btn"
      onClick={() =>
        setTheme((prev) => (prev === "dark" ? "light" : "dark"))
      }
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <FiSun /> : <FiMoon />}
    </button>
  );
};

export default ThemeToggle;
