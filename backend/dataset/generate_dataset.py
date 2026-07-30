import csv
import random

transaction_types = ["UPI", "Card", "Bank Transfer"]
merchant_categories = [
    "Grocery",
    "Food",
    "Electronics",
    "Travel",
    "Fuel",
    "Shopping",
]

with open("transactions_1000.csv", "w", newline="") as file:
    writer = csv.writer(file)

    writer.writerow([
        "transaction_id",
        "amount",
        "transaction_type",
        "merchant_category",
        "hour",
        "location_risk",
        "device_trusted",
        "failed_attempts",
        "is_international",
        "fraud",
    ])

    for i in range(1, 1001):

        amount = random.randint(100, 150000)
        hour = random.randint(0, 23)

        location_risk = random.randint(0, 1)
        device = random.randint(0, 1)
        failed = random.randint(0, 5)
        international = random.randint(0, 1)

        fraud = 1 if (
            amount > 50000
            and (international == 1 or failed >= 3 or device == 0)
        ) else 0

        writer.writerow([
            f"TXN{i:04}",
            amount,
            random.choice(transaction_types),
            random.choice(merchant_categories),
            hour,
            location_risk,
            device,
            failed,
            international,
            fraud,
        ])

print("transactions_1000.csv created successfully!")