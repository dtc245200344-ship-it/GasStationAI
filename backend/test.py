import sys
sys.path.append('.')
from database import SessionLocal
import crud

db = SessionLocal()
try:
    stats = crud.get_dashboard_stats(db)
    print(stats)
except Exception as e:
    import traceback
    traceback.print_exc()
