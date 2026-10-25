# BasketBrain Citations & References

This document records the academic literature, dataset citations, and official documentation foundational to the BasketBrain Big Data architecture.

---

## 1. Primary Dataset
- **Retailrocket Recommender System Dataset**:
  - Published on Kaggle by Retailrocket (2016).
  - Source: [Kaggle Retailrocket Recommender System Dataset](https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset)
  - Characteristics: 2.75M real-world e-commerce clickstream events (view, addtocart, transaction), 1.4M visitors, 235K items, and snapshot item property logs over 4.5 months.

---

## 2. Recommender Systems Literature
- **Hu, Y., Koren, Y., & Volinsky, C. (2008)**:
  - *"Collaborative Filtering for Implicit Feedback Datasets"*
  - Proceedings of the IEEE International Conference on Data Mining (ICDM 2008), pp. 263–272.
  - **Relevance**: Formulates the alternating least squares (ALS) matrix factorization algorithm for implicit clickstream datasets (where unobserved interactions signify low confidence rather than negative preference). Serves as the mathematical basis for `pyspark.ml.recommendation.ALS` with `implicitPrefs=True`.

---

## 3. Distributed Compute Frameworks
- **Zaharia, M., Chowdhury, M., Franklin, M. J., Shenker, S., & Stoica, I. (2010)**:
  - *"Spark: Cluster Computing with Working Sets"*
  - USENIX HotCloud.
- **Armbrust, M., et al. (2015)**:
  - *"Spark SQL: Relational Data Processing in Spark"*
  - Proceedings of the ACM SIGMOD International Conference on Management of Data.
- **Armbrust, M., et al. (2018)**:
  - *"Structured Streaming: A Declarative API for Real-Time Applications in Apache Spark"*
  - ACM SIGMOD.
- **Thusoo, A., et al. (2009)**:
  - *"Hive - A Petabyte Scale Data Warehouse using Hadoop"*
  - IEEE 25th International Conference on Data Engineering (ICDE).
- **Olston, C., et al. (2008)**:
  - *"Pig Latin: A Not-So-Foreign Language for Data Processing"*
  - Proceedings of the ACM SIGMOD.
- **Dean, J., & Ghemawat, S. (2004)**:
  - *"MapReduce: Simplified Data Processing on Large Clusters"*
  - OSDI '04: 6th Symposium on Operating System Design and Implementation.
