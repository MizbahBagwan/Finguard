
import sqlite3

conn = sqlite3.connect("fraud_reports.db")
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN login_alerts BOOLEAN DEFAULT 1")
except:
    pass

try:
    cursor.execute("ALTER TABLE users ADD COLUMN session_timeout INTEGER DEFAULT 30")
except:
    pass

conn.commit()
conn.close()

print("Database Updated Successfully")