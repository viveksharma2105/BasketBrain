import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts"
import { Filter, ArrowDown, TrendingUp, Layers, ArrowUpDown, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatNumber, formatPercent } from "@/lib/utils"
import { TrendsGranularity } from "@/types"

export function FunnelPage() {
  const [granularity, setGranularity] = useState<TrendsGranularity>("hour")
  const [topMetric, setTopMetric] = useState<"views" | "carts" | "purchases">("views")
  const [sortField, setSortField] = useState<"views" | "conversion">("views")
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const { data: funnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ["funnel"],
    queryFn: api.getFunnel
  })

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ["trends", granularity],
    queryFn: () => api.getTrends(granularity)
  })

  const { data: topItems, isLoading: loadingTopItems } = useQuery({
    queryKey: ["topItems", topMetric],
    queryFn: () => api.getTopItems(topMetric, 10)
  })

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(15)
  })

  const sortedCategories = React.useMemo(() => {
    if (!categories) return []
    return [...categories].sort((a, b) => {
      if (sortField === "conversion") return b.conversion - a.conversion
      return b.views - a.views
    })
  }, [categories, sortField])

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. Horizontal Funnel Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-400" />
                End-to-End Behavioral Conversion Funnel
              </CardTitle>
              <CardDescription>
                Stages progression from product discovery to final purchase checkout
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Calculated across 88,725 derived sessions
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingFunnel ? (
            <div className="space-y-6 py-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {funnel?.stages.map((stage, idx) => {
                const maxVal = funnel.stages[0].count || 1
                const pctOfMax = (stage.count / maxVal) * 100
                const dropoff = idx > 0 ? (1 - stage.rate_from_previous) * 100 : 0
                const titles = [
                  "1. Product Views (Browse Stage)",
                  "2. Add-To-Cart (High-Intent Stage)",
                  "3. Transactions (Completed Checkout)"
                ]
                const colors = ["#10b981", "#6366f1", "#a855f7"]

                return (
                  <div key={stage.name} className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <span className="text-sm font-bold text-zinc-200">{titles[idx]}</span>
                        <p className="text-xs text-zinc-400">Total interactions: {formatNumber(stage.count)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {idx > 0 && (
                          <div className="text-right">
                            <span className="text-xs text-red-400 font-semibold">
                              -{dropoff.toFixed(1)}% drop-off
                            </span>
                            <p className="text-[10px] text-zinc-500">from previous</p>
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className="font-mono text-sm py-1 border-zinc-700 bg-zinc-950 text-emerald-400"
                        >
                          {idx === 0 ? "100%" : `${formatPercent(stage.rate_from_previous)}`}
                        </Badge>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-800 p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: mounted ? `${Math.max(2, pctOfMax)}%` : "0%",
                          backgroundColor: colors[idx]
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Temporal Activity Trends Chart */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              Clickstream Activity Trends
            </CardTitle>
            <CardDescription>
              Volume fluctuations across hours of the day, days of the week, or dates
            </CardDescription>
          </div>
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as TrendsGranularity)}>
            <TabsList>
              <TabsTrigger value="hour">Hour of Day</TabsTrigger>
              <TabsTrigger value="weekday">Day of Week</TabsTrigger>
              <TabsTrigger value="day">Date Range</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loadingTrends ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCarts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={formatNumber} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#27272a",
                      borderRadius: "0.5rem",
                      color: "#fafafa"
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Product Views"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="carts"
                    name="Cart Additions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCarts)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Bottom Grid: Top Items & Category Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Top Items by Select Metric (5 cols) */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Top Products</CardTitle>
              <CardDescription className="text-xs">Ranked by volume</CardDescription>
            </div>
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
              {(["views", "carts", "purchases"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTopMetric(m)}
                  className={`capitalize px-2.5 py-1 rounded-md transition-colors ${
                    topMetric === m ? "bg-zinc-800 text-emerald-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loadingTopItems ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto pr-1 divide-y divide-zinc-800/80">
                {topItems?.map((item, idx) => (
                  <div key={item.itemid} className="py-2.5 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">Item #{item.itemid}</div>
                        <div className="text-[11px] text-zinc-500">Category {item.categoryid}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                      {formatNumber(item.count)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Table (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Product Category Performance</CardTitle>
              <CardDescription className="text-xs">
                Views, carts, purchases, and conversion rate by taxonomy category
              </CardDescription>
            </div>
            <button
              onClick={() => setSortField(sortField === "views" ? "conversion" : "views")}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-md px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-800 transition-colors"
            >
              <ArrowUpDown className="h-3 w-3" />
              Sort: {sortField === "views" ? "By Views" : "By Conversion"}
            </button>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto pr-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Carts</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead className="w-32">Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCategories.map((cat) => (
                      <TableRow key={cat.categoryid} className="hover:bg-zinc-800/40 transition-colors">
                        <TableCell className="font-medium text-xs">
                          <div className="font-semibold text-zinc-200">Category #{cat.categoryid}</div>
                          <div className="text-[10px] text-zinc-500">Parent: {cat.parentid}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-zinc-300">{formatNumber(cat.views)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-indigo-400">{formatNumber(cat.carts)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-purple-400">{formatNumber(cat.purchases)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-emerald-400 font-bold">{cat.conversion.toFixed(2)}%</span>
                            </div>
                            <Progress value={Math.min(100, cat.conversion * 50)} className="h-1.5" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
