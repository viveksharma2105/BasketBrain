"""
BasketBrain: tests/test_api.py
Pytest suite verifying all FastAPI endpoints against the strict API contract.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data

def test_overview():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    required_keys = [
        "total_events", "visitors", "items", "sessions",
        "date_range", "conversion_rate", "cart_abandonment_rate"
    ]
    for key in required_keys:
        assert key in data, f"Missing key: {key}"
    assert data["total_events"] > 0
    assert data["visitors"] > 0
    assert 0 <= data["conversion_rate"] <= 1.0
    assert 0 <= data["cart_abandonment_rate"] <= 1.0

def test_funnel():
    response = client.get("/api/funnel")
    assert response.status_code == 200
    data = response.json()
    assert "stages" in data
    assert "by_category" in data
    assert len(data["stages"]) == 3
    stage_names = [s["name"] for s in data["stages"]]
    assert stage_names == ["views", "addtocart", "transaction"]
    for s in data["stages"]:
        assert "count" in s
        assert "rate_from_previous" in s

def test_trends():
    for g in ["hour", "day", "weekday"]:
        response = client.get(f"/api/trends?granularity={g}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "label" in data[0]
        assert "views" in data[0]
        assert "carts" in data[0]
        assert "purchases" in data[0]

def test_top_items():
    for m in ["views", "carts", "purchases"]:
        response = client.get(f"/api/top-items?metric={m}&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5
        if data:
            assert "itemid" in data[0]
            assert "categoryid" in data[0]
            assert "count" in data[0]

def test_categories():
    response = client.get("/api/categories?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 5
    if data:
        assert "categoryid" in data[0]
        assert "views" in data[0]
        assert "conversion" in data[0]

def test_segments():
    response = client.get("/api/segments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    for seg in data:
        assert "id" in seg
        assert "label" in seg
        assert "size" in seg
        assert "share" in seg
        assert "avg_recency" in seg
        assert "avg_frequency" in seg
        assert "avg_score" in seg
        assert "description" in seg

def test_models():
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "recommender" in data
    assert "best_model" in data
    assert "feature_importance" in data
    # Validate prediction metrics
    assert len(data["prediction"]) >= 1
    p_model = data["prediction"][0]
    for m in ["model", "auc_roc", "auc_pr", "f1", "recall", "precision"]:
        assert m in p_model
    # Validate recommender metrics
    assert len(data["recommender"]) >= 1
    r_model = data["recommender"][0]
    for m in ["model", "precision_at_10", "recall_at_10", "map_at_10", "coverage"]:
        assert m in r_model

def test_recommendations():
    # Test valid visitor
    response = client.get("/api/sample-visitors")
    assert response.status_code == 200
    sample_visitors = response.json()
    assert len(sample_visitors) > 0
    vid = sample_visitors[0]["visitor_id"]

    rec_res = client.get(f"/api/recommend/{vid}?k=5")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "visitor_id" in rec_data
    assert "segment" in rec_data
    assert "strategy" in rec_data
    assert "items" in rec_data
    assert len(rec_data["items"]) <= 5
    if rec_data["items"]:
        item = rec_data["items"][0]
        assert "itemid" in item
        assert "categoryid" in item
        assert "score" in item
        assert "reason" in item

    # Test unknown visitor (cold start fallback)
    cold_res = client.get("/api/recommend/999999999?k=5")
    assert cold_res.status_code == 200
    cold_data = cold_res.json()
    assert cold_data["strategy"] == "popularity"
    assert len(cold_data["items"]) > 0

def test_benchmarks():
    response = client.get("/api/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "hive_vs_spark" in data
    assert "scalability" in data
    assert len(data["hive_vs_spark"]) >= 1
    assert len(data["scalability"]) >= 1
