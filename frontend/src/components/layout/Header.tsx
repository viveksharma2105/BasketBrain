import React from "react"
import { useLocation } from "react-router-dom"
import { Sun, Moon, Database, Menu, Radio } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { isUsingMockData, setMockMode } from "@/lib/api"
import { navItems } from "./Sidebar"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [mockActive, setMockActive] = React.useState(isUsingMockData)

  const currentNav = navItems.find((item) => item.href === location.pathname) || {
    name: "Dashboard"
  }

  const handleToggleMock = () => {
    const newState = !mockActive
    setMockActive(newState)
    setMockMode(newState)
    // Reload data queries cleanly
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-4 md:px-6 backdrop-blur-xl">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden h-9 w-9 text-zinc-400"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h1 className="text-base md:text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
            {currentNav.name}
            {location.pathname === "/stream" && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live SSE
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right: Data Source Pill, Theme Switcher */}
      <div className="flex items-center gap-3">
        {/* Data Source Badge with interactive toggle */}
        <button
          onClick={handleToggleMock}
          title="Click to toggle between Live API and Demo Mock Data"
          className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs transition-all duration-200 hover:border-emerald-500/40 hover:bg-zinc-900 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95"
        >
          {mockActive ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-medium text-amber-300">Demo Data</span>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">
                (Click for Live)
              </span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-400">Live API</span>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">
                (:8000)
              </span>
            </>
          )}
        </button>

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-100 border-zinc-800 bg-zinc-900/60 transition-all duration-200 hover:border-zinc-700 active:scale-90"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-90 hover:scale-110" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-300 rotate-0 hover:-rotate-45 hover:scale-110" />
          )}
        </Button>
      </div>
    </header>
  )
}
