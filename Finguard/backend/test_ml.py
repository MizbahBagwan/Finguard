from app.services.ml_service import predict_transaction

transaction = {
    "amount": 90000,
    "transaction_type": "Bank Transfer",
    "merchant_category": "Travel",
    "hour": 2,
    "location_risk": 1,
    "device_trusted": 0,
    "failed_attempts": 4,
    "is_international": 1
}

result = predict_transaction(transaction)

print(result)