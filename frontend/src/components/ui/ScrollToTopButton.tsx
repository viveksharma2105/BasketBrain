import React, { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-zinc-950/90 text-emerald-400 backdrop-blur-md shadow-xl shadow-black/60 hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 animate-in fade-in-0 zoom-in-90 group"
      title="Scroll to top"
    >
      <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
    </button>
  )
}
