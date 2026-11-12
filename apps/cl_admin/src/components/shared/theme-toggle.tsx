"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Đang đồng bộ giao diện"
        disabled
        className="size-10 min-h-10 min-w-10 rounded-lg border-border-subtle bg-surface text-text-muted opacity-60"
      >
        <Sun className="size-4.5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
      document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={
        isDark
          ? "Chuyển sang giao diện sáng (Light Mode)"
          : "Chuyển sang giao diện tối (Dark Mode)"
      }
      title={
        isDark
          ? "Đang ở Dark Mode (Bấm để chuyển sang Light Mode)"
          : "Đang ở Light Mode (Bấm để chuyển sang Dark Mode)"
      }
      className="size-10 min-h-10 min-w-10 rounded-lg border-border-subtle bg-surface hover:bg-muted text-text-primary transition-colors cursor-pointer"
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  );
}
