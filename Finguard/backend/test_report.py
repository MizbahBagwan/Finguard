from app.services.report_service import generate_investigation_report

transaction = {
    "transaction_id": "TXN1001",
    "sender": "ACC1001",
    "receiver": "ACC2001",
    "amount": 50000
}

report = generate_investigation_report(
    transaction,
    fraud_score=94,
    ocr_result="PAN verified successfully",
    graph_summary="Sender account is connected with 5 suspicious accounts."
)

print(report)