import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://woaeubwolcumahihscsg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYWV1YndvbGN1bWFoaWhzY3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1OTM1MSwiZXhwIjoyMDgzODM1MzUxfQ.ZWrnaiDGPAo_ahiOZTR9jfihe7QlUbrq0-6va-tZ-AE" # (Use the Service Role Key, not Anon!)

# Simple Scoring System (You can change this!)
POINTS_MAP = {
    1: 50,  # Winner
    2: 30,
    3: 20,
    4: 15,
    5: 10,
    # Top 10 gets 5 points
    # Top 25 gets 2 points
}

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_points_for_rank(rank):
    if rank in POINTS_MAP:
        return POINTS_MAP[rank]
    if rank <= 10: return 5
    if rank <= 25: return 2
    return 0

def update_scores():
    print("1. ⛳ Scraping Live Leaderboard...")
    
    # Using CBS Sports Leaderboard
    url = "https://www.cbssports.com/golf/leaderboard/"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"❌ Error scraping: {e}")
        return

    # Extract Golfer Performances
    # This dictionary will look like: {'Scottie Scheffler': 50, 'Rory McIlroy': 20}
    player_points = {}
    
    # CBS Table Logic (This finds the rows in the leaderboard)
    rows = soup.find_all('tr', class_='TableBase-bodyTr')
    
    for row in rows:
        try:
            cols = row.find_all('td')
            if len(cols) < 4: continue

            # Get Rank (Clean 'T' from ties)
            rank_text = cols[0].get_text(strip=True).replace('T', '')
            if not rank_text.isdigit(): continue
            rank = int(rank_text)

            # Get Name
            name_tag = cols[3].find('a')
            if not name_tag: continue
            name = name_tag.get_text(strip=True)

            # Calculate Points
            points = get_points_for_rank(rank)
            
            # Store it (Standardize name to match our DB)
            player_points[name] = points
            
        except Exception:
            continue

    print(f"   ✅ Found scores for {len(player_points)} golfers.")
    
    # 2. FETCH ALL USERS & THEIR TEAMS
    print("2. 🧮 Calculating User Scores...")
    
    # Get all rosters with the golfer names
    response = supabase.table('season_rosters').select('''
        user_id,
        player_1:golfers!season_rosters_player_1_id_fkey(name),
        player_2:golfers!season_rosters_player_2_id_fkey(name),
        player_3:golfers!season_rosters_player_3_id_fkey(name),
        player_4:golfers!season_rosters_player_4_id_fkey(name),
        player_5:golfers!season_rosters_player_5_id_fkey(name),
        player_6:golfers!season_rosters_player_6_id_fkey(name)
    ''').execute()

    rosters = response.data

    for roster in rosters:
        user_id = roster['user_id']
        team_points = 0
        
        # Check all 6 players
        players = [
            roster['player_1'], roster['player_2'], roster['player_3'],
            roster['player_4'], roster['player_5'], roster['player_6']
        ]

        for p in players:
            p_name = p['name']
            # Find exact name match or partial match
            # (Real apps use fuzzy matching, but this is a good V1)
            points = player_points.get(p_name, 0)
            team_points += points

        print(f"   👤 User {user_id[:5]}... earned {team_points} pts this week.")

        # 3. UPDATE DATABASE (Add to total)
        # First, get current points
        user_profile = supabase.table('profiles').select('total_season_points').eq('id', user_id).single().execute()
        current_total = user_profile.data['total_season_points'] or 0
        
        new_total = current_total + team_points
        
        # Save new total
        supabase.table('profiles').update({'total_season_points': new_total}).eq('id', user_id).execute()

    print("3. ✅ Leaderboard Updated!")

if __name__ == "__main__":
    # Safety Check: Ask before running
    confirm = input("Are you sure you want to ADD points to the live database? (yes/no): ")
    if confirm.lower() == 'yes':
        update_scores()
    else:
        print("Cancelled.")