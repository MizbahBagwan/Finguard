from pydantic import BaseModel


class TransactionSchema(BaseModel):

    transaction_id: str
    account_id: str

    amount: float
    merchant: str

    location: str
    time: str
    card_type: str

    transaction_type: str
    merchant_category: str
    hour: int
    location_risk: int
    device_trusted: int
    failed_attempts: int
    is_international: int