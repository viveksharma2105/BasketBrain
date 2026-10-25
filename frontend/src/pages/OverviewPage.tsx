import React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Users,
  Eye,
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatNumber, formatPercent } from "@/lib/utils"
import { useCountUp } from "@/hooks/useCountUp"

function AnimatedKpiValue({
  value,
  isPercent = false
}: {
  value: number | undefined
  isPercent?: boolean
}) {
  const animated = useCountUp(value, 1100)
  if (value === undefined || value === null) return <span>-</span>
  return <span>{isPercent ? formatPercent(animated) : formatNumber(Math.round(animated))}</span>
}

export function OverviewPage() {
  const { data: overview, isLoading: loadingOverview, error: errorOverview, refetch: refetchOverview } = useQuery({
    queryKey: ["overview"],
    queryFn: api.getOverview
  })

  const { data: funnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ["funnel"],
    queryFn: api.getFunnel
  })

  const { data: topItems, isLoading: loadingTopItems } = useQuery({
    queryKey: ["topItems", "views"],
    queryFn: () => api.getTopItems("views", 5)
  })

  const { data: hourTrends } = useQuery({
    queryKey: ["trends", "hour"],
    queryFn: () => api.getTrends("hour")
  })

  if (errorOverview) {
    return (
      <Card className="border-red-900/50 bg-red-950/20 p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-red-200">Unable to load Overview Metrics</h3>
        <p className="text-sm text-zinc-400 mt-1 mb-4">Make sure the FastAPI backend is running or toggle Demo Data.</p>
        <Button onClick={() => refetchOverview()} variant="outline" size="sm">
          Retry Request
        </Button>
      </Card>
    )
  }

  // Mini sparkline data derived from hourly trends
  const sparkData = hourTrends?.slice(0, 12).map((t) => ({ val: t.views })) || [
    { val: 20 }, { val: 45 }, { val: 32 }, { val: 78 }, { val: 65 }, { val: 89 }, { val: 110 }
  ]

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Project Mission Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/40 via-zinc-900/90 to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-xl shadow-black/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Sparkles className="h-3.5 w-3.5" />
            Big Data E-Commerce Intelligence
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
            BasketBrain Customer Analytics & Recommendation
          </h2>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-normal">
            BasketBrain models high-velocity e-commerce clickstream behavior across 2.75M interactions to uncover funnel drop-offs, segment shoppers, and mitigate cart abandonment. It delivers sub-second collaborative recommendations and real-time streaming alerts powered by Apache Spark, Hadoop, and Google Cloud Dataproc.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link to="/funnel">
              <Button size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-md shadow-emerald-950/50 hover:shadow-emerald-500/20 transition-all">
                Explore Behavioral Funnel <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/stream">
              <Button size="sm" variant="outline" className="gap-2 border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                View Live Telemetry
              </Button>
            </Link>
          </div>
        </div>
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid with cascading entrance animations */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Total Events */}
        <Card className="cascade-enter-1 p-5 flex flex-col justify-between hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Events</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          {loadingOverview ? (
            <Skeleton className="h-8 w-20 mt-3" />
          ) : (
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-zinc-100">
                <AnimatedKpiValue value={overview?.total_events} />
              </div>
              <div className="h-9 w-full mt-2">
                <ResponsiveContainer width="100%" height={36}>
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id="eventSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke="#10b981"
                      fill="url(#eventSpark)"
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* 2. Unique Visitors */}
        <Card className="cascade-enter-2 p-5 flex flex-col justify-between hover:border-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Visitors</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          {loadingOverview ? (
            <Skeleton className="h-8 w-20 mt-3" />
          ) : (
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-zinc-100">
                <AnimatedKpiValue value={overview?.visitors} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">Unique anonymous shoppers</p>
            </div>
          )}
        </Card>

        {/* 3. Items Catalog */}
        <Card className="cascade-enter-3 p-5 flex flex-col justify-between hover:border-purple-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Catalog Items</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          {loadingOverview ? (
            <Skeleton className="h-8 w-20 mt-3" />
          ) : (
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-zinc-100">
                <AnimatedKpiValue value={overview?.items} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">Active products in events</p>
            </div>
          )}
        </Card>

        {/* 4. Derived Sessions */}
        <Card className="cascade-enter-4 p-5 flex flex-col justify-between hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Sessions</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          {loadingOverview ? (
            <Skeleton className="h-8 w-20 mt-3" />
          ) : (
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-zinc-100">
                <AnimatedKpiValue value={overview?.sessions} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">30-min window lag</p>
            </div>
          )}
        </Card>

        {/* 5. Overall Conversion Rate */}
        <Card className="cascade-enter-5 p-5 flex flex-col justify-between border-emerald-900/30 hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Conversion Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          {loadingOverview ? (
            <Skeleton className="h-8 w-20 mt-3" />
          ) : (
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-emerald-400">
                <AnimatedKpiValue value={overview?.conversion_rate} isPercent={true} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">View-to-purchase ratio</p>
            </div>
          )}
        </Card>

        {/* 6. Cart Abandonment Rate */}
        <Card className="cascade-enter-6 p-5 flex flex-col justify-between border-amber-900/30 hover:border-amber-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Abandonment</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          {loadingOverview ? (
            <Skeleton className="h-8 w-20 mt-3" />
          ) : (
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-amber-400">
                <AnimatedKpiValue value={overview?.cart_abandonment_rate} isPercent={true} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">Cart without checkout</p>
            </div>
          )}
        </Card>
      </div>


      {/* Mid Section: Funnel Preview & Top 5 Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Funnel Progression Preview (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">E-Commerce Funnel Preview</CardTitle>
              <CardDescription className="text-xs">
                Progression across View, Add-to-Cart, and Purchase stages
              </CardDescription>
            </div>
            <Link to="/funnel">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-emerald-400">
                Full Details <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingFunnel ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-5">
                {funnel?.stages.map((stage, idx) => {
                  const maxCount = funnel.stages[0].count || 1
                  const pct = Math.max(3, (stage.count / maxCount) * 100)
                  const colors = [
                    "from-emerald-500 to-teal-400",
                    "from-indigo-500 to-blue-400",
                    "from-purple-500 to-pink-500"
                  ]
                  const labels = ["Product Views", "Added to Cart", "Completed Purchases"]
                  return (
                    <div key={stage.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200 capitalize">
                          {labels[idx] || stage.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400">
                            {formatNumber(stage.count)}
                          </span>
                          {idx > 0 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 text-emerald-400 border-emerald-500/20">
                              {formatPercent(stage.rate_from_previous)} step
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-3.5 w-full rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-zinc-800">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[idx]} transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Top 5 Items Widget (5 cols) */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Top Trending Products</CardTitle>
              <CardDescription className="text-xs">
                Highest view volume items in catalog
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-zinc-400 border-zinc-800 text-[10px]">
              Catalog Top 5
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingTopItems ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {topItems?.map((item, idx) => (
                  <div key={item.itemid} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">
                          Item #{item.itemid}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Category ID: {item.categoryid}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-emerald-400">
                        {formatNumber(item.count)}
                      </div>
                      <div className="text-[10px] text-zinc-500">interactions</div>
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
