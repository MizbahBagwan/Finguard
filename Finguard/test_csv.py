import pandas as pd
from app.services.csv_import import read_csv

transactions = read_csv("uploads/finguard_transactions_500.csv")

print(transactions[:5])