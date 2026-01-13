import os
import requests
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Keys missing.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
CURRENT_WEEK = 1  # We hardcode this for now, or fetch from a settings table

# MOCK SCORES (For testing)
MOCK_RESULTS = {
    "Scottie Scheffler": 50, "Rory McIlroy": 30, "Viktor Hovland": 20,
    "Xander Schauffele": 15, "Ludvig Åberg": 10, "Tommy Fleetwood": 10,
    "Collin Morikawa": 5, "Robert MacIntyre": 25, "Ben Griffin": 12
}

def update_scores():
    print(f"1. 🤖 Robot starting Scoring Job for Week {CURRENT_WEEK}...")
    
    # 1. Fetch Rosters
    response = supabase.table('season_rosters').select('''
        user_id,
        player_1:golfers!season_rosters_player_1_id_fkey(id, name),
        player_2:golfers!season_rosters_player_2_id_fkey(id, name),
        player_3:golfers!season_rosters_player_3_id_fkey(id, name),
        player_4:golfers!season_rosters_player_4_id_fkey(id, name),
        player_5:golfers!season_rosters_player_5_id_fkey(id, name),
        player_6:golfers!season_rosters_player_6_id_fkey(id, name)
    ''').execute()

    rosters = response.data

    for roster in rosters:
        user_id = roster['user_id']
        
        # 2. Get Weekly Tactics (Captain & Wildcard)
        tactics = supabase.table('weekly_choices').select('*') \
            .eq('user_id', user_id).eq('week_number', CURRENT_WEEK).maybe_single().execute()
        
        choices = tactics.data
        captain_id = choices['captain_id'] if choices else None
        wild_out = choices['wildcard_out_id'] if choices else None
        wild_in = choices['wildcard_in_id'] if choices else None

        # Build Standard Team List
        my_team_ids = [
            roster['player_1'], roster['player_2'], roster['player_3'],
            roster['player_4'], roster['player_5'], roster['player_6']
        ]

        # 3. Calculate Points
        team_points = 0
        
        print(f"\n👤 User {user_id[:5]}...")

        for p_obj in my_team_ids:
            p_id = p_obj['id']
            p_name = p_obj['name']
            
            # WILDCARD LOGIC:
            # If this player is swapped OUT, skip them.
            if p_id == wild_out:
                print(f"   ❌ BENCHED: {p_name}")
                continue
            
            # Calculate Standard Points
            points = MOCK_RESULTS.get(p_name, 0)
            
            # CAPTAIN LOGIC
            if p_id == captain_id:
                print(f"   👑 CAPTAIN: {p_name} (2x Points)")
                points = points * 2
            
            team_points += points

        # WILDCARD IN LOGIC
        # If we have a player swapped IN, find their score and add it
        if wild_in and wild_out:
            # We need to fetch the Name of the wild_in player
            w_player = supabase.table('golfers').select('name').eq('id', wild_in).single().execute()
            if w_player.data:
                w_name = w_player.data['name']
                w_points = MOCK_RESULTS.get(w_name, 0)
                
                # Check if Captain was set to the Wildcard player (Rare but possible)
                if wild_in == captain_id:
                     w_points = w_points * 2
                     
                print(f"   🃏 WILDCARD PLAYING: {w_name} (+{w_points} pts)")
                team_points += w_points

        print(f"   ✅ Week Total: {team_points} pts")

        # 4. UPDATE DATABASE (Add to total)
        # Fetch current total first
        current_profile = supabase.table('profiles').select('total_season_points').eq('id', user_id).single().execute()
        current_total = current_profile.data['total_season_points'] or 0
        
        # In a real app, you might want a 'weekly_scores' table too, but for now we just add to total
        # Note: This simple addition assumes you run this script exactly once per week.
        # Ideally, we'd store the week score separately.
        
        new_total = current_total + team_points
        supabase.table('profiles').update({'total_season_points': new_total}).eq('id', user_id).execute()

    print("\n✅ Leaderboard Updated Successfully!")

if __name__ == "__main__":
    update_scores()