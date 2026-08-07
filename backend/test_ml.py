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


from finguard_si1.backend.app.database.graph import get_graph

driver = get_graph()

with driver.session(database="finguard") as session:
    result = session.run("RETURN 'Neo4j Connected Successfully' AS message")
    print(result.single()["message"])

driver.close()