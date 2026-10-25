import {
  OverviewResponse,
  FunnelResponse,
  TrendPoint,
  TopItem,
  CategoryItem,
  Segment,
  ModelsResponse,
  RecommendationResponse,
  SampleVisitor,
  BenchmarksResponse,
  StreamEvent
} from "../types"

export const mockOverview: OverviewResponse = {
  total_events: 141128,
  visitors: 70580,
  items: 55412,
  sessions: 88725,
  date_range: {
    start: "2015-05-03",
    end: "2015-09-18"
  },
  conversion_rate: 0.00936,
  cart_abandonment_rate: 0.7158,
  counts: {
    views: 136111,
    carts: 3743,
    purchases: 1274
  }
}

export const mockFunnel: FunnelResponse = {
  stages: [
    { name: "views", count: 136111, rate_from_previous: 1.0 },
    { name: "addtocart", count: 3743, rate_from_previous: 0.0275 },
    { name: "transaction", count: 1274, rate_from_previous: 0.3404 }
  ],
  by_category: [
    { categoryid: 1051, parentid: 955, views: 3710, carts: 85, purchases: 29, view_to_cart_rate: 0.0229, cart_to_purchase_rate: 0.3412, overall_conversion: 0.0078 },
    { categoryid: 1691, parentid: 885, views: 3240, carts: 92, purchases: 34, view_to_cart_rate: 0.0284, cart_to_purchase_rate: 0.3696, overall_conversion: 0.0105 },
    { categoryid: 1184, parentid: 1691, views: 2890, carts: 78, purchases: 27, view_to_cart_rate: 0.0270, cart_to_purchase_rate: 0.3462, overall_conversion: 0.0093 },
    { categoryid: 387, parentid: 302, views: 2450, carts: 61, purchases: 19, view_to_cart_rate: 0.0249, cart_to_purchase_rate: 0.3115, overall_conversion: 0.0078 },
    { categoryid: 809, parentid: 169, views: 2110, carts: 53, purchases: 18, view_to_cart_rate: 0.0251, cart_to_purchase_rate: 0.3396, overall_conversion: 0.0085 },
    { categoryid: 955, parentid: 1242, views: 1890, carts: 44, purchases: 15, view_to_cart_rate: 0.0233, cart_to_purchase_rate: 0.3409, overall_conversion: 0.0079 },
    { categoryid: 570, parentid: 9, views: 1650, carts: 38, purchases: 12, view_to_cart_rate: 0.0230, cart_to_purchase_rate: 0.3158, overall_conversion: 0.0073 },
    { categoryid: 1242, parentid: 489, views: 1420, carts: 35, purchases: 11, view_to_cart_rate: 0.0246, cart_to_purchase_rate: 0.3143, overall_conversion: 0.0077 }
  ]
}

export const mockTrends: Record<string, TrendPoint[]> = {
  hour: [
    { label: "00:00", views: 6812, carts: 185, purchases: 64 },
    { label: "01:00", views: 5930, carts: 160, purchases: 52 },
    { label: "02:00", views: 4820, carts: 135, purchases: 41 },
    { label: "03:00", views: 3610, carts: 95, purchases: 30 },
    { label: "04:00", views: 2790, carts: 70, purchases: 22 },
    { label: "05:00", views: 2450, carts: 65, purchases: 20 },
    { label: "06:00", views: 2980, carts: 82, purchases: 26 },
    { label: "07:00", views: 3820, carts: 104, purchases: 35 },
    { label: "08:00", views: 4950, carts: 138, purchases: 48 },
    { label: "09:00", views: 6120, carts: 169, purchases: 58 },
    { label: "10:00", views: 7240, carts: 201, purchases: 70 },
    { label: "11:00", views: 8090, carts: 226, purchases: 79 },
    { label: "12:00", views: 8520, carts: 238, purchases: 83 },
    { label: "13:00", views: 8430, carts: 234, purchases: 81 },
    { label: "14:00", views: 8120, carts: 225, purchases: 78 },
    { label: "15:00", views: 7980, carts: 220, purchases: 76 },
    { label: "16:00", views: 7650, carts: 211, purchases: 72 },
    { label: "17:00", views: 7420, carts: 205, purchases: 70 },
    { label: "18:00", views: 7110, carts: 196, purchases: 67 },
    { label: "19:00", views: 6890, carts: 190, purchases: 65 },
    { label: "20:00", views: 6950, carts: 192, purchases: 66 },
    { label: "21:00", views: 7320, carts: 203, purchases: 71 },
    { label: "22:00", views: 7640, carts: 212, purchases: 74 },
    { label: "23:00", views: 7259, carts: 200, purchases: 66 }
  ],
  weekday: [
    { label: "Sunday", views: 18450, carts: 504, purchases: 172 },
    { label: "Monday", views: 21340, carts: 589, purchases: 202 },
    { label: "Tuesday", views: 22180, carts: 612, purchases: 210 },
    { label: "Wednesday", views: 21950, carts: 605, purchases: 206 },
    { label: "Thursday", views: 20820, carts: 574, purchases: 194 },
    { label: "Friday", views: 17890, carts: 492, purchases: 166 },
    { label: "Saturday", views: 13481, carts: 367, purchases: 124 }
  ],
  day: [
    { label: "2015-05-03", views: 820, carts: 22, purchases: 8 },
    { label: "2015-05-10", views: 980, carts: 27, purchases: 9 },
    { label: "2015-05-17", views: 1040, carts: 29, purchases: 10 },
    { label: "2015-05-24", views: 1120, carts: 31, purchases: 11 },
    { label: "2015-06-01", views: 1250, carts: 34, purchases: 12 },
    { label: "2015-06-15", views: 1380, carts: 38, purchases: 13 },
    { label: "2015-07-01", views: 1420, carts: 39, purchases: 14 },
    { label: "2015-07-15", views: 1510, carts: 42, purchases: 15 },
    { label: "2015-08-01", views: 1480, carts: 41, purchases: 14 },
    { label: "2015-08-15", views: 1620, carts: 45, purchases: 16 },
    { label: "2015-09-01", views: 1590, carts: 44, purchases: 15 },
    { label: "2015-09-15", views: 1640, carts: 46, purchases: 16 }
  ]
}

export const mockTopItems: Record<string, TopItem[]> = {
  views: [
    { itemid: 187946, categoryid: 1051, count: 179 },
    { itemid: 461686, categoryid: 1691, count: 128 },
    { itemid: 5411, categoryid: 1184, count: 125 },
    { itemid: 370653, categoryid: 387, count: 124 },
    { itemid: 111530, categoryid: 809, count: 109 },
    { itemid: 462188, categoryid: 955, count: 108 },
    { itemid: 257040, categoryid: 570, count: 105 },
    { itemid: 298009, categoryid: 1242, count: 89 },
    { itemid: 29196, categoryid: 1051, count: 81 },
    { itemid: 234255, categoryid: 1691, count: 81 }
  ],
  carts: [
    { itemid: 187946, categoryid: 1051, count: 18 },
    { itemid: 461686, categoryid: 1691, count: 14 },
    { itemid: 5411, categoryid: 1184, count: 12 },
    { itemid: 370653, categoryid: 387, count: 11 },
    { itemid: 111530, categoryid: 809, count: 10 },
    { itemid: 462188, categoryid: 955, count: 9 },
    { itemid: 257040, categoryid: 570, count: 9 },
    { itemid: 298009, categoryid: 1242, count: 8 },
    { itemid: 29196, categoryid: 1051, count: 7 },
    { itemid: 234255, categoryid: 1691, count: 7 }
  ],
  purchases: [
    { itemid: 187946, categoryid: 1051, count: 8 },
    { itemid: 461686, categoryid: 1691, count: 6 },
    { itemid: 5411, categoryid: 1184, count: 5 },
    { itemid: 370653, categoryid: 387, count: 5 },
    { itemid: 111530, categoryid: 809, count: 4 },
    { itemid: 462188, categoryid: 955, count: 4 },
    { itemid: 257040, categoryid: 570, count: 4 },
    { itemid: 298009, categoryid: 1242, count: 3 },
    { itemid: 29196, categoryid: 1051, count: 3 },
    { itemid: 234255, categoryid: 1691, count: 3 }
  ]
}

export const mockCategories: CategoryItem[] = [
  { categoryid: 1051, parentid: 955, views: 3710, carts: 85, purchases: 29, conversion: 0.78 },
  { categoryid: 1691, parentid: 885, views: 3240, carts: 92, purchases: 34, conversion: 1.05 },
  { categoryid: 1184, parentid: 1691, views: 2890, carts: 78, purchases: 27, conversion: 0.93 },
  { categoryid: 387, parentid: 302, views: 2450, carts: 61, purchases: 19, conversion: 0.78 },
  { categoryid: 809, parentid: 169, views: 2110, carts: 53, purchases: 18, conversion: 0.85 },
  { categoryid: 955, parentid: 1242, views: 1890, carts: 44, purchases: 15, conversion: 0.79 },
  { categoryid: 570, parentid: 9, views: 1650, carts: 38, purchases: 12, conversion: 0.73 },
  { categoryid: 1242, parentid: 489, views: 1420, carts: 35, purchases: 11, conversion: 0.77 },
  { categoryid: 489, parentid: 1242, views: 1280, carts: 31, purchases: 10, conversion: 0.78 },
  { categoryid: 302, parentid: 1051, views: 1150, carts: 28, purchases: 9, conversion: 0.78 }
]

export const mockSegments: Segment[] = [
  {
    id: 0,
    cluster_index: 3,
    label: "High-Intent VIP Buyers",
    size: 6,
    share: 0.0001,
    avg_recency: 49.94,
    avg_frequency: 176.33,
    avg_score: 1587.0,
    description: "High frequency shoppers with multiple carts and purchases. High lifetime value."
  },
  {
    id: 1,
    cluster_index: 2,
    label: "Cart Abandoners",
    size: 653,
    share: 0.0093,
    avg_recency: 66.39,
    avg_frequency: 1.2,
    avg_score: 9.06,
    description: "Strong purchase intent with frequent cart additions but incomplete checkout."
  },
  {
    id: 2,
    cluster_index: 0,
    label: "Active Window Shoppers",
    size: 32782,
    share: 0.4645,
    avg_recency: 103.71,
    avg_frequency: 1.18,
    avg_score: 1.89,
    description: "Regular visitors browsing multiple products and categories without adding to cart."
  },
  {
    id: 3,
    cluster_index: 1,
    label: "One-Time Casual Explorers",
    size: 37139,
    share: 0.5262,
    avg_recency: 36.6,
    avg_frequency: 1.3,
    avg_score: 2.06,
    description: "Single-session visitors with low interaction depth and higher recency latency."
  }
]

export const mockModels: ModelsResponse = {
  prediction: [
    { model: "Logistic Regression", auc_roc: 0.9517, auc_pr: 0.3058, f1: 0.9851, recall: 0.9801, precision: 0.9928 },
    { model: "Random Forest", auc_roc: 0.9495, auc_pr: 0.3435, f1: 0.9876, recall: 0.9917, precision: 0.9835 },
    { model: "Gradient Boosted Trees", auc_roc: 0.9402, auc_pr: 0.3556, f1: 0.9889, recall: 0.9916, precision: 0.9882 }
  ],
  recommender: [
    { model: "Popularity Baseline", precision_at_10: 0.0009, recall_at_10: 0.0086, map_at_10: 0.0055, coverage: 0.0002 },
    { model: "FP-Growth Association Rules", precision_at_10: 0.0009, recall_at_10: 0.0086, map_at_10: 0.0055, coverage: 0.0002 },
    { model: "ALS Matrix Factorization (Implicit)", precision_at_10: 0.0010, recall_at_10: 0.0089, map_at_10: 0.0060, coverage: 0.0030 }
  ],
  best_model: "Gradient Boosted Trees",
  feature_importance: [
    { feature: "carts_count", importance: 0.7105 },
    { feature: "views_count", importance: 0.0906 },
    { feature: "session_duration_min", importance: 0.0596 },
    { feature: "is_repeat_visitor", importance: 0.0486 },
    { feature: "hour_of_day", importance: 0.0444 },
    { feature: "unique_items", importance: 0.0202 },
    { feature: "day_of_week", importance: 0.0196 },
    { feature: "is_weekend", importance: 0.0065 }
  ]
}

export const mockSampleVisitors: SampleVisitor[] = [
  { visitor_id: 76757, segment: "High-Intent VIP Buyers", strategy: "als", label: "Visitor #76757 (VIP Buyer)" },
  { visitor_id: 638482, segment: "High-Intent VIP Buyers", strategy: "als", label: "Visitor #638482 (VIP Buyer)" },
  { visitor_id: 757355, segment: "High-Intent VIP Buyers", strategy: "als", label: "Visitor #757355 (VIP Buyer)" },
  { visitor_id: 992329, segment: "Cart Abandoners", strategy: "als", label: "Visitor #992329 (Cart Abandoner)" },
  { visitor_id: 483717, segment: "Active Window Shoppers", strategy: "als", label: "Visitor #483717 (Window Shopper)" },
  { visitor_id: 111016, segment: "One-Time Casual Explorers", strategy: "popularity", label: "Visitor #111016 (Casual Visitor)" }
]

export const mockRecommendations: Record<string, RecommendationResponse> = {
  "76757": {
    visitor_id: 76757,
    segment: "High-Intent VIP Buyers",
    strategy: "als",
    items: [
      { itemid: 187946, categoryid: 1051, score: 0.942, reason: "Collaborative match based on behavior in category 1051" },
      { itemid: 461686, categoryid: 1691, score: 0.915, reason: "Collaborative match based on behavior in category 1691" },
      { itemid: 5411, categoryid: 1184, score: 0.887, reason: "Frequently co-purchased by users in High-Intent segment" },
      { itemid: 370653, categoryid: 387, score: 0.864, reason: "Collaborative match based on behavior in category 387" },
      { itemid: 111530, categoryid: 809, score: 0.841, reason: "Trending in category 809" },
      { itemid: 462188, categoryid: 955, score: 0.812, reason: "High affinity match in latent factor space" },
      { itemid: 257040, categoryid: 570, score: 0.793, reason: "Frequently co-viewed item" },
      { itemid: 298009, categoryid: 1242, score: 0.771, reason: "Popularity in category 1242" },
      { itemid: 29196, categoryid: 1051, score: 0.755, reason: "Related to item #187946" },
      { itemid: 234255, categoryid: 1691, score: 0.732, reason: "Collaborative recommendation" }
    ]
  },
  "default": {
    visitor_id: "default",
    segment: "New Visitor",
    strategy: "popularity",
    items: [
      { itemid: 187946, categoryid: 1051, score: 1.0, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 370653, categoryid: 387, score: 0.95, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 5411, categoryid: 1184, score: 0.90, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 462188, categoryid: 955, score: 0.85, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 461686, categoryid: 1691, score: 0.80, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 257040, categoryid: 570, score: 0.75, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 111530, categoryid: 809, score: 0.70, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 298009, categoryid: 1242, score: 0.65, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 29196, categoryid: 1051, score: 0.60, reason: "Top trending item across all shoppers (Cold start fallback)" },
      { itemid: 37029, categoryid: 809, score: 0.55, reason: "Top trending item across all shoppers (Cold start fallback)" }
    ]
  }
}

export const mockBenchmarks: BenchmarksResponse = {
  hive_vs_spark: [
    { query: "Funnel Aggregation", spark_seconds: 0.855, hive_seconds: 11.75, speedup: 13.7 },
    { query: "Multi-Table Join", spark_seconds: 1.356, hive_seconds: 20.17, speedup: 14.9 },
    { query: "Window Sessionization", spark_seconds: 0.83, hive_seconds: 22.07, speedup: 26.6 }
  ],
  scalability: [
    { workers: 1, data_scale: "1x", data_rows_est: "1x (~141K rows)", seconds: 1.41 },
    { workers: 1, data_scale: "10x", data_rows_est: "10x (~1.41M rows)", seconds: 6.33 },
    { workers: 1, data_scale: "50x", data_rows_est: "50x (~7.05M rows)", seconds: 20.41 },
    { workers: 2, data_scale: "1x", data_rows_est: "1x (~141K rows)", seconds: 0.42 },
    { workers: 2, data_scale: "10x", data_rows_est: "10x (~1.41M rows)", seconds: 2.81 },
    { workers: 2, data_scale: "50x", data_rows_est: "50x (~7.05M rows)", seconds: 12.33 },
    { workers: 4, data_scale: "1x", data_rows_est: "1x (~141K rows)", seconds: 0.44 },
    { workers: 4, data_scale: "10x", data_rows_est: "10x (~1.41M rows)", seconds: 2.13 },
    { workers: 4, data_scale: "50x", data_rows_est: "50x (~7.05M rows)", seconds: 8.78 }
  ],
  note: "10x and 50x datasets generated via synthetic scale-up replication. Hive runtimes reflect Dataproc Hive-on-MR/Tez benchmarks."
}
