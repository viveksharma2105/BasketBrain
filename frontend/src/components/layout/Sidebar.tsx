import React from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Filter,
  Users,
  Sparkles,
  ShoppingBag,
  Radio,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const navItems: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Funnel & Behavior", href: "/funnel", icon: Filter },
  { name: "Visitor Segments", href: "/segments", icon: Users },
  { name: "Predictions & Models", href: "/models", icon: Sparkles },
  { name: "Recommender Demo", href: "/recommender", icon: ShoppingBag },
  { name: "Live Stream", href: "/stream", icon: Radio, badge: "LIVE" },
  { name: "Performance & Arch", href: "/performance", icon: Activity }
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (val: boolean) => void
  onItemClick?: () => void
}

export function Sidebar({ collapsed, setCollapsed, onItemClick }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ease-in-out z-30 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-zinc-800/80 justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-zinc-950 shadow-md shadow-emerald-950/40">
              <Layers className="h-5 w-5 font-bold" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-zinc-100 flex items-center gap-1.5">
                BasketBrain
                <span className="text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  SPARK
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">Big Data Analytics</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-zinc-950 shadow-md">
            <Layers className="h-5 w-5 font-bold" />
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                isActive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)] translate-x-1"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200 hover:translate-x-0.5",
                collapsed && "justify-center px-2 hover:translate-x-0"
              )
            }
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-115",
                    isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="hidden md:flex p-3 border-t border-zinc-800/80 justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
