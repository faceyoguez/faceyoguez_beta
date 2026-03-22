"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`p-2 rounded-xl flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-foreground/50 border border-outline-variant/10 shadow-sm opacity-50 ${collapsed ? '' : 'gap-3 w-full justify-start px-3.5'}`}>
        <Sun className="h-[18px] w-[18px]" />
        {!collapsed && <span className="text-[13px] font-semibold flex-1">Theme</span>}
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`p-2 rounded-xl flex items-center justify-center bg-surface-container hover:bg-surface hover:text-foreground hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-outline-variant/10 group ${
        isDark ? 'text-primary' : 'text-foreground/70'
      } ${collapsed ? '' : 'gap-3 w-full justify-start px-3.5'}`}
      aria-label="Toggle theme"
    >
      <div className="relative h-[18px] w-[18px]">
        {isDark ? (
           <Moon className="absolute inset-0 h-[18px] w-[18px] transition-transform duration-300" />
        ) : (
           <Sun className="absolute inset-0 h-[18px] w-[18px] transition-transform duration-300" />
        )}
      </div>
      {!collapsed && (
        <>
          <span className="text-[13px] font-semibold flex-1 text-left group-hover:text-foreground">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          {/* Visual indicator pill */}
          <div className="w-8 h-4 rounded-full bg-surface-container-high relative shadow-inner ring-1 ring-inset ring-outline-variant/20">
            <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-foreground shadow-sm transition-all duration-300 ease-spring ${isDark ? 'translate-x-4 bg-primary' : 'translate-x-1'}`} />
          </div>
        </>
      )}
    </button>
  )
}
