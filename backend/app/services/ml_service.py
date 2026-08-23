import shap
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

    print(
        "Model type:",
        type(MODEL)
    )

except Exception as e:

    MODEL = None

    print(
        "========== MODEL LOAD ERROR =========="
    )

    print(
        str(e)
    )

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
# SHAP EXPLAINER
# ==========================================================

SHAP_EXPLAINER = None


def get_shap_explainer():

    """
    Creates and caches a SHAP TreeExplainer
    for the RandomForest classifier inside
    the sklearn Pipeline.
    """

    global SHAP_EXPLAINER

    try:

        if SHAP_EXPLAINER is not None:

            return SHAP_EXPLAINER


        if MODEL is None:

            return None


        # --------------------------------------------------
        # Get RandomForest classifier from Pipeline
        # --------------------------------------------------

        if hasattr(
            MODEL,
            "named_steps"
        ):

            classifier = (
                MODEL
                .named_steps
                .get("classifier")
            )

        else:

            classifier = MODEL


        if classifier is None:

            print(
                "SHAP: classifier not found."
            )

            return None


        # --------------------------------------------------
        # Create TreeExplainer
        # --------------------------------------------------

        SHAP_EXPLAINER = shap.TreeExplainer(
            classifier
        )


        print(
            "SHAP TreeExplainer initialized successfully."
        )


        return SHAP_EXPLAINER


    except Exception as e:

        print(
            "SHAP explainer initialization error:",
            str(e)
        )

        SHAP_EXPLAINER = None

        return None


# ==========================================================
# GET TRANSFORMED FEATURE NAMES
# ==========================================================

def get_transformed_feature_names():

    """
    Gets feature names after ColumnTransformer
    preprocessing.

    Example:

    numeric__amount
    numeric__large_transaction
    categorical__merchant_category_Electronics
    """

    try:

        if MODEL is None:

            return []


        if not hasattr(
            MODEL,
            "named_steps"
        ):

            return []


        preprocessor = (
            MODEL
            .named_steps
            .get("preprocessor")
        )


        if preprocessor is None:

            return []


        feature_names = (
            preprocessor
            .get_feature_names_out()
        )


        return list(
            feature_names
        )


    except Exception as e:

        print(
            "Feature name extraction error:",
            str(e)
        )

        return []


# ==========================================================
# CREATE ML FEATURES
# ==========================================================

def create_ml_features(transaction: dict):

    """
    Creates the same engineered features
    used during model training.
    """

    # ------------------------------------------------------
    # CREATE DATAFRAME
    # ------------------------------------------------------

    df = pd.DataFrame(
        [transaction]
    )


    # ------------------------------------------------------
    # NUMERIC FEATURES
    # ------------------------------------------------------

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


    # ------------------------------------------------------
    # FILL NUMERIC MISSING VALUES
    # ------------------------------------------------------

    df["amount"] = (
        df["amount"]
        .fillna(0)
    )

    df["hour"] = (
        df["hour"]
        .fillna(12)
    )

    df["location_risk"] = (
        df["location_risk"]
        .fillna(0)
    )

    df["device_trusted"] = (
        df["device_trusted"]
        .fillna(1)
    )

    df["failed_attempts"] = (
        df["failed_attempts"]
        .fillna(0)
    )

    df["is_international"] = (
        df["is_international"]
        .fillna(0)
    )


    # ------------------------------------------------------
    # CATEGORICAL FEATURES
    # ------------------------------------------------------

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


    # ------------------------------------------------------
    # ABSOLUTE AMOUNT
    # ------------------------------------------------------

    df["abs_amount"] = (
        df["amount"]
        .abs()
    )


    # ------------------------------------------------------
    # LARGE TRANSACTION
    # ------------------------------------------------------

    df["large_transaction"] = (

        df["amount"]
        >
        AMOUNT_95_PERCENTILE

    ).astype(int)


    # ------------------------------------------------------
    # MERCHANT CATEGORY FREQUENCY
    # ------------------------------------------------------

    df["merchant_category_frequency"] = (

        df["merchant_category"]
        .map(MERCHANT_FREQUENCY)
        .fillna(0)

    )


    # ------------------------------------------------------
    # RISK INDICATOR
    # ------------------------------------------------------

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
# SHAP EXPLANATION
# ==========================================================

def explain_prediction(df):

    """
    Calculates SHAP explanation for one transaction.

    The sklearn Pipeline contains:

        ColumnTransformer
              |
              v
        RandomForestClassifier

    SHAP must therefore receive the transformed
    dataframe, not the original dataframe.
    """

    try:

        if MODEL is None:

            return []


        if not hasattr(
            MODEL,
            "named_steps"
        ):

            return []


        # --------------------------------------------------
        # Get preprocessor
        # --------------------------------------------------

        preprocessor = (
            MODEL
            .named_steps
            .get("preprocessor")
        )


        # --------------------------------------------------
        # Get classifier
        # --------------------------------------------------

        classifier = (
            MODEL
            .named_steps
            .get("classifier")
        )


        if preprocessor is None:

            print(
                "SHAP: preprocessor not found."
            )

            return []


        if classifier is None:

            print(
                "SHAP: classifier not found."
            )

            return []


        # --------------------------------------------------
        # Transform original dataframe
        # --------------------------------------------------

        transformed = (
            preprocessor
            .transform(df)
        )


        # --------------------------------------------------
        # Convert sparse matrix if required
        # --------------------------------------------------

        if hasattr(
            transformed,
            "toarray"
        ):

            transformed_for_shap = (
                transformed.toarray()
            )

        else:

            transformed_for_shap = transformed


        # --------------------------------------------------
        # SHAP explainer
        # --------------------------------------------------

        explainer = (
            get_shap_explainer()
        )


        if explainer is None:

            return []


        # --------------------------------------------------
        # Calculate SHAP values
        # --------------------------------------------------

        shap_values = (
            explainer(
                transformed_for_shap
            )
        )


        # --------------------------------------------------
        # Feature names
        # --------------------------------------------------

        feature_names = (
            get_transformed_feature_names()
        )


        # --------------------------------------------------
        # Get SHAP array
        # --------------------------------------------------

        values = shap_values.values


        print(
            "========== SHAP DEBUG =========="
        )

        print(
            "SHAP shape:",
            values.shape
        )

        print(
            "Feature count:",
            len(feature_names)
        )

        print(
            "================================"
        )


        # --------------------------------------------------
        # SHAP newer format:
        #
        # (samples, features, classes)
        #
        # We need class 1 = fraud.
        # --------------------------------------------------

        if values.ndim == 3:

            # Fraud class index
            classifier_classes = (
                list(
                    classifier.classes_
                )
                if hasattr(
                    classifier,
                    "classes_"
                )
                else []
            )


            if 1 in classifier_classes:

                fraud_class_index = (
                    classifier_classes.index(1)
                )

            else:

                fraud_class_index = 0


            shap_row = (
                values[
                    0,
                    :,
                    fraud_class_index
                ]
            )


        # --------------------------------------------------
        # SHAP older format:
        #
        # (samples, features)
        # --------------------------------------------------

        elif values.ndim == 2:

            shap_row = (
                values[0, :]
            )


        else:

            print(
                "Unsupported SHAP shape:",
                values.shape
            )

            return []


        # --------------------------------------------------
        # Make sure lengths match
        # --------------------------------------------------

        count = min(
            len(
                shap_row
            ),
            len(
                feature_names
            )
        )


        explanations = []


        for index in range(count):

            feature_name = (
                feature_names[index]
            )

            shap_value = float(
                shap_row[index]
            )


            # Ignore extremely tiny values
            if abs(
                shap_value
            ) < 0.0001:

                continue


            if shap_value > 0:

                direction = (
                    "increases_fraud_risk"
                )

            else:

                direction = (
                    "decreases_fraud_risk"
                )


            explanations.append({

                "feature":
                    feature_name,

                "shap_value":
                    round(
                        shap_value,
                        4
                    ),

                "direction":
                    direction

            })


        # --------------------------------------------------
        # Sort by absolute impact
        # --------------------------------------------------

        explanations.sort(

            key=lambda x:
                abs(
                    x["shap_value"]
                ),

            reverse=True

        )


        # --------------------------------------------------
        # Top 10 reasons
        # --------------------------------------------------

        explanations = (
            explanations[:10]
        )


        print(
            "========== TOP SHAP REASONS =========="
        )


        for item in explanations:

            print(

                f"{item['feature']}: "
                f"{item['direction']} "
                f"(SHAP={item['shap_value']})"

            )


        print(
            "======================================"
        )


        return explanations


    except Exception as e:

        print(
            "========== SHAP ERROR =========="
        )

        print(
            str(e)
        )

        import traceback

        traceback.print_exc()

        print(
            "================================"
        )

        # IMPORTANT:
        # SHAP failure should NOT break
        # fraud prediction.

        return []


# ==========================================================
# PREDICT TRANSACTION
# ==========================================================

def predict_transaction(transaction: dict):

    try:

        # ==================================================
        # MODEL AVAILABILITY
        # ==================================================

        if MODEL is None:

            return {

                "success":
                    False,

                "message":
                    "ML model is not loaded."

            }


        # ==================================================
        # INPUT VALIDATION
        # ==================================================

        if not isinstance(
            transaction,
            dict
        ):

            return {

                "success":
                    False,

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

                "success":
                    False,

                "message":
                    (
                        "Missing required features: "
                        +
                        ", ".join(
                            missing_features
                        )
                    )

            }


        # ==================================================
        # CREATE ML FEATURES
        # ==================================================

        df = create_ml_features(
            transaction
        )


        # ==================================================
        # DEBUG INPUT
        # ==================================================

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


        # ==================================================
        # ML PREDICTION
        # ==================================================

        prediction_value = (
            MODEL.predict(df)[0]
        )


        # ==================================================
        # FRAUD PROBABILITY
        # ==================================================

        probabilities = (
            MODEL.predict_proba(df)[0]
        )


        # ==================================================
        # MODEL CLASSES
        # ==================================================

        if hasattr(
            MODEL,
            "named_steps"
        ):

            classifier = (
                MODEL
                .named_steps
                .get("classifier")
            )

        else:

            classifier = MODEL


        if classifier is not None and hasattr(
            classifier,
            "classes_"
        ):

            model_classes = (
                classifier.classes_
            )

        elif hasattr(
            MODEL,
            "classes_"
        ):

            model_classes = (
                MODEL.classes_
            )

        else:

            model_classes = []


        print(
            "========== MODEL CLASSES =========="
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


        # ==================================================
        # FIND FRAUD PROBABILITY
        # ==================================================

        if 1 in model_classes:

            fraud_index = list(
                model_classes
            ).index(1)


            fraud_probability = (

                probabilities[
                    fraud_index
                ]

                *

                100

            )

        else:

            fraud_probability = 0.0


        fraud_probability = round(

            float(
                fraud_probability
            ),

            2

        )


        # ==================================================
        # RISK SCORE
        # ==================================================

        risk_score = (
            fraud_probability
        )


        risk_score = round(

            float(
                risk_score
            ),

            2

        )


        # ==================================================
        # RISK LEVEL
        # ==================================================

        if risk_score >= 80:

            risk_level = "Critical"

        elif risk_score >= 60:

            risk_level = "High"

        elif risk_score >= 30:

            risk_level = "Medium"

        else:

            risk_level = "Low"


        # ==================================================
        # PREDICTION LABEL
        # ==================================================

        prediction = (

            "Fraud"

            if int(
                prediction_value
            ) == 1

            else

            "Safe"

        )


        # ==================================================
        # SHAP EXPLANATION
        # ==================================================

        shap_reasons = (
            explain_prediction(df)
        )


        # ==================================================
        # DEBUG RESULT
        # ==================================================

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
            "SHAP Reasons:",
            len(
                shap_reasons
            )
        )

        print(
            "==============================="
        )


        # ==================================================
        # RETURN RESULT
        # ==================================================

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
                risk_level,

            "explanations":
                shap_reasons,

            "shap_reasons":
                shap_reasons

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