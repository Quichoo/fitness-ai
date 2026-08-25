import requests

email = "test@test.com"
password = "test"

r = requests.post(
    "https://ftvgirbcywjtiawcyrtx.supabase.co/auth/v1/token?grant_type=password",
    headers={
        "apikey": "sb_publishable_LWRhD6mfx9EsU8qkKyJbBA_jpFVNSvu",
        "Content-Type": "application/json",
    },
    json={"email": email, "password": password},
)
print(r.json().get("access_token", r.json()))