from pydantic import BaseModel

class Transaction(BaseModel):
    amount: float
    merchant: str
    location: str
    time: str
    card_type: str