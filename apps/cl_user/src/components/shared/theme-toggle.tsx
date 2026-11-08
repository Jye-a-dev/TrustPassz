"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Đang tải giao diện"
        disabled
        className="size-9 rounded-xl border border-subtle bg-surface text-muted cursor-not-allowed"
      >
        <Sun className="size-4 opacity-40" />
      </Button>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Chuyển sang chế độ ${isDark ? "sáng" : "tối"}`}
      className="relative size-9 rounded-xl border border-subtle bg-surface text-secondary hover:text-primary hover:border-strong hover:bg-input-bg transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-brand-pink/50"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100 text-cyan-400" />
      <span className="sr-only">Chuyển đổi giao diện sáng/tối</span>
    </Button>
  );
}
