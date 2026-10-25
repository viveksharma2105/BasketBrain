# BasketBrain Frontend UI

Modern, dark-themed Big Data e-commerce analytics and real-time recommendation dashboard for BasketBrain.

Built with **React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Recharts + TanStack Query + Lucide Icons**.

---

## 1. Quick Start

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173`

### Production Build
```bash
npm run build
```

---

## 2. Environment Variables

Create or adjust `.env` or `.env.local` inside the `frontend/` folder:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8000` | Address of the BasketBrain FastAPI backend server. |
| `VITE_USE_MOCK` | `false` | When set to `true`, forces offline demo mock data mode. |

---

## 3. Switching Between Live API and Demo Mock Data

The frontend supports two ways to toggle between real backend data and demo mock data:

1. **Interactive Toggle**: In the top navigation bar, click the **Data Source Pill** ("Live API" vs "Demo Data") to switch modes instantly without restarting the application.
2. **Environment Variable**: Set `VITE_USE_MOCK=true` to default to demo mode before running `npm run dev`.
3. **Automatic Fallback**: If the FastAPI backend is not running, the dashboard automatically falls back to precomputed real mock metrics to avoid blank error screens.

---

## 4. Key Pages
- **Overview (`/`)**: KPI summary cards (141.1K events, 70.6K visitors, 0.94% conversion), sparklines, funnel preview, and top products.
- **Funnel & Behavior (`/funnel`)**: Horizontal view -> cart -> purchase drop-off funnel, temporal trends (hour/weekday/date), and sortable category table.
- **Visitor Segments (`/segments`)**: Donut chart of KMeans clusters (*High-Intent VIP Buyers*, *Cart Abandoners*, *Active Window Shoppers*, *One-Time Casual Explorers*) with RFM stats.
- **Predictions & Models (`/models`)**: Tabs for purchase intent prediction (GBT/RF/LR) and collaborative filtering recommender (Implicit ALS), feature importances, and explainer tooltips.
- **Recommender Demo (`/recommender`)**: Interactive visitor search with random visitor generator and personalized top-10 recommended item cards with collaborative rationale.
- **Live Stream (`/stream`)**: EventSource connection to `/api/stream/live` displaying rolling 60-point events/min velocity, active items ticker, and real-time cart abandonment alerts.
- **Performance & Architecture (`/performance`)**: Spark SQL vs Hive speedup benchmarks (13x–26x), synthetic scalability curves (1x, 10x, 50x), interactive system architecture diagram, and Kaggle/Hu et al. citations.
