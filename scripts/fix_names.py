import os
from supabase import create_client, Client

# --- TEMPORARY: PASTE KEYS HERE ---
SUPABASE_URL = "https://woaeubwolcumahihscsg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYWV1YndvbGN1bWFoaWhzY3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI1OTM1MSwiZXhwIjoyMDgzODM1MzUxfQ.ZWrnaiDGPAo_ahiOZTR9jfihe7QlUbrq0-6va-tZ-AE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# UPDATES: Mapped to 2-letter ISO Country Codes
UPDATES = {
    # --- Top Players ---
    "S. Scheffler": ["Scottie Scheffler", "us"],
    "R. McIlroy": ["Rory McIlroy", "ie"], # or gb for Northern Ireland
    "X. Schauffele": ["Xander Schauffele", "us"],
    "V. Hovland": ["Viktor Hovland", "no"],
    "L. Aberg": ["Ludvig Åberg", "se"],
    "W. Clark": ["Wyndham Clark", "us"],
    "C. Morikawa": ["Collin Morikawa", "us"],
    "P. Cantlay": ["Patrick Cantlay", "us"],
    "M. Homa": ["Max Homa", "us"],
    "B. Harman": ["Brian Harman", "us"],
    "T. Fleetwood": ["Tommy Fleetwood", "gb"],
    "M. Fitzpatrick": ["Matt Fitzpatrick", "gb"],
    "J. Spieth": ["Jordan Spieth", "us"],
    "T. Hatton": ["Tyrrell Hatton", "gb"],
    "K. Bradley": ["Keegan Bradley", "us"],
    "J. Thomas": ["Justin Thomas", "us"],
    "S. Burns": ["Sam Burns", "us"],
    "C. Young": ["Cameron Young", "us"],
    "J. Day": ["Jason Day", "au"],
    "S. Theegala": ["Sahith Theegala", "us"],
    "T. Kim": ["Tom Kim", "kr"],
    "R. Henley": ["Russell Henley", "us"],
    "S. Straka": ["Sepp Straka", "at"],
    "H. Matsuyama": ["Hideki Matsuyama", "jp"],
    "J. Rose": ["Justin Rose", "gb"],
    "S. Lowry": ["Shane Lowry", "ie"],
    "C. Conners": ["Corey Conners", "ca"],
    "M. McNealy": ["Maverick McNealy", "us"],
    "R. MacIntyre": ["Robert MacIntyre", "gb"], # gb-sct isn't standard ISO, using gb
    "J. Spaun": ["J.J. Spaun", "us"],
    "B. Griffin": ["Ben Griffin", "us"],
    "H. English": ["Harris English", "us"],
    "N. Hojgaard": ["Nicolai Højgaard", "dk"],
    "L. Glover": ["Lucas Glover", "us"],
    "J. Poston": ["J.T. Poston", "us"],
    "A. Scott": ["Adam Scott", "au"],
    "T. Finau": ["Tony Finau", "us"],
    "R. Fowler": ["Rickie Fowler", "us"],
    "M. Pavon": ["Matthieu Pavon", "fr"],

    # --- Extended List ---
    "A. Noren": ["Alex Norén", "se"],
    "A. Rai": ["Aaron Rai", "gb"],
    "C. Gotterup": ["Chris Gotterup", "us"],
    "M. Penge": ["Marco Penge", "gb"],
    "A. Novak": ["Andrew Novak", "us"],
    "M. Greyserman": ["Max Greyserman", "us"],
    "K. Kitayama": ["Kurt Kitayama", "us"],
    "M. Brennan": ["Michael Brennan", "us"],
    "M. Kim": ["Michael Kim", "us"],
    "R. Hojgaard": ["Rasmus Højgaard", "dk"],
    "S. Im": ["Sungjae Im", "kr"],
    "S. Valimaki": ["Sami Välimäki", "fi"],
    "R. Fox": ["Ryan Fox", "nz"],
    "M. Lee": ["Min Woo Lee", "au"],
    "A. Bhatia": ["Akshay Bhatia", "us"],
    "B. Horschel": ["Billy Horschel", "us"],
    "T. Pendrith": ["Taylor Pendrith", "ca"],
    "J. Keefer": ["John Keefer", "us"],
    "S. Stevens": ["Sam Stevens", "us"],
    "N. Echavarria": ["Nico Echavarria", "co"],
    "N. Taylor": ["Nick Taylor", "ca"],
    "R. Gerard": ["Ryan Gerard", "us"],
    "S. Kim": ["Si Woo Kim", "kr"],
    "M. McCarty": ["Matt McCarty", "us"],
    "T. Detry": ["Thomas Detry", "be"],
    "H. Hall": ["Harry Hall", "gb"],
    "D. Berger": ["Daniel Berger", "us"],
    "K. Reitan": ["Kristoffer Reitan", "no"],
    "D. McCarthy": ["Denny McCarthy", "us"],
    "T. Lawrence": ["Thriston Lawrence", "za"],
    "M. McGreevy": ["Max McGreevy", "us"],
    "M. Thorbjornsen": ["Michael Thorbjornsen", "us"],
    "G. Higgo": ["Garrick Higgo", "za"],
    "B. Cauley": ["Bud Cauley", "us"],
    "C. Kirk": ["Chris Kirk", "us"],
    "R. Hoey": ["Rico Hoey", "ph"],
    "M. Wallace": ["Matt Wallace", "gb"],
    "D. Brown": ["Daniel Brown", "gb"],
    "A. Saddier": ["Adrien Saddier", "fr"],
    "J. Bridgeman": ["Jacob Bridgeman", "us"],
    "A. Potgieter": ["Aldrich Potgieter", "za"],
    "J. Vegas": ["Jhonattan Vegas", "ve"],
    "R. Neergaard-Petersen": ["Rasmus Neergaard-Petersen", "dk"],
    "H. Li": ["Haotong Li", "cn"],
    "K. Yu": ["Kevin Yu", "tw"],
    "M. Schmid": ["Matti Schmid", "de"],
    "C. Bezuidenhout": ["Christiaan Bezuidenhout", "za"],
    "M. Hughes": ["Mackenzie Hughes", "ca"],
    "D. Thompson": ["Davis Thompson", "us"],
    "B. An": ["Byeong Hun An", "kr"],
    "K. Nakajima": ["Keita Nakajima", "jp"],
    "T. Hoge": ["Tom Hoge", "us"],
    "N. Shipley": ["Neal Shipley", "us"],
    "D. Riley": ["Davis Riley", "us"],
    "P. Coody": ["Pierceson Coody", "us"],
    "J. Knapp": ["Jake Knapp", "us"],
    "T. Olesen": ["Thorbjørn Olesen", "dk"],
    "E. Grillo": ["Emiliano Grillo", "ar"],
    "M. Meissner": ["Mac Meissner", "us"],
    "S. Jaeger": ["Stephan Jaeger", "de"],
    "S. Fisk": ["Steven Fisk", "us"],
    "V. Whaley": ["Vince Whaley", "us"],
    "E. Cole": ["Eric Cole", "us"],
    "J. Highsmith": ["Joe Highsmith", "us"],
    "E. van Rooyen": ["Erik van Rooyen", "za"],
    "A. Eckroat": ["Austin Eckroat", "us"],
    "M. Hubbard": ["Mark Hubbard", "us"],
    "P. Rodgers": ["Patrick Rodgers", "us"],
    "A. Smalley": ["Alex Smalley", "us"],
    "G. Woodland": ["Gary Woodland", "us"],
    "P. Fishburn": ["Patrick Fishburn", "us"],
    "K. Mitchell": ["Keith Mitchell", "us"],
    "C. Davis": ["Cam Davis", "au"],
    "V. Perez": ["Victor Perez", "fr"],
    "R. Hisatsune": ["Ryo Hisatsune", "jp"],
    "B. Hossler": ["Beau Hossler", "us"],
    "A. Smotherman": ["Austin Smotherman", "us"],
    "A. Schenk": ["Adam Schenk", "us"],
    "M. Kuchar": ["Matt Kuchar", "us"],
    "L. Hodges": ["Lee Hodges", "us"],
    "D. Lipsky": ["David Lipsky", "us"],
    "D. Ghim": ["Doug Ghim", "us"],
    "C. Lamprecht": ["Christo Lamprecht", "za"],
    "N. Norgaard": ["Niklas Nørgaard", "dk"],
    "N. Dunlap": ["Nick Dunlap", "us"],
    "C. Phillips": ["Chandler Phillips", "us"],
    "J. Lower": ["Justin Lower", "us"],
    "T. Moore": ["Taylor Moore", "us"],
    "A. Dumont De Chassart": ["Adrien Dumont de Chassart", "be"],
    "S. Power": ["Seamus Power", "ie"],
    "J. Campillo": ["Jorge Campillo", "es"],
    "J. Olesen": ["Jacob Skov Olesen", "dk"],
    "L. Clanton": ["Luke Clanton", "us"],
    "C. Ramey": ["Chad Ramey", "us"],
    "A. Putnam": ["Andrew Putnam", "us"],
    "J. Koivun": ["Jackson Koivun", "us"],
    "T. Crowe": ["Trace Crowe", "us"],
    "L. Griffin": ["Lanto Griffin", "us"],
    "T. Montgomery": ["Taylor Montgomery", "us"],
    "H. Higgs": ["Harry Higgs", "us"],
    "S. Ryder": ["Sam Ryder", "us"],
    "W. Zalatoris": ["Will Zalatoris", "us"],
    "B. Koepka": ["Brooks Koepka", "us"],
    "J. Niemann": ["Joaquin Niemann", "cl"],
    "C. Smith": ["Cameron Smith", "au"],
    "D. Johnson": ["Dustin Johnson", "us"],
    "B. DeChambeau": ["Bryson DeChambeau", "us"],
}

def fix_golfers():
    print("🔧 Fixing Golfer Names and adding Country Codes...")
    
    response = supabase.table('golfers').select('*').execute()
    golfers = response.data

    count = 0
    for golfer in golfers:
        current_name = golfer['name']
        
        # We check both the old short name AND the new full name
        # to ensure we catch everyone.
        found = False
        target_code = ""
        target_name = ""

        # Check in keys (S. Scheffler)
        if current_name in UPDATES:
            target_name = UPDATES[current_name][0]
            target_code = UPDATES[current_name][1]
            found = True
        
        # Check if already updated (Scottie Scheffler)
        else:
            for key, val in UPDATES.items():
                if val[0] == current_name:
                    target_name = val[0]
                    target_code = val[1]
                    found = True
                    break
        
        if found:
            print(f"   ✨ Updating: {current_name} -> {target_code.upper()} {target_name}")
            supabase.table('golfers').update({
                'name': target_name,
                'flag': target_code
            }).eq('id', golfer['id']).execute()
            count += 1

    print(f"✅ Finished! Updated {count} golfers.")

if __name__ == "__main__":
    fix_golfers()