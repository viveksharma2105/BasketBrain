import React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts"
import {
  Activity,
  Zap,
  Server,
  Database,
  Cloud,
  Layers,
  ArrowRight,
  BookOpen,
  Info,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"

export function PerformancePage() {
  const { data: benchmarks, isLoading } = useQuery({
    queryKey: ["benchmarks"],
    queryFn: api.getBenchmarks
  })

  // Format Hive vs Spark data
  const hiveVsSparkData = React.useMemo(() => {
    if (!benchmarks?.hive_vs_spark) return []
    return benchmarks.hive_vs_spark.map((b) => ({
      name: b.query,
      "Spark SQL (s)": b.spark_seconds,
      "Hive on MapReduce (s)": b.hive_seconds,
      speedup: b.speedup
    }))
  }, [benchmarks])

  // Format Scalability data: group by data scale (1x, 10x, 50x) with worker count lines
  const scalabilityChartData = React.useMemo(() => {
    if (!benchmarks?.scalability) return []
    // Unique data scales: 1x, 10x, 50x
    const scales = ["1x", "10x", "50x"]
    return scales.map((scale) => {
      const w1 = benchmarks.scalability.find((s) => s.data_scale === scale && s.workers === 1)
      const w2 = benchmarks.scalability.find((s) => s.data_scale === scale && s.workers === 2)
      const w4 = benchmarks.scalability.find((s) => s.data_scale === scale && s.workers === 4)
      return {
        scale: scale === "1x" ? "1x (141K)" : scale === "10x" ? "10x (1.4M)" : "50x (7.0M)",
        "1 Worker (s)": w1?.seconds || 0,
        "2 Workers (s)": w2?.seconds || 0,
        "4 Workers (s)": w4?.seconds || 0
      }
    })
  }, [benchmarks])

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          Big Data Performance & Distributed Architecture
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Benchmarking execution runtimes across distributed engines, horizontal worker scalability curves, and system architecture.
        </p>
      </div>

      {/* Row 1: Hive vs Spark SQL & Scalability Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hive vs Spark SQL Bar Chart (6 cols) */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Spark SQL vs Apache Hive Runtimes
                </CardTitle>
                <CardDescription className="text-xs">
                  Execution latency (seconds) across Aggregation, Multi-Join, and Window lag
                </CardDescription>
              </div>
              <Badge variant="default" className="text-xs px-2 py-0.5">
                Up to 26.6x Speedup
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hiveVsSparkData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
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
                    <Bar dataKey="Spark SQL (s)" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="Hive on MapReduce (s)" fill="#64748b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scalability Chart (6 cols) */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-indigo-400" />
                  Horizontal Scalability Curves
                </CardTitle>
                <CardDescription className="text-xs">
                  Runtime across worker counts on 1x, 10x, and 50x synthetic scale-up
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                Synthetic Scale-Up
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scalabilityChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="scale" stroke="#71717a" fontSize={11} />
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
                    <Line type="monotone" dataKey="1 Worker (s)" stroke="#f43f5e" strokeWidth={2} isAnimationActive={false} />
                    <Line type="monotone" dataKey="2 Workers (s)" stroke="#6366f1" strokeWidth={2} isAnimationActive={false} />
                    <Line type="monotone" dataKey="4 Workers (s)" stroke="#10b981" strokeWidth={2.5} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Architecture Diagram (Built with plain React/Tailwind boxes and arrows) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            End-to-End Big Data Architecture Flow
          </CardTitle>
          <CardDescription className="text-xs">
            Distributed storage, batch compute, machine learning, real-time streaming, and API layers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-x-auto text-xs">
            {/* Box 1: Storage Layer */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-950/40 transition-all duration-300">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Database className="h-4 w-4" /> 1. Ingestion & Storage
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Raw events (2.75M CSV) stored in HDFS / GCS. Preprocessed into columnar Parquet partitioned by <code className="text-emerald-300">event_date</code>.
              </p>
              <div className="pt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">HDFS</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">Parquet</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">GCS</Badge>
              </div>
            </div>

            {/* Box 2: Batch Compute */}
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-2 hover:-translate-y-1 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-950/40 transition-all duration-300">
              <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                <Server className="h-4 w-4" /> 2. Batch ETL
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Pig Latin validation, Hadoop MapReduce (MRJob), and PySpark 30-min window lag sessionization.
              </p>
              <div className="pt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">Apache Pig</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">MRJob</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">PySpark</Badge>
              </div>
            </div>

            {/* Box 3: Analytics & ML */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-2 hover:-translate-y-1 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-950/40 transition-all duration-300">
              <div className="flex items-center gap-1.5 font-bold text-purple-400">
                <Zap className="h-4 w-4" /> 3. Analytics & MLlib
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                KMeans visitor RFM segmentation, leakage-free GBT purchase intent prediction, and implicit ALS matrix factorization.
              </p>
              <div className="pt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">Spark SQL</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">KMeans</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">ALS</Badge>
              </div>
            </div>

            {/* Box 4: Streaming */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-950/40 transition-all duration-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Activity className="h-4 w-4" /> 4. Real-Time Stream
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Structured Streaming engine with watermarking tracking sliding events/min, live items, and cart-abandonment alerts.
              </p>
              <div className="pt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">Structured Streaming</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">Watermark</Badge>
              </div>
            </div>

            {/* Box 5: Serving & Cloud */}
            <div className="rounded-lg border border-teal-500/30 bg-teal-950/20 p-3.5 space-y-2 hover:-translate-y-1 hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-950/40 transition-all duration-300">
              <div className="flex items-center gap-1.5 font-bold text-teal-400">
                <Cloud className="h-4 w-4" /> 5. Serving & UI
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                FastAPI high-speed REST & SSE endpoints delivering sub-second predictions to React 18 dashboard.
              </p>
              <div className="pt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">Dataproc</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">FastAPI</Badge>
                <Badge variant="outline" className="text-[10px] bg-zinc-950/80">React 18</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Dataset Citations & Limitations */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-zinc-100">Dataset Citations & Project Constraints</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-300">
          <div className="space-y-2">
            <span className="font-semibold text-zinc-200 block text-sm">Academic Literature & Citations:</span>
            <ul className="space-y-1.5 list-disc pl-4 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Retailrocket Dataset:</strong> 2.75M anonymized e-commerce clickstream interactions collected over 4.5 months (Kaggle, 2016).
              </li>
              <li>
                <strong className="text-zinc-200">Hu, Koren & Volinsky (2008):</strong> <em>Collaborative Filtering for Implicit Feedback Datasets</em> (ICDM '08). Foundation for ALS implicit matrix factorization.
              </li>
              <li>
                <strong className="text-zinc-200">Apache Spark & Hive:</strong> Zaharia et al. (2010), Armbrust et al. (2015, 2018), Thusoo et al. (2009).
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-zinc-200 block text-sm">Dataset Limitations Respected:</span>
            <ul className="space-y-1.5 list-disc pl-4 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Hashed Properties:</strong> Item properties are hashed integers/floats without explicit prices, brand names, or textual titles.
              </li>
              <li>
                <strong className="text-zinc-200">No Session Identifiers:</strong> Sessions are deterministically derived via a 30-minute inactivity window lag over visitor events.
              </li>
              <li>
                <strong className="text-zinc-200">Imbalanced Transactions:</strong> Completed purchases constitute under 1% (0.81%) of total events, addressed using inverse class weighting and PR-AUC.
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
