import React, { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton"

export function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="relative flex min-h-screen bg-[#090b10] text-foreground antialiased selection:bg-emerald-500/25 selection:text-emerald-200">
      {/* Ambient background lighting and grid with gentle living animation */}
      <div className="fixed inset-0 bg-ambient-grid pointer-events-none -z-10 opacity-60" />
      <div className="fixed top-[-120px] right-[-50px] w-[550px] h-[550px] rounded-full bg-emerald-500/[0.07] blur-[130px] pointer-events-none -z-10 animate-orb-slow" />
      <div className="fixed bottom-[-120px] left-[250px] w-[650px] h-[650px] rounded-full bg-indigo-500/[0.05] blur-[150px] pointer-events-none -z-10 animate-orb-reverse" />

      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 z-30">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-zinc-950 border-r border-zinc-800">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar
            collapsed={false}
            setCollapsed={() => {}}
            onItemClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Smooth Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}

