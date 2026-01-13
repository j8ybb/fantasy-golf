import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://woaeubwolcumahihscsg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYWV1YndvbGN1bWFoaWhzY3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1OTM1MSwiZXhwIjoyMDgzODM1MzUxfQ.ZWrnaiDGPAo_ahiOZTR9jfihe7QlUbrq0-6va-tZ-AE" # (Use the Service Role Key, not Anon!)


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 1. MOCK TOURNAMENT RESULTS ---
# Since no game is live, let's pretend these players finished top 3
MOCK_RESULTS = {
    "Scottie Scheffler": 50,  # Winner (50 pts)
    "Rory McIlroy": 30,       # 2nd Place (30 pts)
    "Viktor Hovland": 20,     # 3rd Place (20 pts)
    "Xander Schauffele": 15,  # 4th Place
    "Ludvig Aberg": 10        # 5th Place
}

def update_scores():
    print("1. 🧪 Starting MOCK Scoring Simulation...")
    print(f"   Simulating results: {MOCK_RESULTS}")
    
    # 2. FETCH ALL USERS & THEIR TEAMS
    print("2. 🧮 Calculating User Scores...")
    
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

    if not rosters:
        print("   ❌ No teams found in database. Sign up on the website first!")
        return

    for roster in rosters:
        user_id = roster['user_id']
        
        # Build list of player names for this user
        my_players = [
            roster['player_1']['name'], roster['player_2']['name'], roster['player_3']['name'],
            roster['player_4']['name'], roster['player_5']['name'], roster['player_6']['name']
        ]

        # Calculate Points
        team_points = 0
        for p_name in my_players:
            points = MOCK_RESULTS.get(p_name, 0)
            if points > 0:
                print(f"      + {points} pts from {p_name}")
            team_points += points

        print(f"   👤 User {user_id[:5]}... Total: {team_points} pts")

        # 3. UPDATE DATABASE
        # We Add to existing, or just set it (for testing let's just set it)
        supabase.table('profiles').update({'total_season_points': team_points}).eq('id', user_id).execute()

    print("3. ✅ Leaderboard Updated!")

if __name__ == "__main__":
    update_scores()