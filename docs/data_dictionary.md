# BasketBrain Data Dictionary

Comprehensive data dictionary for the Retailrocket recommender system dataset, preprocessed Parquet tables, and derived session/model features.

---

## 1. Raw Dataset Tables

### `data/raw/events.csv` (2,756,101 rows)
Records raw clickstream events between May 3, 2015 and September 18, 2015 (138 days).

| Column Name | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | BIGINT | No | Unix epoch timestamp in milliseconds. |
| `visitorid` | BIGINT | No | Unique anonymous visitor identifier. |
| `event` | STRING | No | Interaction event type: `view` (96.67%), `addtocart` (2.52%), `transaction` (0.81%). |
| `itemid` | BIGINT | No | Unique product identifier. |
| `transactionid`| STRING | Yes | Order identifier. NULL for `view` and `addtocart`; populated for `transaction`. |

### `data/raw/category_tree.csv` (1,669 rows)
Hierarchical taxonomy mapping child categories to their parent category.

| Column Name | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `categoryid` | INT | No | Unique product category identifier. |
| `parentid` | INT | Yes | Parent category identifier. Exactly 25 top-level categories have NULL `parentid`. |

### `data/raw/item_properties_part1.csv` & `part2.csv` (20,275,902 rows)
Time-stamped snapshots of item properties.

| Column Name | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | BIGINT | No | Snapshot timestamp in epoch milliseconds. |
| `itemid` | BIGINT | No | Unique product identifier. |
| `property` | STRING | No | Property name/hash. `categoryid` and `available` are unhashed; others are hashed IDs. |
| `value` | STRING | No | Property value. Categorical values or normalized numbers (e.g. `n277.200`). |

---

## 2. Preprocessed Parquet Dataset

### `data/processed/events_parquet/` (Partitioned by `event_date`)
Cleaned and enriched clickstream table with derived session identifiers and latest resolved item metadata.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `event_date` | DATE | Partition key in `YYYY-MM-DD` format. |
| `session_id` | STRING | Unique session identifier (`<visitorid>_<sessionIdx>`), derived using a 30-minute inactivity threshold. |
| `visitorid` | BIGINT | Anonymous visitor identifier. |
| `itemid` | BIGINT | Product identifier. |
| `event` | STRING | Clickstream event: `view`, `addtocart`, or `transaction`. |
| `transactionid`| STRING | Order identifier for completed transactions. |
| `timestamp` | BIGINT | Raw epoch timestamp in milliseconds. |
| `categoryid` | INT | Latest resolved category identifier for the item (-1 if unmapped). |
| `parent_categoryid` | INT | Parent category identifier from category hierarchy (-1 if root or unmapped). |
| `is_available` | INT | 1 if item was available at time of snapshot; 0 otherwise. |

---

## 3. Engineered Features

### Customer Segmentation Features (`visitor_features`)
- `recency_days`: Number of days between the latest event in the entire dataset and the visitor's most recent interaction.
- `frequency`: Total count of distinct sessions conducted by the visitor.
- `monetary_score`: Weighted engagement score ($1 \times \text{views} + 3 \times \text{carts} + 5 \times \text{transactions}$).
- `cart_ratio`: Ratio of cart additions to product views ($\frac{\text{carts}}{\max(\text{views}, 1)}$).

### Purchase Intent Features (`session_features` - Leakage Protected)
Computed exclusively from events occurring *before* the first transaction in the session:
- `views_count`: Number of views prior to the prediction point.
- `carts_count`: Number of cart additions prior to the prediction point.
- `unique_items`: Distinct products browsed during the pre-purchase window.
- `session_duration_min`: Elapsed minutes between the first event and the prediction point.
- `hour_of_day`: Hour of day (0–23) when the session began.
- `day_of_week`: Day of week (1=Sunday, 7=Saturday).
- `is_weekend`: Binary flag for weekend sessions.
- `is_repeat_visitor`: Binary flag indicating whether the user had previous historical sessions.
- `label`: Target indicator (1 if the session culminates in a transaction, 0 otherwise).

---

## 4. Implicit Rating Formulation
In collaborative filtering, explicit star ratings are absent. We map implicit clickstream behavior to confidence ratings:
$$r_{u, i} = 1.0 \times \text{views}_{u,i} + 3.0 \times \text{carts}_{u,i} + 5.0 \times \text{transactions}_{u,i}$$
A confidence factor $c_{u, i} = 1 + \alpha r_{u, i}$ is used during ALS matrix factorization optimization.
