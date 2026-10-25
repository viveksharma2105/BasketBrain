import { useState, useEffect, useRef } from "react"
import { StreamEvent, StreamAlert } from "../types"
import { api } from "../lib/api"

export interface RollingRatePoint {
  time: string
  rate: number
}

export function useLiveStream() {
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [latestEvent, setLatestEvent] = useState<StreamEvent | null>(null)
  const [rollingRates, setRollingRates] = useState<RollingRatePoint[]>([])
  const [alerts, setAlerts] = useState<StreamAlert[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (isPaused) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
      return
    }

    const streamUrl = api.getStreamUrl()
    let es: EventSource | null = null

    try {
      es = new EventSource(streamUrl)
      eventSourceRef.current = es

      es.onopen = () => {
        setIsConnected(true)
      }

      es.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data)
          setLatestEvent(data)

          const timeLabel = new Date(data.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })

          setRollingRates((prev) => {
            const next = [...prev, { time: timeLabel, rate: data.events_per_min }]
            return next.length > 60 ? next.slice(next.length - 60) : next
          })

          if (data.alerts && data.alerts.length > 0) {
            setAlerts((prev) => {
              const combined = [...data.alerts, ...prev]
              // Deduplicate by message + timestamp
              const seen = new Set<string>()
              const unique: StreamAlert[] = []
              for (const a of combined) {
                const key = `${a.visitor_id}-${a.item_id}-${a.timestamp}`
                if (!seen.has(key)) {
                  seen.add(key)
                  unique.push(a)
                }
              }
              return unique.slice(0, 30) // retain last 30 alerts
            })
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err)
        }
      }

      es.onerror = () => {
        setIsConnected(false)
        // Automatic reconnection is handled natively by EventSource
      }
    } catch (err) {
      console.warn("Failed to connect EventSource:", err)
      setIsConnected(false)
    }

    return () => {
      if (es) {
        es.close()
      }
    }
  }, [isPaused])

  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  return {
    isConnected,
    isPaused,
    togglePause,
    latestEvent,
    rollingRates,
    alerts
  }
}
