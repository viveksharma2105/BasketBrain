import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts"
import {
  Radio,
  Pause,
  Play,
  Flame,
  AlertTriangle,
  Zap,
  Activity,
  CheckCircle2,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLiveStream } from "@/hooks/useLiveStream"
import { formatNumber } from "@/lib/utils"

export function LiveStreamPage() {
  const { isConnected, isPaused, togglePause, latestEvent, rollingRates, alerts } = useLiveStream()

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Live Stream Header & Status Control */}
      <Card className="p-6 border-emerald-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-600"></span>
                )}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                Structured Streaming Live Telemetry
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Spark Structured Streaming micro-batches connected via EventSource SSE to <code className="text-emerald-400">/api/stream/live</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator pill */}
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-mono gap-1.5 ${
                isConnected
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : isPaused
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400"
              }`}
            >
              {isConnected ? "CONNECTED (SSE)" : isPaused ? "PAUSED" : "RECONNECTING..."}
            </Badge>

            {/* Pause / Resume Button */}
            <Button
              size="sm"
              variant={isPaused ? "default" : "outline"}
              onClick={togglePause}
              className="gap-1.5 text-xs"
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Resume Stream
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause Stream
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Real-Time Rolling Throughput Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Real-Time Event Velocity (Events / Min)
            </CardTitle>
            <CardDescription className="text-xs">
              Continuous rolling 60-point sliding window aggregation
            </CardDescription>
          </div>
          <div className="font-mono text-sm font-bold text-emerald-400">
            {formatNumber(latestEvent?.events_per_min || 0)} <span className="text-xs text-zinc-400">events/min</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rollingRates} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="liveRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={formatNumber} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "0.5rem",
                    color: "#fafafa"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Events / Min"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#liveRateGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Live Active Items & Real-Time Alerts Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Top Items in Rolling Window (5 cols) */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                Live Active Products
              </CardTitle>
              <CardDescription className="text-xs">
                Products interacting in current micro-batch
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-zinc-800 text-[10px] text-zinc-400">
              Live Window
            </Badge>
          </CardHeader>
          <CardContent>
            {(!latestEvent?.top_items || latestEvent.top_items.length === 0) ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Waiting for streaming events...</p>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {latestEvent.top_items.map((item, idx) => (
                  <div key={item.itemid} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">Item #{item.itemid}</div>
                        <div className="text-[10px] text-zinc-500">Live interaction burst</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-500/20">
                      {item.count} hits
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Abandonment & Retention Alerts Feed (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Cart-Without-Purchase Alerts Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time trigger identifying shoppers who added to cart without purchase
              </CardDescription>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {alerts.length} alerts logged
            </span>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                No cart abandonment alerts in the current window.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {alerts.map((alert, i) => (
                  <div
                    key={`${alert.visitor_id}-${alert.item_id}-${i}`}
                    className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 flex items-start gap-3 transition-all duration-300 hover:bg-rose-500/10 hover:border-rose-500/40 hover:-translate-y-0.5 animate-in fade-in-0 slide-in-from-top-2 duration-300"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-200">
                          Visitor #{alert.visitor_id}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
