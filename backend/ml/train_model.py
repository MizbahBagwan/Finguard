import os
import json
import joblib
import logging
import warnings

from pathlib import Path
from datetime import datetime

import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder

from sklearn.model_selection import (
    train_test_split,
    GridSearchCV,
    StratifiedKFold
)

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

warnings.filterwarnings("ignore")

# ==========================================================
# PATH CONFIGURATION
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "uploads"
    / "finguard_transactions_10000.csv"
)

MODEL_DIR = BASE_DIR / "ml"
MODEL_DIR.mkdir(exist_ok=True)

# ==========================================================
# REQUIRED DATASET COLUMNS
# ==========================================================

REQUIRED_COLUMNS = [
    "Date",
    "Merchant",
    "Category",
    "Description",
    "Amount"
]

# ==========================================================
# LOGGING
# ==========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger("FinGuard-ML")
# ==========================================================
# LOAD DATASET
# ==========================================================

logger.info("Loading dataset...")

if not DATASET_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found:\n{DATASET_PATH}"
    )

df = pd.read_csv(DATASET_PATH)

print(df.columns.tolist())
print(df.head())

logger.info("Dataset loaded successfully")
logger.info(f"Dataset Path : {DATASET_PATH}")
logger.info(f"Rows         : {len(df)}")
logger.info(f"Columns      : {len(df.columns)}")


# ==========================================================
# VALIDATE REQUIRED COLUMNS
# ==========================================================

REQUIRED_COLUMNS = [
    "amount",
    "transaction_type",
    "merchant_category",
    "hour",
    "location_risk",
    "device_trusted",
    "failed_attempts",
    "is_international",
    "is_fraud"
]


missing_columns = [
    col
    for col in REQUIRED_COLUMNS
    if col not in df.columns
]


if missing_columns:
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )


logger.info("Dataset validation passed")

# ==========================================================
# REMOVE DUPLICATES
# ==========================================================

duplicate_count = df.duplicated().sum()

if duplicate_count > 0:

    logger.warning(
        f"Removing {duplicate_count} duplicate rows..."
    )

    df = df.drop_duplicates()

logger.info(f"Current Rows : {len(df)}")

# ==========================================================
# DATASET SUMMARY
# ==========================================================

print("\n" + "=" * 60)
print("DATASET SUMMARY")
print("=" * 60)
print(df.head())
print("\nShape :", df.shape)
print("=" * 60)
# ==========================================================
# HANDLE MISSING VALUES
# ==========================================================

logger.info("Handling missing values...")


categorical_columns = [
    "transaction_type",
    "merchant_category"
]


for col in categorical_columns:
    df[col] = df[col].fillna("Unknown")


numeric_columns = [
    "amount",
    "hour",
    "location_risk",
    "device_trusted",
    "failed_attempts",
    "is_international"
]


for col in numeric_columns:
    df[col] = df[col].fillna(
        df[col].median()
    )


logger.info("Missing value handling completed")
# ==========================================================
# DATE FEATURE ENGINEERING
# ==========================================================

# ==========================================================
# FEATURE ENGINEERING
# ==========================================================

logger.info("Creating FinGuard features...")


df["large_transaction"] = (
    df["amount"] >
    df["amount"].quantile(0.95)
).astype(int)


df["risk_indicator"] = (
    df["location_risk"]
    +
    df["failed_attempts"] * 10
)


logger.info("Feature engineering completed")

# ==========================================================
# AMOUNT FEATURES
# ==========================================================

logger.info("Creating amount features...")


df["abs_amount"] = df["amount"].abs()


df["large_transaction"] = (
    df["amount"] >
    df["amount"].quantile(0.95)
).astype(int)


logger.info("Amount features completed")

# ==========================================================
# MERCHANT CATEGORY FREQUENCY
# ==========================================================

logger.info("Creating merchant category frequency features...")

# Dataset column: merchant_category

merchant_category_frequency = (
    df["merchant_category"]
    .value_counts()
)

df["merchant_category_frequency"] = (
    df["merchant_category"]
    .map(merchant_category_frequency)
)


logger.info("Merchant category frequency completed")
# ==========================================================
# CREATE TARGET LABEL
# ==========================================================

logger.info("Creating fraud labels...")


# Target already exists in dataset

logger.info(
    f"Fraud Transactions : {df['is_fraud'].sum()}"
)

logger.info(
    f"Safe Transactions  : {(df['is_fraud']==0).sum()}"
)


logger.info("Feature engineering completed")


print("\nFinal Dataset Shape :", df.shape)
print(df.head())


# ==========================================================
# PREPROCESSING
# ==========================================================

logger.info("Preparing training data...")


TARGET_COLUMN = "is_fraud"


X = df.drop(
    columns=[TARGET_COLUMN]
)

y = df[TARGET_COLUMN]

# ==========================================================
# FEATURE TYPES
# ==========================================================

categorical_features = [
    "transaction_type",
    "merchant_category"
]

numerical_features = [
    col
    for col in X.columns
    if col not in categorical_features
]

logger.info(f"Categorical Features : {categorical_features}")
logger.info(f"Numerical Features   : {numerical_features}")

# ==========================================================
# NUMERIC PIPELINE
# ==========================================================

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ]
)

# ==========================================================
# CATEGORICAL PIPELINE
# ==========================================================

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)

# ==========================================================
# COLUMN TRANSFORMER
# ==========================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            numerical_features
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features
        )
    ]
)

logger.info("Preprocessing pipeline created successfully")

# ==========================================================
# TRAIN TEST SPLIT
# ==========================================================

logger.info("Splitting dataset...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

logger.info(f"Training Samples : {len(X_train)}")
logger.info(f"Testing Samples  : {len(X_test)}")

print("\n" + "=" * 60)
print("TRAIN / TEST SPLIT")
print("=" * 60)
print(f"Training : {X_train.shape}")
print(f"Testing  : {X_test.shape}")
print("=" * 60)
# ==========================================================
# MODEL PIPELINE
# ==========================================================

logger.info("Creating Machine Learning Pipeline...")

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                random_state=42,
                n_jobs=-1,
                class_weight="balanced"
            )
        )
    ]
)

# ==========================================================
# HYPERPARAMETER GRID
# ==========================================================

param_grid = {
    "classifier__n_estimators": [100, 200, 300],
    "classifier__max_depth": [None, 10, 20, 30],
    "classifier__min_samples_split": [2, 5, 10],
    "classifier__min_samples_leaf": [1, 2, 4],
    "classifier__max_features": ["sqrt", "log2"]
}

# ==========================================================
# STRATIFIED K-FOLD
# ==========================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

# ==========================================================
# GRID SEARCH
# ==========================================================

grid_search = GridSearchCV(
    estimator=pipeline,
    param_grid=param_grid,
    cv=cv,
    scoring="f1",
    n_jobs=-1,
    verbose=2
)

logger.info("Model training started...")

grid_search.fit(
    X_train,
    y_train
)

best_model = grid_search.best_estimator_

logger.info("Training completed successfully")

logger.info(
    f"Best Parameters : {grid_search.best_params_}"
)

logger.info(
    f"Best CV Score : {grid_search.best_score_:.4f}"
)

print("\n" + "=" * 60)
print("BEST MODEL")
print("=" * 60)

print("Best Parameters:")
print(grid_search.best_params_)

print("\nBest F1 Score:")
print(round(grid_search.best_score_, 4))

print("=" * 60)
# ==========================================================
# MODEL EVALUATION
# ==========================================================

logger.info("Evaluating model...")

# ----------------------------------------------------------
# Predictions
# ----------------------------------------------------------

y_pred = best_model.predict(X_test)
y_prob = best_model.predict_proba(X_test)[:, 1]

# ----------------------------------------------------------
# Performance Metrics
# ----------------------------------------------------------

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_prob
)

# ----------------------------------------------------------
# Confusion Matrix
# ----------------------------------------------------------

cm = confusion_matrix(
    y_test,
    y_pred
)

tn, fp, fn, tp = cm.ravel()

# ----------------------------------------------------------
# Print Results
# ----------------------------------------------------------

print("\n" + "=" * 70)
print("FinGuard AI - MODEL EVALUATION")
print("=" * 70)

print(f"Accuracy       : {accuracy:.4f}")
print(f"Precision      : {precision:.4f}")
print(f"Recall         : {recall:.4f}")
print(f"F1 Score       : {f1:.4f}")
print(f"ROC AUC Score  : {roc_auc:.4f}")

print("\nConfusion Matrix")
print(cm)

print("\nTrue Negative :", tn)
print("False Positive:", fp)
print("False Negative:", fn)
print("True Positive :", tp)

print("\nClassification Report")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)

# ----------------------------------------------------------
# Save Evaluation Report
# ----------------------------------------------------------

report = f"""
==============================
FinGuard AI Evaluation Report
==============================

Accuracy      : {accuracy:.4f}
Precision     : {precision:.4f}
Recall        : {recall:.4f}
F1 Score      : {f1:.4f}
ROC AUC Score : {roc_auc:.4f}

Confusion Matrix
----------------
{cm}

True Negative : {tn}
False Positive: {fp}
False Negative: {fn}
True Positive : {tp}

Classification Report
---------------------
{classification_report(
    y_test,
    y_pred,
    zero_division=0
)}
"""

report_path = MODEL_DIR / "evaluation_report.txt"

with open(report_path, "w", encoding="utf-8") as f:
    f.write(report)

logger.info(f"Evaluation report saved to: {report_path}")
# ==========================================================
# FEATURE IMPORTANCE
# ==========================================================

logger.info("Generating feature importance...")

feature_names = (
    best_model.named_steps["preprocessor"]
    .get_feature_names_out()
)

importances = (
    best_model.named_steps["classifier"]
    .feature_importances_
)

importance_df = (
    pd.DataFrame(
        {
            "Feature": feature_names,
            "Importance": importances
        }
    )
    .sort_values(
        by="Importance",
        ascending=False
    )
)

print("\nTop 20 Important Features\n")
print(importance_df.head(20))

feature_path = MODEL_DIR / "feature_importance.csv"

importance_df.to_csv(
    feature_path,
    index=False
)

logger.info(f"Feature importance saved to: {feature_path}")

# ==========================================================
# SAVE MODEL
# ==========================================================

logger.info("Saving trained model...")

model_path = MODEL_DIR / "fraud_model.pkl"

joblib.dump(
    best_model,
    model_path
)

logger.info(f"Model saved to: {model_path}")

# ==========================================================
# SAVE METADATA
# ==========================================================

metadata = {
    "project": "FinGuard AI",
    "model_name": "RandomForestClassifier",
    "version": "2.0.0",
    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "dataset": str(DATASET_PATH),
    "total_rows": int(len(df)),
    "training_rows": int(len(X_train)),
    "testing_rows": int(len(X_test)),
    "features": list(X.columns),
    "target": "is_fraud",
    "accuracy": round(float(accuracy), 4),
    "precision": round(float(precision), 4),
    "recall": round(float(recall), 4),
    "f1_score": round(float(f1), 4),
    "roc_auc": round(float(roc_auc), 4),
    "best_parameters": grid_search.best_params_
}

metadata_path = MODEL_DIR / "model_metadata.json"

with open(
    metadata_path,
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        metadata,
        f,
        indent=4
    )

logger.info(f"Metadata saved to: {metadata_path}")

# ==========================================================
# TRAINING COMPLETED
# ==========================================================

print("\n" + "=" * 70)
print("FinGuard AI MODEL TRAINING COMPLETED SUCCESSFULLY")
print("=" * 70)

print(f"Model File          : {model_path}")
print(f"Metadata File       : {metadata_path}")
print(f"Evaluation Report   : {MODEL_DIR / 'evaluation_report.txt'}")
print(f"Feature Importance  : {feature_path}")

print("\nModel Performance")
print("------------------------------")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC AUC   : {roc_auc:.4f}")

print("=" * 70)