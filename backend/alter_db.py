import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'gas_station.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE tank_inventories ADD COLUMN theoretical_end_volume FLOAT")
    print("Added theoretical_end_volume column successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column already exists.")
    else:
        print(f"Error: {e}")

conn.commit()
conn.close()
