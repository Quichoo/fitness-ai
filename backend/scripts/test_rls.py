import requests

SUPABASE_URL = "https://ftvgirbcywjtiawcyrtx.supabase.co"
ANON_KEY = "sb_publishable_LWRhD6mfx9EsU8qkKyJbBA_jpFVNSvu"

response = requests.get(
    f"{SUPABASE_URL}/rest/v1/profiles?select=*",
    headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
    },
)
print(response.status_code)
print(response.json())