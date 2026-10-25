import { useState, useEffect } from "react"

/**
 * useCountUp hook that smoothly animates any numeric value from 0 to target
 * using cubic easing over a crisp duration.
 */
export function useCountUp(target: number | undefined | null, duration: number = 600): number {
  const [current, setCurrent] = useState<number>(() => target ?? 0)

  useEffect(() => {
    if (target === undefined || target === null || isNaN(target)) {
      setCurrent(0)
      return
    }

    const steps = 30
    const stepDuration = Math.max(16, Math.floor(duration / steps))
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = Math.min(1, currentStep / steps)
      // Cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const nextVal = target * easeProgress

      if (progress >= 1) {
        setCurrent(target)
        clearInterval(timer)
      } else {
        setCurrent(nextVal)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [target, duration])

  return current
}
