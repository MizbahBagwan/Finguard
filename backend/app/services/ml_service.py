import json
import joblib
import pandas as pd

from pathlib import Path


# ==========================================================
# PATH CONFIGURATION
# ==========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_DIR = BASE_DIR / "ml"

MODEL_PATH = MODEL_DIR / "fraud_model.pkl"

MERCHANT_FREQUENCY_PATH = (
    MODEL_DIR / "merchant_category_frequency.json"
)

FEATURE_CONFIG_PATH = (
    MODEL_DIR / "feature_config.json"
)


# ==========================================================
# LOAD ML MODEL
# ==========================================================

try:

    MODEL = joblib.load(MODEL_PATH)

    print(
        "FinGuard ML model loaded successfully."
    )

except Exception as e:

    MODEL = None

    print(
        "========== MODEL LOAD ERROR =========="
    )

    print(str(e))

    print(
        "======================================"
    )


# ==========================================================
# LOAD MERCHANT FREQUENCY
# ==========================================================

try:

    if MERCHANT_FREQUENCY_PATH.exists():

        with open(
            MERCHANT_FREQUENCY_PATH,
            "r",
            encoding="utf-8"
        ) as f:

            MERCHANT_FREQUENCY = json.load(f)

    else:

        MERCHANT_FREQUENCY = {}

        print(
            "Merchant frequency file not found."
        )

except Exception as e:

    MERCHANT_FREQUENCY = {}

    print(
        "Merchant frequency load error:",
        str(e)
    )


# ==========================================================
# LOAD FEATURE CONFIGURATION
# ==========================================================

try:

    if FEATURE_CONFIG_PATH.exists():

        with open(
            FEATURE_CONFIG_PATH,
            "r",
            encoding="utf-8"
        ) as f:

            FEATURE_CONFIG = json.load(f)

    else:

        FEATURE_CONFIG = {}

        print(
            "Feature configuration file not found."
        )

except Exception as e:

    FEATURE_CONFIG = {}

    print(
        "Feature configuration load error:",
        str(e)
    )


# ==========================================================
# GET LARGE TRANSACTION THRESHOLD
# ==========================================================

AMOUNT_95_PERCENTILE = FEATURE_CONFIG.get(
    "amount_95_percentile",
    15000
)


print(
    "Large transaction threshold:",
    AMOUNT_95_PERCENTILE
)


# ==========================================================
# REQUIRED INPUT FEATURES
# ==========================================================

REQUIRED_FEATURES = [

    "amount",

    "transaction_type",

    "merchant_category",

    "hour",

    "location_risk",

    "device_trusted",

    "failed_attempts",

    "is_international"

]


# ==========================================================
# FEATURE CREATION
# ==========================================================

def create_ml_features(transaction: dict):

    """
    Creates the same engineered features
    used during model training.
    """

    # ==========================================
    # CREATE DATAFRAME
    # ==========================================

    df = pd.DataFrame(
        [transaction]
    )


    # ==========================================
    # NUMERIC FEATURES
    # ==========================================

    numeric_columns = [

        "amount",

        "hour",

        "location_risk",

        "device_trusted",

        "failed_attempts",

        "is_international"

    ]


    for column in numeric_columns:

        if column not in df.columns:

            df[column] = 0

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )


    # ==========================================
    # FILL NUMERIC MISSING VALUES
    # ==========================================

    df["amount"] = df["amount"].fillna(0)

    df["hour"] = df["hour"].fillna(12)

    df["location_risk"] = (
        df["location_risk"].fillna(0)
    )

    df["device_trusted"] = (
        df["device_trusted"].fillna(1)
    )

    df["failed_attempts"] = (
        df["failed_attempts"].fillna(0)
    )

    df["is_international"] = (
        df["is_international"].fillna(0)
    )


    # ==========================================
    # CATEGORICAL FEATURES
    # ==========================================

    if "transaction_type" not in df.columns:

        df["transaction_type"] = "Unknown"

    if "merchant_category" not in df.columns:

        df["merchant_category"] = "Unknown"


    df["transaction_type"] = (
        df["transaction_type"]
        .fillna("Unknown")
        .astype(str)
    )


    df["merchant_category"] = (
        df["merchant_category"]
        .fillna("Unknown")
        .astype(str)
    )


    # ==========================================
    # ABSOLUTE AMOUNT
    # ==========================================

    df["abs_amount"] = (
        df["amount"].abs()
    )


    # ==========================================
    # LARGE TRANSACTION
    # ==========================================

    df["large_transaction"] = (
        df["amount"]
        >
        AMOUNT_95_PERCENTILE
    ).astype(int)


    # ==========================================
    # MERCHANT CATEGORY FREQUENCY
    # ==========================================

    df["merchant_category_frequency"] = (

        df["merchant_category"]
        .map(MERCHANT_FREQUENCY)
        .fillna(0)

    )


    # ==========================================
    # RISK INDICATOR
    # ==========================================

    df["risk_indicator"] = (

        df["location_risk"]
        +
        (
            df["failed_attempts"]
            * 10
        )

    )


    return df


# ==========================================================
# PREDICT TRANSACTION
# ==========================================================

def predict_transaction(transaction: dict):

    try:

        # ==========================================
        # MODEL AVAILABILITY
        # ==========================================

        if MODEL is None:

            return {

                "success": False,

                "message":
                    "ML model is not loaded."

            }


        # ==========================================
        # INPUT VALIDATION
        # ==========================================

        if not isinstance(
            transaction,
            dict
        ):

            return {

                "success": False,

                "message":
                    "Transaction must be a dictionary."

            }


        missing_features = [

            feature

            for feature in REQUIRED_FEATURES

            if feature not in transaction

        ]


        if missing_features:

            return {

                "success": False,

                "message":
                    (
                        "Missing required features: "
                        +
                        ", ".join(
                            missing_features
                        )
                    )

            }


        # ==========================================
        # CREATE ML FEATURES
        # ==========================================

        df = create_ml_features(
            transaction
        )


        # ==========================================
        # DEBUG FEATURES
        # ==========================================

        print(
            "========== ML INPUT =========="
        )

        print(
            df.to_dict(
                orient="records"
            )[0]
        )

        print(
            "=============================="
        )


        # ==========================================
        # ML PREDICTION
        # ==========================================

        prediction_value = (
            MODEL.predict(df)[0]
        )


        # ==========================================
        # FRAUD PROBABILITY
        # ==========================================

        probabilities = (
            MODEL.predict_proba(df)[0]
        )


        # ==========================================
        # MODEL CLASSES
        # ==========================================

        print(
            "========== MODEL CLASSES =========="
        )

        # New pipeline:
        # classifier is inside Pipeline

        if hasattr(
            MODEL,
            "named_steps"
        ):

            classifier = (
                MODEL
                .named_steps
                .get("classifier")
            )

            if classifier is not None:

                model_classes = (
                    classifier.classes_
                )

            else:

                model_classes = (
                    MODEL.classes_
                    if hasattr(
                        MODEL,
                        "classes_"
                    )
                    else []
                )

        else:

            model_classes = (
                MODEL.classes_
                if hasattr(
                    MODEL,
                    "classes_"
                )
                else []
            )


        print(
            "Classes:",
            model_classes
        )

        print(
            "Probabilities:",
            probabilities
        )

        print(
            "==================================="
        )


        # ==========================================
        # FIND FRAUD PROBABILITY
        # ==========================================

        if 1 in model_classes:

            fraud_index = list(
                model_classes
            ).index(1)

            fraud_probability = (
                probabilities[
                    fraud_index
                ]
                * 100
            )

        else:

            fraud_probability = 0.0


        fraud_probability = round(
            float(
                fraud_probability
            ),
            2
        )


        # ==========================================
        # RISK SCORE
        # ==========================================

        risk_score = (
            fraud_probability
        )


        # ==========================================
        # RISK LEVEL
        # ==========================================

        if risk_score >= 80:

            risk_level = "Critical"

        elif risk_score >= 60:

            risk_level = "High"

        elif risk_score >= 30:

            risk_level = "Medium"

        else:

            risk_level = "Low"


        # ==========================================
        # PREDICTION LABEL
        # ==========================================

        prediction = (

            "Fraud"

            if int(
                prediction_value
            ) == 1

            else

            "Safe"

        )


        # ==========================================
        # DEBUG RESULT
        # ==========================================

        print(
            "========== ML RESULT =========="
        )

        print(
            "Prediction:",
            prediction
        )

        print(
            "Fraud Probability:",
            fraud_probability
        )

        print(
            "Risk Score:",
            risk_score
        )

        print(
            "Risk Level:",
            risk_level
        )

        print(
            "==============================="
        )


        # ==========================================
        # RETURN RESULT
        # ==========================================

        return {

            "success":
                True,

            "prediction":
                prediction,

            "fraud_probability":
                fraud_probability,

            "risk_score":
                risk_score,

            "risk_level":
                risk_level

        }


    except Exception as e:

        print(
            "========== ML ERROR =========="
        )

        print(
            str(e)
        )

        import traceback

        traceback.print_exc()

        print(
            "=============================="
        )


        return {

            "success":
                False,

            "message":
                str(e)

        }