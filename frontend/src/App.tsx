import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Shell } from "@/components/layout/Shell"
import { OverviewPage } from "@/pages/OverviewPage"
import { FunnelPage } from "@/pages/FunnelPage"
import { SegmentsPage } from "@/pages/SegmentsPage"
import { ModelsPage } from "@/pages/ModelsPage"
import { RecommenderPage } from "@/pages/RecommenderPage"
import { LiveStreamPage } from "@/pages/LiveStreamPage"
import { PerformancePage } from "@/pages/PerformancePage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/funnel" element={<FunnelPage />} />
            <Route path="/segments" element={<SegmentsPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/recommender" element={<RecommenderPage />} />
            <Route path="/stream" element={<LiveStreamPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
