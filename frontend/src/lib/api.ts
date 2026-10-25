import {
  OverviewResponse,
  FunnelResponse,
  TrendPoint,
  TrendsGranularity,
  TopItem,
  CategoryItem,
  Segment,
  ModelsResponse,
  RecommendationResponse,
  SampleVisitor,
  BenchmarksResponse
} from "../types"
import {
  mockOverview,
  mockFunnel,
  mockTrends,
  mockTopItems,
  mockCategories,
  mockSegments,
  mockModels,
  mockRecommendations,
  mockSampleVisitors,
  mockBenchmarks
} from "./mock"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
export const USE_MOCK_ENV = import.meta.env.VITE_USE_MOCK === "true"

export let isUsingMockData = USE_MOCK_ENV

export function setMockMode(active: boolean) {
  isUsingMockData = active
}

async function fetchFromApi<T>(endpoint: string, fallbackData: T): Promise<T> {
  if (isUsingMockData) {
    return fallbackData
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" }
    })
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`)
    }
    return (await res.json()) as T
  } catch (err) {
    console.warn(`[BasketBrain API] Fallback to mock data for ${endpoint}:`, err)
    // Seamless fallback to ensure dashboard never renders a broken blank screen
    isUsingMockData = true
    return fallbackData
  }
}

export const api = {
  getOverview: (): Promise<OverviewResponse> =>
    fetchFromApi<OverviewResponse>("/api/overview", mockOverview),

  getFunnel: (): Promise<FunnelResponse> =>
    fetchFromApi<FunnelResponse>("/api/funnel", mockFunnel),

  getTrends: (granularity: TrendsGranularity = "hour"): Promise<TrendPoint[]> =>
    fetchFromApi<TrendPoint[]>(
      `/api/trends?granularity=${granularity}`,
      mockTrends[granularity] || mockTrends.hour
    ),

  getTopItems: (metric: "views" | "carts" | "purchases" = "views", limit = 10): Promise<TopItem[]> =>
    fetchFromApi<TopItem[]>(
      `/api/top-items?metric=${metric}&limit=${limit}`,
      (mockTopItems[metric] || mockTopItems.views).slice(0, limit)
    ),

  getCategories: (limit = 10): Promise<CategoryItem[]> =>
    fetchFromApi<CategoryItem[]>(
      `/api/categories?limit=${limit}`,
      mockCategories.slice(0, limit)
    ),

  getSegments: (): Promise<Segment[]> =>
    fetchFromApi<Segment[]>("/api/segments", mockSegments),

  getModels: (): Promise<ModelsResponse> =>
    fetchFromApi<ModelsResponse>("/api/models", mockModels),

  getRecommendations: (visitorId: string | number, k = 10): Promise<RecommendationResponse> => {
    const key = String(visitorId)
    const fallback = mockRecommendations[key] || {
      visitor_id: visitorId,
      segment: "New Visitor",
      strategy: "popularity",
      items: mockRecommendations.default.items.slice(0, k)
    }
    return fetchFromApi<RecommendationResponse>(
      `/api/recommend/${visitorId}?k=${k}`,
      fallback
    )
  },

  getSampleVisitors: (): Promise<SampleVisitor[]> =>
    fetchFromApi<SampleVisitor[]>("/api/sample-visitors", mockSampleVisitors),

  getBenchmarks: (): Promise<BenchmarksResponse> =>
    fetchFromApi<BenchmarksResponse>("/api/benchmarks", mockBenchmarks),

  getStreamUrl: (): string => `${API_BASE_URL}/api/stream/live`
}
