import os
from supabase import create_client, Client

SUPABASE_URL = "https://woaeubwolcumahihscsg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYWV1YndvbGN1bWFoaWhzY3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1OTM1MSwiZXhwIjoyMDgzODM1MzUxfQ.ZWrnaiDGPAo_ahiOZTR9jfihe7QlUbrq0-6va-tZ-AE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_logo(name):
    clean_name = name.lower().replace(" ", "-").replace("'", "")
    return f"https://pga-tour-res.cloudinary.com/image/upload/v1/pga-tour/tournaments/{clean_name}/logo.png"

tournaments = [
    # JANUARY - Opening Drive
    {"name": "Sony Open in Hawaii", "start_date": "2026-01-15", "end_date": "2026-01-18", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9100000, "status": "UPCOMING"},
    {"name": "The American Express", "start_date": "2026-01-22", "end_date": "2026-01-25", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9200000, "status": "UPCOMING"},
    {"name": "Farmers Insurance Open", "start_date": "2026-01-28", "end_date": "2026-01-31", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9600000, "status": "UPCOMING"},
    
    # FEBRUARY - West Coast Swing
    {"name": "WM Phoenix Open", "start_date": "2026-02-05", "end_date": "2026-02-08", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9600000, "status": "UPCOMING"},
    {"name": "AT&T Pebble Beach Pro-Am", "start_date": "2026-02-12", "end_date": "2026-02-15", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "The Genesis Invitational", "start_date": "2026-02-19", "end_date": "2026-02-22", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "Cognizant Classic", "start_date": "2026-02-26", "end_date": "2026-03-01", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9600000, "status": "UPCOMING"},

    # MARCH - Florida Swing & Flagship
    {"name": "Arnold Palmer Invitational", "start_date": "2026-03-05", "end_date": "2026-03-08", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "Puerto Rico Open", "start_date": "2026-03-05", "end_date": "2026-03-08", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 4000000, "status": "UPCOMING"},
    {"name": "The Players Championship", "start_date": "2026-03-12", "end_date": "2026-03-15", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 25000000, "status": "UPCOMING"},
    {"name": "Valspar Championship", "start_date": "2026-03-19", "end_date": "2026-03-22", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9100000, "status": "UPCOMING"},
    {"name": "Texas Children's Houston Open", "start_date": "2026-03-26", "end_date": "2026-03-29", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9900000, "status": "UPCOMING"},

    # APRIL - The Road to Augusta
    {"name": "Valero Texas Open", "start_date": "2026-04-02", "end_date": "2026-04-05", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9800000, "status": "UPCOMING"},
    {"name": "Masters Tournament", "start_date": "2026-04-09", "end_date": "2026-04-12", "is_major": True, "is_signature": False, "is_playoff": False, "prize_pot": 21000000, "status": "UPCOMING"},
    {"name": "RBC Heritage", "start_date": "2026-04-16", "end_date": "2026-04-19", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "Zurich Classic of New Orleans", "start_date": "2026-04-23", "end_date": "2026-04-26", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9500000, "status": "UPCOMING"},
    {"name": "Cadillac Championship", "start_date": "2026-04-30", "end_date": "2026-05-03", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},

    # MAY - Second Major
    {"name": "Truist Championship", "start_date": "2026-05-07", "end_date": "2026-05-10", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "Myrtle Beach Classic", "start_date": "2026-05-07", "end_date": "2026-05-10", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 4000000, "status": "UPCOMING"},
    {"name": "PGA Championship", "start_date": "2026-05-14", "end_date": "2026-05-17", "is_major": True, "is_signature": False, "is_playoff": False, "prize_pot": 19000000, "status": "UPCOMING"},
    {"name": "The CJ Cup Byron Nelson", "start_date": "2026-05-21", "end_date": "2026-05-24", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 10300000, "status": "UPCOMING"},
    {"name": "Charles Schwab Challenge", "start_date": "2026-05-28", "end_date": "2026-05-31", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9900000, "status": "UPCOMING"},

    # JUNE - The U.S. Open
    {"name": "the Memorial Tournament", "start_date": "2026-06-04", "end_date": "2026-06-07", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "RBC Canadian Open", "start_date": "2026-06-11", "end_date": "2026-06-14", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9800000, "status": "UPCOMING"},
    {"name": "U.S. Open", "start_date": "2026-06-18", "end_date": "2026-06-21", "is_major": True, "is_signature": False, "is_playoff": False, "prize_pot": 21500000, "status": "UPCOMING"},
    {"name": "Travelers Championship", "start_date": "2026-06-25", "end_date": "2026-06-28", "is_major": False, "is_signature": True, "is_playoff": False, "prize_pot": 20000000, "status": "UPCOMING"},

    # JULY - The Open & Summer Swing
    {"name": "John Deere Classic", "start_date": "2026-07-02", "end_date": "2026-07-05", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 8800000, "status": "UPCOMING"},
    {"name": "Genesis Scottish Open", "start_date": "2026-07-09", "end_date": "2026-07-12", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 9000000, "status": "UPCOMING"},
    {"name": "ISCO Championship", "start_date": "2026-07-09", "end_date": "2026-07-12", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 4000000, "status": "UPCOMING"},
    {"name": "The Open Championship", "start_date": "2026-07-16", "end_date": "2026-07-19", "is_major": True, "is_signature": False, "is_playoff": False, "prize_pot": 17000000, "status": "UPCOMING"},
    {"name": "Corales Puntacana Championship", "start_date": "2026-07-16", "end_date": "2026-07-19", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 4000000, "status": "UPCOMING"},
    {"name": "3M Open", "start_date": "2026-07-23", "end_date": "2026-07-26", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 8800000, "status": "UPCOMING"},
    {"name": "Rocket Classic", "start_date": "2026-07-30", "end_date": "2026-08-02", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 10000000, "status": "UPCOMING"},

    # AUGUST - Post-Season Build
    {"name": "Wyndham Championship", "start_date": "2026-08-06", "end_date": "2026-08-09", "is_major": False, "is_signature": False, "is_playoff": False, "prize_pot": 8500000, "status": "UPCOMING"},
    {"name": "FedEx St. Jude Championship", "start_date": "2026-08-13", "end_date": "2026-08-16", "is_major": False, "is_signature": False, "is_playoff": True, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "BMW Championship", "start_date": "2026-08-20", "end_date": "2026-08-23", "is_major": False, "is_signature": False, "is_playoff": True, "prize_pot": 20000000, "status": "UPCOMING"},
    {"name": "TOUR Championship", "start_date": "2026-08-27", "end_date": "2026-08-30", "is_major": False, "is_signature": False, "is_playoff": True, "prize_pot": 40000000, "status": "UPCOMING"}
]
for t in tournaments:
    t["logo_url"] = get_logo(t["name"])

def seed_tournaments():
    print("🏌️‍♂️ Seeding official 2026 PGA Tour Data...")
    for t in tournaments:
        try:
            # This now works because 'name' has a UNIQUE constraint in the DB
            supabase.table("tournaments").upsert(t, on_conflict="name").execute()
            print(f"✅ {t['name']}: ${t['prize_pot']:,}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    seed_tournaments()