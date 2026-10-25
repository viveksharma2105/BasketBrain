import React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts"
import { Users, Crown, ShoppingCart, Eye, Compass, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatNumber, formatPercent } from "@/lib/utils"

const SEGMENT_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#a855f7"]
const ICONS = [Crown, ShoppingCart, Eye, Compass]

export function SegmentsPage() {
  const { data: segments, isLoading } = useQuery({
    queryKey: ["segments"],
    queryFn: api.getSegments
  })

  // Format data for Donut Chart
  const donutData = React.useMemo(() => {
    if (!segments) return []
    return segments.map((s, idx) => ({
      name: s.label,
      value: s.size,
      share: s.share,
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
    }))
  }, [segments])

  // Format data for Recency & Frequency comparison bar chart
  const barData = React.useMemo(() => {
    if (!segments) return []
    return segments.map((s) => ({
      name: s.label.replace("High-Intent ", "").replace("One-Time ", ""),
      frequency: s.avg_frequency,
      recency: s.avg_recency,
      score: s.avg_score
    }))
  }, [segments])

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          Visitor Behavioral Segmentation (KMeans Clustering)
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          KMeans clustering with StandardScaler and RFM-style feature engineering (Recency, Frequency, Monetary/Engagement Score, Cart Ratio). Evaluated via Silhouette analysis (optimal k=4).
        </p>
      </div>

      {/* Visual Analytics Row: Donut Chart + Comparative Bar Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Donut Chart: Segment Share Distribution (5 cols) */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">Audience Distribution</CardTitle>
            <CardDescription className="text-xs">
              Proportion of total visitors in each behavioral cohort
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [
                        `${formatNumber(value)} (${formatPercent(props.payload.share)})`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        borderRadius: "0.5rem",
                        color: "#fafafa"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Color Legend List */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800/80">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate text-zinc-300 font-medium">{d.name}</span>
                  <span className="text-zinc-500 font-mono ml-auto">{formatPercent(d.share)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Bar Chart: Avg Recency & Frequency (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base">RFM Behavioral Comparison</CardTitle>
            <CardDescription className="text-xs">
              Average session frequency and recency latency across segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        borderRadius: "0.5rem",
                        color: "#fafafa"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="frequency" name="Avg Sessions (Frequency)" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="recency" name="Avg Days Since Visit (Recency)" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segment Cards Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 w-full" />)
          : segments?.map((seg, idx) => {
              const IconComp = ICONS[idx % ICONS.length]
              const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length]

              return (
                <Card key={seg.id} className="p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-950 font-bold shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-zinc-100">{seg.label}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs border-zinc-700 bg-zinc-900/60 font-mono">
                            {formatNumber(seg.size)} visitors
                          </Badge>
                          <span className="text-xs text-zinc-500 font-mono">
                            ({formatPercent(seg.share)} share)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-4 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60">
                    {seg.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Recency</span>
                      <span className="text-sm font-bold text-zinc-200 font-mono">{seg.avg_recency}d</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Frequency</span>
                      <span className="text-sm font-bold text-zinc-200 font-mono">{seg.avg_frequency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Engagement</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{seg.avg_score}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
