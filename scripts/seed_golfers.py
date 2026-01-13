import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://woaeubwolcumahihscsg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYWV1YndvbGN1bWFoaWhzY3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1OTM1MSwiZXhwIjoyMDgzODM1MzUxfQ.ZWrnaiDGPAo_ahiOZTR9jfihe7QlUbrq0-6va-tZ-AE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_seed():
    print("1. Scraping World Rankings...")
    
    url = "https://www.cbssports.com/golf/rankings/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"❌ Network Error: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    table = soup.find('table')
    if not table:
        print("❌ Error: Could not find table.")
        return

    rows = table.find_all('tr')
    data_rows = rows[1:] # Skip header
    
    raw_players = []

    print(f"2. Processing {len(data_rows)} rows...")

    for index, row in enumerate(data_rows):
        cols = row.find_all('td')
        if len(cols) < 3: continue
        
        try:
            # --- COLUMN 0: RANK ---
            rank_text = cols[0].get_text(strip=True).replace('T', '')
            if not rank_text.isdigit(): continue
            rank = int(rank_text)

            # --- COLUMN 1: NAME (The Fix) ---
            # We look for the 'a' tag inside column 1 to get the full name
            name_tag = cols[1].find('a')
            if name_tag:
                name = name_tag.get_text(strip=True)
            else:
                # Fallback: Just get text if no link
                name = cols[1].get_text(strip=True)
            
            # Pricing Formula
            if rank > 100:
                price = 1.0
            else:
                raw_price = 10.0 - ((rank - 1) * (9.0 / 99))
                price = round(raw_price, 1)

            raw_players.append({
                "name": name,
                "cost": price,
                "world_rank": rank,
                "tour": "PGA",
                "active": True
            })
            
        except Exception as e:
            continue

    # 3. REMOVE DUPLICATES
    unique_players_dict = {}
    for p in raw_players:
        unique_players_dict[p['name']] = p
    
    final_list = list(unique_players_dict.values())
    
    # DEBUG: Print the first 3 names to make sure they are real people now
    print(f"   [DEBUG] First 3 players found: {[p['name'] for p in final_list[:3]]}")
    
    if len(final_list) == 0:
        print("❌ Error: No players found.")
        return

    print("4. Uploading to Supabase...")

    # 4. UPLOAD IN BATCHES
    batch_size = 50
    for i in range(0, len(final_list), batch_size):
        batch = final_list[i:i + batch_size]
        try:
            data, count = supabase.table('golfers').upsert(batch, on_conflict='name').execute()
            print(f"   ✅ Batch {i} - {i+len(batch)} uploaded.")
        except Exception as e:
             print(f"   ❌ Database Error on batch {i}: {e}")

if __name__ == "__main__":
    scrape_and_seed()