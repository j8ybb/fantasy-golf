import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# --- CONFIGURATION ---
# Get keys from the "Environment" (The Robot's Secure Vault)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") # We will call it this in GitHub

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Supabase keys are missing from Environment Variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 1. MOCK TOURNAMENT RESULTS (For Testing) ---
# When real golf is on, we switch this to scraping logic.
MOCK_RESULTS = {
    "Scottie Scheffler": 50,
    "Rory McIlroy": 30,
    "Viktor Hovland": 20,
    "Xander Schauffele": 15,
    "Ludvig Aberg": 10,
    "Tommy Fleetwood": 10,
    "Collin Morikawa": 5
}

def update_scores():
    print("1. 🤖 Robot starting Scoring Job...")
    
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
        print("   ❌ No teams found.")
        return

    for roster in rosters:
        user_id = roster['user_id']
        
        # Build list of player names
        my_players = [
            roster['player_1']['name'], roster['player_2']['name'], roster['player_3']['name'],
            roster['player_4']['name'], roster['player_5']['name'], roster['player_6']['name']
        ]

        # Calculate Points
        team_points = 0
        for p_name in my_players:
            points = MOCK_RESULTS.get(p_name, 0)
            team_points += points

        print(f"   👤 User {user_id[:5]}... Total: {team_points} pts")

        # 3. UPDATE DATABASE
        supabase.table('profiles').update({'total_season_points': team_points}).eq('id', user_id).execute()

    print("3. ✅ Leaderboard Updated Successfully!")

if __name__ == "__main__":
    update_scores()