import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend
} from "recharts"
import { Sparkles, Trophy, HelpCircle, ShieldCheck, Activity, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/lib/api"
import { formatPercent } from "@/lib/utils"

export function ModelsPage() {
  const [activeTab, setActiveTab] = useState<string>("prediction")

  const { data: models, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: api.getModels
  })

  // Format prediction metrics for grouped bar chart
  const predictionChartData = React.useMemo(() => {
    if (!models?.prediction) return []
    return models.prediction.map((m) => ({
      name: m.model.replace("Logistic Regression", "LR").replace("Random Forest", "RF").replace("Gradient Boosted Trees", "GBT"),
      "AUC-ROC": m.auc_roc,
      "AUC-PR": m.auc_pr,
      F1: m.f1
    }))
  }, [models])

  // Format recommender metrics for grouped bar chart
  const recommenderChartData = React.useMemo(() => {
    if (!models?.recommender) return []
    return models.recommender.map((m) => ({
      name: m.model.replace(" Baseline", "").replace(" Matrix Factorization (Implicit)", "").replace(" Association Rules", ""),
      "P@10": m.precision_at_10,
      "Recall@10": m.recall_at_10,
      "MAP@10": m.map_at_10,
      Coverage: m.coverage
    }))
  }, [models])

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in-50 duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Machine Learning Models & Evaluation
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Evaluated on strict leakage-free features and time-based train/test splits in Spark MLlib.
            </p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="prediction">Purchase Intent Prediction</TabsTrigger>
              <TabsTrigger value="recommender">Collaborative Recommender</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab 1: Purchase Prediction */}
        {activeTab === "prediction" && (
          <div className="space-y-6">
            {/* Top Cards: Best Model Highlight & Leakage Protection Notice */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-zinc-950 md:col-span-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Optimal Classifier Selected
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100">
                    {models?.best_model || "Gradient Boosted Trees (GBT)"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                    Selected for superior Precision-Recall AUC (0.3556) on the severe 0.79% class imbalance, optimized via inverse class weighting.
                  </p>
                </div>
                <Badge variant="default" className="text-xs px-3 py-1 font-semibold shrink-0">
                  Best AUC-PR
                </Badge>
              </Card>

              <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-zinc-300">Data Leakage Guard</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Strictly excludes <code className="text-emerald-400 bg-zinc-900 px-1 rounded">transactionid</code> and all events occurring after the first purchase timestamp.
                </p>
                <div className="mt-2 text-[11px] text-zinc-500 font-mono">
                  Inverse Class Weight: w = 126.05
                </div>
              </Card>
            </div>

            {/* Models Table & Grouped Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-7">
                <CardHeader>
                  <CardTitle className="text-base">Classifier Benchmark Table</CardTitle>
                  <CardDescription className="text-xs">
                    Comparison across Area Under ROC, Area Under PR, and Weighted F1 / Precision
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model Architecture</TableHead>
                          <TableHead className="text-right">
                            <span className="inline-flex items-center gap-1">
                              AUC-ROC
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-zinc-500" />
                                </TooltipTrigger>
                                <TooltipContent>Area under Receiver Operating Characteristic curve.</TooltipContent>
                              </Tooltip>
                            </span>
                          </TableHead>
                          <TableHead className="text-right">
                            <span className="inline-flex items-center gap-1">
                              AUC-PR
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-zinc-500" />
                                </TooltipTrigger>
                                <TooltipContent>Area under Precision-Recall curve. Crucial for severe class imbalance under 1%.</TooltipContent>
                              </Tooltip>
                            </span>
                          </TableHead>
                          <TableHead className="text-right">F1 Score</TableHead>
                          <TableHead className="text-right">Recall</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models?.prediction.map((m) => {
                          const isBest = m.model === models.best_model
                          return (
                            <TableRow key={m.model} className={isBest ? "bg-emerald-950/20" : ""}>
                              <TableCell className="font-medium text-xs flex items-center gap-2">
                                {m.model}
                                {isBest && (
                                  <Badge variant="default" className="text-[10px] py-0 px-1.5">
                                    Best
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">{m.auc_roc.toFixed(4)}</TableCell>
                              <TableCell className="text-right font-mono text-xs font-bold text-emerald-400">
                                {m.auc_pr.toFixed(4)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">{m.f1.toFixed(4)}</TableCell>
                              <TableCell className="text-right font-mono text-xs">{m.recall.toFixed(4)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Grouped Bar Chart (5 cols) */}
              <Card className="lg:col-span-5">
                <CardHeader>
                  <CardTitle className="text-base">Metric Comparison</CardTitle>
                  <CardDescription className="text-xs">
                    AUC-ROC vs AUC-PR across models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={predictionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} domain={[0, 1.0]} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#09090b",
                            borderColor: "#27272a",
                            borderRadius: "0.5rem",
                            color: "#fafafa"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="AUC-ROC" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="AUC-PR" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Importance Horizontal Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Importances (GBT / RF)</CardTitle>
                <CardDescription className="text-xs">
                  Contribution of each pre-purchase signal to conversion prediction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {models?.feature_importance.map((f) => (
                    <div key={f.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-zinc-300">{f.feature}</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {(f.importance * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.max(2, f.importance * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Recommender Models */}
        {activeTab === "recommender" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-zinc-950 md:col-span-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Collaborative Engine
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100">
                    ALS Matrix Factorization (Implicit Feedback)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                    Hu, Koren & Volinsky (2008) formulation with confidence rating mapping (view=1, cart=3, buy=5), non-negative factor constraints, and time-based split.
                  </p>
                </div>
                <Badge variant="default" className="text-xs px-3 py-1 font-semibold shrink-0">
                  15x Catalog Coverage
                </Badge>
              </Card>

              <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-300">Time-Based Split</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Evaluated on 5,000 test users interacting after 85th percentile timestamp. Cold-start visitors automatically fallback to Popularity baseline.
                </p>
                <div className="mt-2 text-[11px] text-zinc-500 font-mono">
                  Rank: 10 | RegParam: 0.05 | Alpha: 10.0
                </div>
              </Card>
            </div>

            {/* Recommender Table & Grouped Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-7">
                <CardHeader>
                  <CardTitle className="text-base">Recommender Benchmark Table</CardTitle>
                  <CardDescription className="text-xs">
                    Comparison across Top-10 Precision, Recall, Mean Average Precision, and Catalog Coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Strategy</TableHead>
                        <TableHead className="text-right">
                          <span className="inline-flex items-center gap-1">
                            Precision@10
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-zinc-500" />
                              </TooltipTrigger>
                              <TooltipContent>Fraction of top-10 recommended items that user actually interacted with in test set.</TooltipContent>
                            </Tooltip>
                          </span>
                        </TableHead>
                        <TableHead className="text-right">
                          <span className="inline-flex items-center gap-1">
                            Recall@10
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-zinc-500" />
                              </TooltipTrigger>
                              <TooltipContent>Fraction of user's ground truth items successfully captured in top-10 recommendations.</TooltipContent>
                            </Tooltip>
                          </span>
                        </TableHead>
                        <TableHead className="text-right">
                          <span className="inline-flex items-center gap-1">
                            MAP@10
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-zinc-500" />
                              </TooltipTrigger>
                              <TooltipContent>Mean Average Precision @ 10: Ranking-aware evaluation penalizing relevant items placed lower.</TooltipContent>
                            </Tooltip>
                          </span>
                        </TableHead>
                        <TableHead className="text-right">
                          <span className="inline-flex items-center gap-1">
                            Coverage
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-zinc-500" />
                              </TooltipTrigger>
                              <TooltipContent>Fraction of all unique catalog items recommended across all users.</TooltipContent>
                            </Tooltip>
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models?.recommender.map((m) => {
                        const isALS = m.model.includes("ALS")
                        return (
                          <TableRow key={m.model} className={isALS ? "bg-emerald-950/20" : ""}>
                            <TableCell className="font-medium text-xs flex items-center gap-2">
                              {m.model}
                              {isALS && (
                                <Badge variant="default" className="text-[10px] py-0 px-1.5">
                                  Primary
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">{m.precision_at_10.toFixed(4)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{m.recall_at_10.toFixed(4)}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold text-emerald-400">
                              {m.map_at_10.toFixed(4)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-purple-400">
                              {(m.coverage * 100).toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recommender Grouped Bar Chart */}
              <Card className="lg:col-span-5">
                <CardHeader>
                  <CardTitle className="text-base">Catalog Diversity & MAP@10</CardTitle>
                  <CardDescription className="text-xs">
                    ALS substantially outperforms popularity in catalog tail exploration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recommenderChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#09090b",
                            borderColor: "#27272a",
                            borderRadius: "0.5rem",
                            color: "#fafafa"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="MAP@10" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="Coverage" fill="#a855f7" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
