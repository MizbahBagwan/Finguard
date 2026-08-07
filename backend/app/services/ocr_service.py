import re
import pytesseract

from PIL import (
    Image,
    ImageEnhance,
    ImageFilter,
    ImageOps
)

# ---------------------------------------------------
# Tesseract
# ---------------------------------------------------

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Users\mizba\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
)

# ---------------------------------------------------
# IMAGE PREPROCESSING
# ---------------------------------------------------

def preprocess_image(image_path):

    image = Image.open(image_path)

    image = ImageOps.exif_transpose(image)

    image = image.convert("L")

    image = ImageEnhance.Contrast(image).enhance(2.5)

    image = image.filter(ImageFilter.SHARPEN)

    image = image.resize(
        (
            image.width * 2,
            image.height * 2
        )
    )

    return image


# ---------------------------------------------------
# OCR
# ---------------------------------------------------

def extract_text(image_path):

    image = preprocess_image(image_path)

    text = pytesseract.image_to_string(
        image,
        config="--oem 3 --psm 6"
    )

    return text.strip()


# ---------------------------------------------------
# MERCHANT
# ---------------------------------------------------

def extract_merchant(text):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    blacklist = [
        "invoice",
        "bill",
        "receipt",
        "tax",
        "gst",
        "phone",
        "mobile"
    ]

    for line in lines[:6]:

        lower = line.lower()

        if any(word in lower for word in blacklist):
            continue

        if len(line) < 3:
            continue

        if any(char.isdigit() for char in line):
            continue

        return line

    return "--"


# ---------------------------------------------------
# AMOUNT
# ---------------------------------------------------

def extract_amount(text):

    patterns = [

        r"TOTAL\s*AMOUNT[^0-9]*(\d+[.,]\d{2})",

        r"GRAND\s*TOTAL[^0-9]*(\d+[.,]\d{2})",

        r"NET\s*AMOUNT[^0-9]*(\d+[.,]\d{2})",

        r"AMOUNT\s*PAYABLE[^0-9]*(\d+[.,]\d{2})",

        r"₹\s*([\d,]+\.\d{2})",

        r"Rs\.?\s*([\d,]+\.\d{2})"

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:
            return match.group(1).replace(",", "")

    numbers = re.findall(
        r"\d+\.\d{2}",
        text
    )

    if numbers:

        return str(
            max(
                map(float, numbers)
            )
        )

    return "--"


# ---------------------------------------------------
# TRANSACTION ID
# ---------------------------------------------------

def extract_transaction_id(text):

    patterns = [

        r"UTR[:\s]*([A-Za-z0-9]+)",

        r"RRN[:\s]*([A-Za-z0-9]+)",

        r"Transaction\s*ID[:\s]*([A-Za-z0-9]+)",

        r"Txn\s*ID[:\s]*([A-Za-z0-9]+)",

        r"Reference\s*No[:\s]*([A-Za-z0-9]+)"

    ]

    for pattern in patterns:

        m = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if m:
            return m.group(1)

    return "--"


# ---------------------------------------------------
# INVOICE
# ---------------------------------------------------

def extract_invoice(text):

    patterns = [

        r"Invoice\s*No[:\s]*([A-Za-z0-9\-\/]+)",

        r"Invoice\s*#[:\s]*([A-Za-z0-9\-\/]+)",

        r"Bill\s*No[:\s]*([A-Za-z0-9\-\/]+)"

    ]

    for pattern in patterns:

        m = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if m:
            return m.group(1)

    return "--"


# ---------------------------------------------------
# DATE
# ---------------------------------------------------

def extract_date(text):

    patterns = [

        r"\d{2}[/-]\d{2}[/-]\d{4}",

        r"\d{2}-[A-Za-z]{3}-\d{4}",

        r"\d{2}\s+[A-Za-z]+\s+\d{4}"

    ]

    for pattern in patterns:

        m = re.search(pattern, text)

        if m:
            return m.group()

    return "--"


# ---------------------------------------------------
# GSTIN
# ---------------------------------------------------

def extract_gstin(text):

    m = re.search(
        r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\d\b",
        text
    )

    return m.group() if m else "--"


# ---------------------------------------------------
# PAYMENT METHOD
# ---------------------------------------------------

def extract_payment(text):

    methods = [

        "UPI",
        "CARD",
        "CASH",
        "PHONEPE",
        "GOOGLE PAY",
        "GPAY",
        "PAYTM",
        "NET BANKING"

    ]

    upper = text.upper()

    for method in methods:

        if method in upper:
            return method

    return "--"
# ---------------------------------------------------
# AI FRAUD ANALYSIS
# ---------------------------------------------------

def analyze_text(text):

    merchant = extract_merchant(text)
    amount = extract_amount(text)
    invoice_no = extract_invoice(text)
    transaction_id = extract_transaction_id(text)
    date = extract_date(text)
    gstin = extract_gstin(text)
    payment = extract_payment(text)

    lower = text.lower()

    # ---------------------------------------
    # Risk Keywords
    # ---------------------------------------

    high_risk = [
        "otp",
        "password",
        "verify",
        "urgent",
        "lottery",
        "reward",
        "refund",
        "click link",
        "login",
        "kyc",
        "suspended",
        "blocked",
        "win cash",
        "gift"
    ]

    medium_risk = [
        "bank",
        "account",
        "security",
        "update",
        "expired",
        "verification",
        "wallet",
        "credit",
        "debit"
    ]

    low_risk = [
        "upi",
        "invoice",
        "receipt",
        "gst",
        "payment",
        "transaction"
    ]

    keywords = []
    risk = 0

    # ---------------------------------------
    # High Risk
    # ---------------------------------------

    for word in high_risk:

        if word in lower:

            if word not in keywords:
                keywords.append(word)

            risk += 25

    # ---------------------------------------
    # Medium Risk
    # ---------------------------------------

    for word in medium_risk:

        if word in lower:

            if word not in keywords:
                keywords.append(word)

            risk += 10

    # ---------------------------------------
    # Low Risk
    # ---------------------------------------

    for word in low_risk:

        if word in lower:

            if word not in keywords:
                keywords.append(word)

            risk += 2

    # ---------------------------------------
    # Extra Rules
    # ---------------------------------------

    if merchant == "--":
        risk += 10

    if amount == "--":
        risk += 10

    if payment == "--":
        risk += 5

    if gstin == "--":
        risk += 5

    risk = min(risk, 100)

    # ---------------------------------------
    # Risk Level
    # ---------------------------------------

    if risk >= 70:

        risk_level = "High"

        recommendation = (
            "High Risk detected. Verify the merchant, payment details and invoice before processing."
        )

    elif risk >= 35:

        risk_level = "Medium"

        recommendation = (
            "Medium Risk detected. Manual verification is recommended."
        )

    else:

        risk_level = "Low"

        recommendation = (
            "Document appears legitimate. No major fraud indicators detected."
        )

    # ---------------------------------------
    # OCR Confidence
    # ---------------------------------------

    if text.strip():

        words = len(text.split())

        if words > 80:
            confidence = 99

        elif words > 40:
            confidence = 97

        elif words > 20:
            confidence = 95

        else:
            confidence = 90

    else:

        confidence = 0

    # ---------------------------------------
    # Final Response
    # ---------------------------------------

    return {

        "success": True,

        "text": text,

        "merchant": merchant,

        "amount": amount,

        "invoice_no": invoice_no,

        "transaction_id": transaction_id,

        "date": date,

        "gstin": gstin,

        "payment_method": payment,

        "keywords": keywords,

        "keyword_count": len(keywords),

        "risk_score": risk,

        "risk_level": risk_level,

        "recommendation": recommendation,

        "confidence": confidence

    }