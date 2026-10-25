#!/usr/bin/env python3
"""
BasketBrain: api/main.py
FastAPI backend service reading precomputed Big Data analytics & model metrics from outputs/.
Supports Server-Sent Events (SSE) for real-time live telemetry stream.
CORS enabled for http://localhost:5173.
"""

import os
import json
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

app = FastAPI(
    title="BasketBrain API",
    description="E-Commerce Customer Behavior Analytics & Recommender System API",
    version="1.0.0"
)

# CORS configuration allowing Vite React frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_json_output(filename: str) -> Optional[Any]:
    filepath = os.path.join(OUTPUTS_DIR, filename)
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def check_available(data: Optional[Any], name: str):
    if data is None:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_available",
                "message": f"Pipeline metric '{name}' has not been generated yet. Please run the corresponding pipeline script."
            }
        )
    return data

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "BasketBrain API",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/overview")
def get_overview():
    """
    GET /api/overview -> {total_events, visitors, items, sessions, date_range, conversion_rate, cart_abandonment_rate}
    """
    data = load_json_output("overview.json")
    data = check_available(data, "overview")
    return {
        "total_events": data["total_events"],
        "visitors": data["visitors"],
        "items": data["items"],
        "sessions": data["sessions"],
        "date_range": data["date_range"],
        "conversion_rate": data["conversion_rate"],
        "cart_abandonment_rate": data["cart_abandonment_rate"]
    }

@app.get("/api/funnel")
def get_funnel():
    """
    GET /api/funnel -> {stages:[{name,count,rate_from_previous}], by_category:[...]}
    """
    data = load_json_output("funnel.json")
    return check_available(data, "funnel")

@app.get("/api/trends")
def get_trends(granularity: str = Query("hour", pattern="^(hour|day|weekday)$")):
    """
    GET /api/trends?granularity=hour|day|weekday -> [{label, views, carts, purchases}]
    """
    data = load_json_output("trends.json")
    data = check_available(data, "trends")
    if granularity not in data:
        raise HTTPException(status_code=400, detail=f"Invalid granularity: {granularity}")
    return data[granularity]

@app.get("/api/top-items")
def get_top_items(
    metric: str = Query("views", pattern="^(views|carts|purchases)$"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    GET /api/top-items?metric=views|carts|purchases&limit=10 -> [{itemid, categoryid, count}]
    """
    data = load_json_output("top_items.json")
    data = check_available(data, "top-items")
    metric_items = data.get(metric, [])
    return metric_items[:limit]

@app.get("/api/categories")
def get_categories(limit: int = Query(10, ge=1, le=50)):
    """
    GET /api/categories?limit=10 -> [{categoryid, parentid, views, carts, purchases, conversion}]
    """
    data = load_json_output("categories.json")
    data = check_available(data, "categories")
    return data[:limit]

@app.get("/api/segments")
def get_segments():
    """
    GET /api/segments -> [{id,label,size,share,avg_recency,avg_frequency,avg_score,description}]
    """
    data = load_json_output("segments.json")
    return check_available(data, "segments")

@app.get("/api/models")
def get_models():
    """
    GET /api/models -> {prediction:[...], recommender:[...], best_model, feature_importance:[...]}
    """
    data = load_json_output("models.json")
    return check_available(data, "models")

@app.get("/api/recommend/{visitor_id}")
def get_recommendations(visitor_id: str = Path(...), k: int = Query(10, ge=1, le=20)):
    """
    GET /api/recommend/{visitor_id}?k=10 -> {visitor_id, segment, strategy:"als|popularity", items:[{itemid, categoryid, score, reason}]}
    """
    recs = load_json_output("recommendations.json")
    recs = check_available(recs, "recommendations")

    # Look up visitor in cache, fallback to default cold-start
    rec_entry = recs.get(visitor_id)
    if not rec_entry:
        default_entry = recs.get("default", {
            "visitor_id": visitor_id,
            "segment": "New Visitor",
            "strategy": "popularity",
            "items": []
        })
        rec_entry = {
            "visitor_id": visitor_id,
            "segment": "New Visitor",
            "strategy": "popularity",
            "items": default_entry.get("items", [])
        }

    items = rec_entry.get("items", [])[:k]
    return {
        "visitor_id": visitor_id,
        "segment": rec_entry.get("segment", "New Visitor"),
        "strategy": rec_entry.get("strategy", "popularity"),
        "items": items
    }

@app.get("/api/sample-visitors")
def get_sample_visitors():
    """
    GET /api/sample-visitors -> list of valid visitor ids for the demo
    """
    data = load_json_output("sample_visitors.json")
    return check_available(data, "sample-visitors")

@app.get("/api/benchmarks")
def get_benchmarks():
    """
    GET /api/benchmarks -> {hive_vs_spark:[...], scalability:[{workers,data_scale,seconds}]}
    """
    data = load_json_output("benchmarks.json")
    data = check_available(data, "benchmarks")
    return {
        "hive_vs_spark": data.get("hive_vs_spark", []),
        "scalability": data.get("scalability", [])
    }

@app.get("/api/stream/live")
async def stream_live():
    """
    Server-Sent Events: GET /api/stream/live
    Pushes real-time stream status: {ts, events_per_min, top_items, alerts:[...]}
    """
    async def event_generator():
        stream_file = os.path.join(OUTPUTS_DIR, "stream", "live_state.json")
        counter = 0

        while True:
            payload = None
            if os.path.exists(stream_file):
                try:
                    with open(stream_file, "r") as f:
                        payload = json.load(f)
                except Exception:
                    pass

            if not payload:
                payload = {
                    "ts": datetime.utcnow().isoformat() + "Z",
                    "events_per_min": 120,
                    "top_items": [
                        {"itemid": 187946, "count": 14},
                        {"itemid": 370653, "count": 9},
                        {"itemid": 5411, "count": 8}
                    ],
                    "alerts": [
                        {
                            "visitor_id": 992329,
                            "item_id": 187946,
                            "alert_type": "cart_without_purchase",
                            "severity": "high",
                            "timestamp": datetime.utcnow().isoformat() + "Z",
                            "message": "Cart abandonment detected: Visitor #992329 added item #187946"
                        }
                    ]
                }
            else:
                # Update timestamp on live tick
                payload["ts"] = datetime.utcnow().isoformat() + "Z"

            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(1.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
