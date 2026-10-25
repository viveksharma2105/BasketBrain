export interface OverviewResponse {
  total_events: number
  visitors: number
  items: number
  sessions: number
  date_range: {
    start: string
    end: string
  }
  conversion_rate: number
  cart_abandonment_rate: number
  counts?: {
    views: number
    carts: number
    purchases: number
  }
}

export interface FunnelStage {
  name: string
  count: number
  rate_from_previous: number
}

export interface CategoryFunnel {
  categoryid: number
  parentid: number
  views: number
  carts: number
  purchases: number
  view_to_cart_rate: number
  cart_to_purchase_rate: number
  overall_conversion: number
}

export interface FunnelResponse {
  stages: FunnelStage[]
  by_category: CategoryFunnel[]
}

export interface TrendPoint {
  label: string
  views: number
  carts: number
  purchases: number
}

export type TrendsGranularity = "hour" | "day" | "weekday"

export interface TopItem {
  itemid: number
  categoryid: number
  count: number
}

export interface CategoryItem {
  categoryid: number
  parentid: number
  views: number
  carts: number
  purchases: number
  conversion: number
}

export interface Segment {
  id: number
  cluster_index?: number
  label: string
  size: number
  share: number
  avg_recency: number
  avg_frequency: number
  avg_score: number
  description: string
}

export interface PredictionModelMetric {
  model: string
  auc_roc: number
  auc_pr: number
  f1: number
  recall: number
  precision: number
}

export interface RecommenderModelMetric {
  model: string
  precision_at_10: number
  recall_at_10: number
  map_at_10: number
  coverage: number
}

export interface FeatureImportance {
  feature: string
  importance: number
}

export interface ModelsResponse {
  prediction: PredictionModelMetric[]
  recommender: RecommenderModelMetric[]
  best_model: string
  feature_importance: FeatureImportance[]
}

export interface RecommendedItem {
  itemid: number
  categoryid: number
  score: number
  reason: string
}

export interface RecommendationResponse {
  visitor_id: string | number
  segment: string
  strategy: "als" | "popularity"
  items: RecommendedItem[]
}

export interface SampleVisitor {
  visitor_id: number
  segment: string
  strategy: string
  label: string
}

export interface HiveVsSparkBenchmark {
  query: string
  spark_seconds: number
  hive_seconds: number
  speedup: number
}

export interface ScalabilityBenchmark {
  workers: number
  data_scale: string
  data_rows_est?: string
  seconds: number
}

export interface BenchmarksResponse {
  hive_vs_spark: HiveVsSparkBenchmark[]
  scalability: ScalabilityBenchmark[]
  note?: string
}

export interface StreamAlert {
  visitor_id: number
  item_id: number
  alert_type: string
  severity: "high" | "medium" | "low"
  timestamp: string
  message: string
}

export interface StreamEvent {
  ts: string
  events_per_min: number
  recent_event_counts?: {
    view: number
    addtocart: number
    transaction: number
  }
  top_items: Array<{
    itemid: number
    count: number
  }>
  alerts: StreamAlert[]
  live_recommendations?: Array<{
    visitor_id: number
    strategy: string
    recommended_items: number[]
  }>
}
