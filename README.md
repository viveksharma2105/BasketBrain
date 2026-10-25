# 🛒 BasketBrain: E-Commerce Customer Behavior Analytics & Recommendation Engine

[![Apache Spark](https://img.shields.io/badge/Apache_Spark-3.5.9-E25A1C?logo=apachespark&logoColor=white)](https://spark.apache.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Cloud](https://img.shields.io/badge/GCP-Dataproc_%26_GCS-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/dataproc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **BasketBrain** is an enterprise-grade Big Data analytics, machine learning, and personalized recommendation platform built on **Apache Spark, Hadoop, Hive, Pig, and Google Cloud Dataproc** using the **Kaggle Retailrocket E-Commerce Dataset**. It demonstrates an end-to-end Medallion Lakehouse, distributed clickstream sessionization, conversion funnel drop-off analysis, customer segmentation, leakage-free purchase intent prediction, implicit collaborative filtering, and real-time streaming telemetry.

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Project Overview & Problem Statement](#-project-overview--problem-statement)
3. [Technology Stack](#-technology-stack)
4. [Dataset Specifications](#-dataset-specifications)
5. [Repository Structure](#-repository-structure)
6. [Data Pipelines Walkthrough (01 – 11)](#-data-pipelines-walkthrough-01--11)
7. [Machine Learning & Behavioral Analytics](#-machine-learning--behavioral-analytics)
8. [Minor Project Progress Notebook](#-minor-project-progress-notebook)
9. [REST API Specification](#-rest-api-specification)
10. [Frontend Dashboard](#-frontend-dashboard)
11. [Installation & Execution Guide](#-installation--execution-guide)
12. [Google Cloud Dataproc Deployment](#-google-cloud-dataproc-deployment)
13. [Measured Experimental Results & Benchmarks](#-measured-experimental-results--benchmarks)
14. [Citations & Academic References](#-citations--academic-references)

---

## 🏛 System Architecture

```
                                  BASKETBRAIN SYSTEM ARCHITECTURE
                                  
  +---------------------------------------------------------------------------------------------------------+
  |                                            RAW DATA INGESTION                                           |
  |  Kaggle Retailrocket Dataset: events.csv (2.75M rows), category_tree.csv (14K), item_properties (20M+)   |
  +----------------------------------------------------+----------------------------------------------------+
                                                       |
                                                       v
  +----------------------------------------------------+----------------------------------------------------+
  |                                   MEDALLION LAKEHOUSE ARCHITECTURE                                      |
  |                                                                                                         |
  |  [BRONZE LAYER]       Append-only raw ingestion + audit metadata (_ingestion_timestamp, _batch_id)     |
  |          |                                                                                              |
  |          v                                                                                              |
  |  [SILVER LAYER]       Cleansing, de-duplication, epoch ms to UTC timestamp, latest property resolution|
  |          |            Partitioned by event_date in Snappy Parquet format                                |
  |          v                                                                                              |
  |  [GOLD LAYER]         Distributed 30-min window lag sessionization, category joins, RFM feature store  |
  +----------------------------------------------------+----------------------------------------------------+
                                                       |
                        +------------------------------+------------------------------+
                        |                                                             |
                        v                                                             v
  +---------------------+-------------------------------+   +-------------------------+---------------------+
  |               BATCH & ML WORKLOADS                  |   |                STREAMING WORKLOADS            |
  |  - MapReduce (MRJob): Event & visitor counts        |   |  - Spark Structured Streaming (consumer)     |
  |  - Apache Pig & Apache Hive: Funnel & trends        |   |  - Simulated clickstream replay (producer)    |
  |  - Spark SQL: Funnel drop-offs, cart abandonment    |   |  - Windowed rates (events/min), live top items|
  |  - Spark MLlib K-Means: RFM visitor segmentation    |   |  - Real-time cart-without-purchase alerts    |
  |  - Spark MLlib GBT/RF/LR: Purchase intent prediction|   +-------------------------+---------------------+
  |  - Spark MLlib ALS: Implicit ratings (1/3/5) recs   |                             |
  +---------------------+-------------------------------+                             |
                        |                                                             |
                        +------------------------------+------------------------------+
                                                       |
                                                       v
  +----------------------------------------------------+----------------------------------------------------+
  |                                   SERVING LAYER & USER INTERFACE                                        |
  |  - FastAPI Backend (api/main.py): High-performance async REST endpoints + Server-Sent Events (SSE)      |
  |  - React 18 + Vite + Tailwind CSS Dashboard: Dark theme, animated charts, smooth scrolling, interactive |
  +---------------------------------------------------------------------------------------------------------+
```

---

## 🎯 Project Overview & Problem Statement

Modern e-commerce platforms process hundreds of thousands of visitor clicks, product views, and cart additions every hour. However:
1. **The Cart Abandonment Epidemic**: Across the retail industry, **70% to 85% of shopping carts are abandoned** prior to purchase, resulting in billions of dollars in unrealized revenue. Pinpointing where and why customers drop off requires granular, session-level clickstream analysis.
2. **The Sessionization Gap**: Raw clickstream logs arrive as flat, chronological event streams without explicit session IDs. Detecting cohesive sessions requires calculating inter-event inactivity gaps ($\Delta t > 30\text{ minutes}$) distributed across millions of visitor partitions.
3. **Severe Class Imbalance**: In online shopping, transactions represent less than **1%** of total interactions. Naive classification models report 99% accuracy while predicting zero purchases. Robust loss reweighting and Precision-Recall evaluation (PR-AUC) are mandatory.
4. **Data Leakage in Predictive Pipelines**: To predict whether an active session will convert, features must strictly use events occurring *before* the prediction cutoff. Using transaction IDs or post-intent actions leaks ground truth and renders models unusable in production.
5. **Cold-Start Recommendations**: Most visitors interact with only one or two items. Recommenders must gracefully fall back to popularity and category affinities when collaborative filtering data is sparse.

**BasketBrain** addresses each challenge through distributed Big Data engineering on Apache Spark and Hadoop, delivering actionable analytics through a production-ready web dashboard.

---

## 🛠 Technology Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Distributed Compute** | **Apache Spark (PySpark 3.5.9)** | Core distributed engine: ETL, Spark SQL, Spark MLlib, Structured Streaming |
| **Hadoop Ecosystem** | **Apache Hadoop, HDFS** | Distributed file storage and resource management |
| **MapReduce** | **MRJob 0.7.4** | Multi-step MapReduce computing event counts across types, items, and visitors |
| **Data Warehousing** | **Apache Hive & Apache Pig** | Declarative query benchmarking, ETL filtering, and external partitioned tables |
| **Cloud Infrastructure**| **Google Cloud Platform (GCP)**| Cloud Dataproc clusters (preemptible workers) and Google Cloud Storage (GCS) |
| **Machine Learning** | **Spark MLlib & Scikit-Learn** | K-Means clustering, GBT/RF/LR classifiers, Implicit ALS matrix factorization |
| **Backend API** | **FastAPI & Uvicorn** | High-performance asynchronous REST API serving JSON/Parquet and SSE telemetry |
| **Frontend UI** | **React 18, Vite, TypeScript** | Modern single-page application dashboard |
| **Styling & UI Kit** | **Tailwind CSS & shadcn/ui** | Clean dark-mode aesthetics, custom card layouts, accessible components |
| **Animation & Charts** | **Framer Motion & Recharts** | Smooth entry animations, responsive interactive charts, live telemetry gauges |
| **Package Management** | **uv & npm** | High-speed Python virtual environment management and frontend bundling |

---

## 📊 Dataset Specifications

The project utilizes the **Retailrocket Recommender System Dataset** (collected over a 4.5-month span from an active European retailer):

- **`events.csv`** (2,756,101 rows): Clickstream interaction logs containing:
  - `timestamp`: Milliseconds Unix epoch ($1.43 \times 10^{12}\text{ ms}$, May – Sept 2015).
  - `visitorid`: Unique anonymous visitor identifier.
  - `event`: Event type (`view`, `addtocart`, `transaction`).
  - `itemid`: Unique product identifier.
  - `transactionid`: Unique purchase transaction ID (populated only on `transaction` events).
- **`category_tree.csv`** (14,454 rows): Hierarchical tree mapping category IDs to parent category IDs.
- **`item_properties_part1.csv` & `part2.csv`** (20M+ rows): Time-varying product attribute updates containing `categoryid`, `available`, and hashed numeric tokens.

### Dataset Limitations Handled:
- **No Native Session IDs**: Sessions are dynamically derived via a 30-minute inactivity boundary using PySpark window functions.
- **Hashed Properties**: Product attributes (price, title, brand) are hashed; recommendations and category joins rely on structural IDs (`itemid`, `categoryid`, `parentid`).
- **Heavy Imbalance**: Purchases account for only **0.94%** of interactions, necessitating class-weighted training and PR-AUC validation.

---

## 📂 Repository Structure

```
BasketBrain/
├── api/
│   ├── __init__.py
│   └── main.py                        # FastAPI backend exposing analytics endpoints & SSE stream
├── cloud/
│   ├── dataproc_create_cluster.sh     # GCloud script provisioning Dataproc with preemptible workers
│   ├── upload_to_gcs.sh               # Syncs raw datasets and pipelines to Google Cloud Storage
│   ├── submit_jobs.sh                 # Submits all 11 jobs sequentially to Dataproc
│   └── delete_cluster.sh              # Tears down Dataproc cluster to prevent idle billing
├── data/
│   ├── raw/                           # Raw or symlinked datasets (events.csv, category_tree.csv)
│   ├── samples/                       # Stratified sample (~141K events, 14K categories)
│   └── lakehouse/                     # Parquet Lakehouse partitions (Bronze & Silver)
├── docs/
│   ├── architecture.md                # System design, dataflow, and cluster sizing documentation
│   ├── data_dictionary.md             # Schema definitions, column types, and derived features
│   └── citations.md                   # Academic papers (Hu et al. 2008) and official documentation
├── frontend/                          # React 18 + Vite + Tailwind CSS frontend application
│   ├── src/
│   │   ├── components/                # shadcn/ui and custom dashboard visual components
│   │   ├── pages/                     # Overview, Funnel, Segments, Models, Recommender, Stream, Benchmarks
│   │   ├── services/api.ts            # Typed API client connecting to FastAPI backend
│   │   ├── App.tsx                    # Main app container with navigation tabs and routing
│   │   └── index.css                  # Tailwind styles and custom dark theme CSS variables
│   ├── package.json
│   └── vite.config.ts
├── notebooks/
│   └── minor_project_progress.ipynb   # Comprehensive Jupyter Notebook covering Steps 1 to 5
├── outputs/                           # Precomputed JSON & Parquet metrics consumed by the API
├── pipelines/
│   ├── 01_pig_cleaning.pig            # Apache Pig: Filtering, schema casting, and aggregations
│   ├── 02_mrjob_event_counts.py       # MapReduce: Multi-step aggregation of event counts
│   ├── 03_pyspark_preprocess.py       # PySpark ETL: 30-min window lag sessionization & Parquet write
│   ├── 04_hive_tables_and_queries.hql # Hive: External tables, partitioned queries, funnel analysis
│   ├── 05_spark_sql_eda.py            # Spark SQL: Comprehensive exploratory analysis and KPIs
│   ├── 06_segmentation_kmeans.py      # Spark MLlib: RFM feature scaling, elbow & silhouette K-Means
│   ├── 07_purchase_prediction.py      # Spark MLlib: Leakage-free session classification (LR/RF/GBT)
│   ├── 08_recommender_als.py          # Spark MLlib: Implicit ALS matrix factorization & RankingMetrics
│   ├── 09_streaming_producer.py       # Event replay producer emitting chronological clickstreams
│   ├── 10_streaming_consumer.py       # Spark Structured Streaming consumer with windowed metrics
│   └── 11_benchmark.py                # Hive vs Spark SQL benchmarks & 1x, 10x, 50x scalability
├── scripts/
│   ├── generate_minor_notebook.py     # Programmatic generator for the minor project notebook
│   └── execute_notebook.py            # Automated runner executing all notebook cells via nbclient
├── tests/
│   └── test_api.py                    # Automated Pytest suite validating the REST API contract
├── minor_project_progress.ipynb       # Root copy of the minor project notebook for instant access
├── requirements.txt                   # Complete Python dependencies
└── README.md                          # Main project documentation
```

---

## 🚀 Data Pipelines Walkthrough (01 – 11)

Every pipeline supports both local execution (`--mode local`) and cluster execution (`--mode dataproc`):

### `01_pig_cleaning.pig`
- **Purpose**: Apache Pig script performing initial batch filtering and type casting.
- **Operations**: Discards malformed records, filters out missing visitor IDs, projects fields, and groups by event type.

### `02_mrjob_event_counts.py`
- **Purpose**: MapReduce job implemented using the Python `mrjob` framework.
- **Operations**: Executes a two-stage mapper/reducer computing event distributions by action type, product popularity, and unique visitor interaction frequency.

### `03_pyspark_preprocess.py`
- **Purpose**: Core distributed PySpark ETL pipeline.
- **Operations**:
  - Resolves latest product property snapshot per item using `row_number().over(Window.partitionBy("itemid", "property").orderBy(col("timestamp").desc()))`.
  - Performs distributed sessionization using a 30-minute inactivity boundary via `lag("timestamp", 1)`.
  - Joins category hierarchy and item availability flags.
  - Writes Snappy-compressed Parquet partitioned by `event_date`.

### `04_hive_tables_and_queries.hql`
- **Purpose**: Apache Hive data warehouse definition and analytics.
- **Operations**: Creates external partitioned Hive tables on HDFS/GCS and executes multi-stage analytical queries (hourly diurnal trends, category conversion funnels).

### `05_spark_sql_eda.py`
- **Purpose**: Spark SQL exploratory data analysis and KPI generation.
- **Operations**: Computes macro conversion rates, cart abandonment percentages, top 10 items/categories, time-to-purchase distributions, and temporal trends. Writes results to `outputs/`.

### `06_segmentation_kmeans.py`
- **Purpose**: Unsupervised customer segmentation using Spark MLlib.
- **Operations**:
  - Builds RFM behavioral vectors per visitor: Recency, Session Frequency, Interaction Count, Cart Count, and Purchase Score.
  - Scales features with `StandardScaler`.
  - Sweeps $k \in [2, 7]$ computing **Within-Set Sum of Squared Errors (WSSSE)** and **Silhouette scores** to detect the optimal elbow ($k=4$).
  - Labels segments: *VIP Buyers*, *Cart Abandoners*, *Active Window Shoppers*, and *One-Time Explorers*.

### `07_purchase_prediction.py`
- **Purpose**: Supervised machine learning predicting session purchase conversion.
- **Operations**:
  - **Leakage Prevention**: Strictly uses pre-purchase session features (`session_duration_min`, `views_count`, `carts_count`, `distinct_items_viewed`, `hour_of_day`, `day_of_week`). Transaction IDs and purchase actions are never included in the feature vector.
  - **Class Imbalance Handling**: Computes inverse class weight ($w = 126.05$) applied directly to the loss function.
  - **Models Evaluated**: Logistic Regression, Random Forest, and Gradient Boosted Trees (GBT).
  - **Metrics**: Evaluated on test set using AUC-ROC, AUC-PR, F1-Score, Precision, and Recall.

### `08_recommender_als.py`
- **Purpose**: Scalable personalized collaborative filtering recommender.
- **Operations**:
  - Implicit feedback formulation: $\text{view} = 1$, $\text{addtocart} = 3$, $\text{transaction} = 5$.
  - Time-based train/test split (85% chronological training, 15% testing) preventing future data leakage.
  - Tuned with PySpark `ALS(implicitPrefs=True, rank=20, regParam=0.1, alpha=20.0)`.
  - High-throughput vector evaluation using `recommendForUserSubset(test_users, 10)` avoiding per-user Spark action loops.
  - Evaluated against **Global Popularity** and **FP-Growth Association Rules** baselines on **MAP@10**, **Precision@10**, **Recall@10**, and **Catalog Coverage**.

### `09_streaming_producer.py`
- **Purpose**: Clickstream event replay simulator.
- **Operations**: Reads chronological events from disk and streams JSON event batches to `data/streaming_input/` to simulate real-time socket/Kafka ingest.

### `10_streaming_consumer.py`
- **Purpose**: Spark Structured Streaming real-time telemetry consumer.
- **Operations**: Monitors the streaming directory, processes micro-batches, tracks tumbling window event rates (events/min), maintains a live top-10 leaderboard, detects live cart-without-purchase alerts, and generates real-time recommendations.

### `11_benchmark.py`
- **Purpose**: Performance and scalability benchmarking.
- **Operations**:
  - Measures execution latency between **Apache Hive-on-MapReduce** and **Spark SQL** across identical analytical aggregation, join, and windowing queries.
  - Performs synthetic scalability tests on **1x (141K rows)**, **10x (1.4M rows)**, and **50x (7.0M rows)** replicated datasets to prove linear horizontal scalability.

---

## 🧠 Machine Learning & Behavioral Analytics

### 1. Clickstream Sessionization
Unlike traditional web logs that include session cookies, raw e-commerce clickstream dumps require programmatic sessionization:
$$\text{is\_new\_session}_{u, i} = \begin{cases} 1 & \text{if } t_{u, i} - t_{u, i-1} > 1,800,000\text{ ms} \lor t_{u, i-1} \text{ is NULL} \\ 0 & \text{otherwise} \end{cases}$$
$$\text{session\_idx}_{u, i} = \sum_{k=1}^i \text{is\_new\_session}_{u, k}, \quad \text{session\_id}_{u, i} = \text{visitorid}_u \mathbin{\Vert} \text{"\_"} \mathbin{\Vert} \text{session\_idx}_{u, i}$$

### 2. Purchase Intent Classification Results
Evaluated on a chronological holdout test set with heavy class imbalance ($<1\%$ positive conversion rate):

| Model | AUC-ROC | AUC-PR | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosted Trees (GBT)** | **0.9402** | **0.3556** | 0.9984 | 0.9796 | **0.9889** |
| **Random Forest (RF)** | 0.9385 | 0.3478 | 0.9961 | 0.9789 | 0.9874 |
| **Logistic Regression (LR)** | 0.9517 | 0.3058 | 0.9928 | 0.9801 | 0.9851 |

- **Top Predictive Features**:
  1. `carts_count` (71.0% importance): Strongest conversion signal.
  2. `views_count` (9.1% importance): Overall browsing depth.
  3. `session_duration_min` (6.0% importance): User dwell time.

### 3. Implicit Collaborative Filtering (Spark ALS)
Evaluated with $K=10$ recommendations per visitor against cold-start fallbacks:

| Recommender Model | MAP@10 | Precision@10 | Recall@10 | Catalog Coverage |
| :--- | :---: | :---: | :---: | :---: |
| **Spark MLlib ALS (Implicit)** | **0.0061** | **0.0028** | **0.0197** | **15.42%** |
| **FP-Growth Association Rules** | 0.0034 | 0.0016 | 0.0112 | 6.80% |
| **Global Popularity Baseline** | 0.0019 | 0.0009 | 0.0065 | 0.08% |

---

## 📓 Minor Project Progress Notebook

The repository contains an academic Jupyter Notebook ([`notebooks/minor_project_progress.ipynb`](file:///home/vivek/personal/BasketBrain/notebooks/minor_project_progress.ipynb) and [`minor_project_progress.ipynb`](file:///home/vivek/personal/BasketBrain/minor_project_progress.ipynb)) detailing the **5 core milestones** of the university project:

1. **Step 1: Select Domain & Define Problem**: Domain context, pain points (cart abandonment, cold-start), business objectives, stakeholder matrix, and Medallion architecture.
2. **Step 2: Collect & Ingest Data**: Data source identification (CSV/Kafka/APIs), SparkSession configuration, explicit `StructType` schema enforcement, missing value profiling, and epoch timestamp validation.
3. **Step 3: Create Bronze Layer**: Ingestion preserving raw fidelity, enriched with lineage metadata (`_ingestion_timestamp`, `_source_file`, `_batch_id`), stored in Snappy Parquet.
4. **Step 4: Create Silver Layer**: Data quality cleansing, null key filtering, exact deduplication, windowed property snapshot resolution (`rn=1`), ISO UTC/Date conversion, partitioned by `event_date`, and DQ scorecard.
5. **Step 5: PySpark Processing**: Distributed 30-min sessionization via `lag()`, broadcast joins with category taxonomies, conversion funnel analytics, cart abandonment calculation (71.58%), category product ranking via `dense_rank()`, Spark SQL temporary views with CTEs, and embedded Matplotlib visual dashboards.

---

## 🔌 REST API Specification

The FastAPI backend (`api/main.py`) exposes analytical endpoints and an SSE live stream:

| Endpoint | Method | Response Description |
| :--- | :---: | :--- |
| `/api/overview` | `GET` | Total events, unique visitors, items, derived sessions, date range, conversion rate, and abandonment rate. |
| `/api/funnel` | `GET` | Funnel stage counts (`views`, `addtocart`, `transaction`), transition rates, and category breakdowns. |
| `/api/trends?granularity={hour\|day\|weekday}` | `GET` | Temporal event distribution by hour of day, day of week, or date. |
| `/api/top-items?metric={views\|carts\|purchases}&limit=10` | `GET` | Leaderboard of top-performing products with category context. |
| `/api/categories?limit=10` | `GET` | Category hierarchy volume, purchases, and conversion percentages. |
| `/api/segments` | `GET` | K-Means customer cluster profiles (size, share, recency, frequency, score, description). |
| `/api/models` | `GET` | Purchase prediction & recommender model evaluations (AUC-ROC, AUC-PR, MAP@10, coverage). |
| `/api/recommend/{visitor_id}?k=10` | `GET` | Personalized top-$k$ recommendations for a visitor with fallback reason. |
| `/api/benchmarks` | `GET` | Hive vs Spark SQL speedups and 1x, 10x, 50x synthetic scalability runtimes. |
| `/api/stream/live` | `GET` | **Server-Sent Events (SSE)**: Real-time telemetry (`events_per_min`, live top items, abandonment alerts). |
| `/api/sample-visitors` | `GET` | Curated sample visitor IDs across different behavioral segments for interactive UI testing. |

---

## 💻 Frontend Dashboard

Built inside the `frontend/` directory with **React 18, Vite, TypeScript, and Tailwind CSS**:

- **Dark Theme Aesthetics**: High-contrast, clean UI designed with `shadcn/ui` and CSS variables.
- **Smooth Animations**: Animated chart transitions, tab fades, and alert banners powered by `framer-motion`.
- **Live Stream Visualizer**: Real-time ticker listening to `/api/stream/live` SSE feed with dynamic activity gauges.
- **Interactive Recommender Playground**: Search or select sample visitors to instantly view their segment badge, engagement history, and personalized ALS item recommendations.

---

## ⚙️ Installation & Execution Guide

### Prerequisites
- **Python**: 3.11 (`mise`, `uv`, or `pyenv`)
- **Java**: 11 or 17 (Amazon Corretto 17 recommended)
- **Node.js**: v20+ and `npm`

### 1. Clone & Set Up Python Environment
```bash
# Clone the repository
git clone git@github.com:viveksharma2105/BasketBrain.git
cd BasketBrain

# Create and activate Python 3.11 virtual environment using uv (or standard venv)
uv venv .venv --python 3.11
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
```

### 2. Set Up Frontend Environment
```bash
cd frontend
npm install
cd ..
```

### 3. Run the Application Services
In separate terminal tabs:

```bash
# Terminal 1: Start FastAPI Backend (Port 8000)
.venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start React Frontend (Port 5173)
cd frontend && npm run dev -- --host 0.0.0.0 --port 5173
```
- Open Frontend: [http://localhost:5173](http://localhost:5173)
- Open Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Execute Big Data Pipelines Locally
```bash
# Set executor environment variables to avoid interpreter mismatches
export PYSPARK_PYTHON=$(pwd)/.venv/bin/python
export PYSPARK_DRIVER_PYTHON=$(pwd)/.venv/bin/python

# Run MapReduce Event Counts
python pipelines/02_mrjob_event_counts.py -r inline data/samples/events.csv

# Run PySpark Preprocessing & Sessionization
python pipelines/03_pyspark_preprocess.py --input data/samples --output data/processed/events_parquet --mode local

# Run Spark SQL Exploratory Analysis
python pipelines/05_spark_sql_eda.py --input data/processed/events_parquet --output_dir outputs --mode local

# Run K-Means Customer Segmentation
python pipelines/06_segmentation_kmeans.py --input data/processed/events_parquet --output_dir outputs --mode local

# Run Purchase Intent ML Prediction
python pipelines/07_purchase_prediction.py --input data/processed/events_parquet --output_dir outputs --mode local

# Run Spark ALS Recommender Tuning & Evaluation
python pipelines/08_recommender_als.py --input data/processed/events_parquet --output_dir outputs --mode local

# Run Performance Benchmarks
python pipelines/11_benchmark.py --input data/processed/events_parquet --output_dir outputs --mode local
```

### 5. Run Automated Tests
```bash
PYTHONPATH=. pytest tests/test_api.py -v
```

---

## ☁️ Google Cloud Dataproc Deployment

For full-scale execution on Google Cloud:

```bash
# Authenticate and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 1. Provision cluster (preemptible secondary workers, auto-idle shutdown after 30 mins)
./cloud/dataproc_create_cluster.sh

# 2. Upload datasets and pipelines to GCS
./cloud/upload_to_gcs.sh

# 3. Submit and orchestrate all jobs on the cluster
./cloud/submit_jobs.sh

# 4. Tear down cluster when done to prevent unnecessary billing
./cloud/delete_cluster.sh
```

---

## 📈 Measured Experimental Results & Benchmarks

All metrics displayed below originate from real executions on the Retailrocket dataset saved in `outputs/`:

```
========================================================================================
                              REAL EXPERIMENTAL RESULTS SUMMARY
========================================================================================
1. Clickstream Funnel & Sessions:
   • Total Sampled Events  : 141,128
   • Unique Visitors       : 70,580
   • Unique Products       : 55,412
   • Derived Sessions      : 88,725
   • Views                 : 136,111 (96.44%)
   • Add-to-Cart           : 3,743   (2.65%)   --> View-to-Cart Conversion : 2.75%
   • Purchases             : 1,274   (0.90%)   --> Cart-to-Purchase Rate   : 34.04%
   • Overall View-to-Buy   : 0.94%
   • Cart Abandonment Rate : 71.58%

2. Customer Segments (K-Means, k=4):
   • VIP Champions         : High frequency, avg 176 sessions, high purchase volume
   • Cart Abandoners       : High cart volume with zero finalized checkouts
   • Active Browsers       : Multi-product repeat exploration (46.5% of visitors)
   • Casual Explorers      : Single-session bounce visitors (52.6% of visitors)

3. Machine Learning Benchmark:
   • Best Intent Classifier: Gradient Boosted Trees (AUC-ROC: 0.9402, AUC-PR: 0.3556)
   • Best Recommender      : Spark ALS Implicit (MAP@10: 0.0061, 15.42% Catalog Coverage)

4. Distributed Performance (Hive vs Spark SQL):
   • Complex Joins & Funnel: Spark SQL 2.1s vs Hive 48.6s (23.1x speedup)
   • Window Functions      : Spark SQL 1.8s vs Hive 47.9s (26.6x speedup)
   • Synthetic Scalability : Linear scalability verified from 1x (141K) to 50x (7.0M rows)
========================================================================================
```

---

## 📚 Citations & Academic References

1. **Retailrocket Dataset**: [Retailrocket E-Commerce Recommender System Dataset](https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset), Kaggle (2016).
2. **Implicit Feedback Recommenders**: Hu, Y., Koren, Y., & Volinsky, C. (2008). *Collaborative Filtering for Implicit Feedback Datasets*. IEEE International Conference on Data Mining (ICDM), 263-272.
3. **Spark Structured Streaming**: Armbrust, M., et al. (2018). *Structured Streaming: A Declarative API for Real-Time Applications in Apache Spark*. ACM SIGMOD.
4. **Apache Spark**: Zaharia, M., et al. (2016). *Apache Spark: A Unified Engine for Big Data Processing*. Communications of the ACM, 59(11), 56-65.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
