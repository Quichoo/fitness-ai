import requests

token = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjBhN2Y5NmFkLTNlZGEtNGVjNS1hNDU5LTljMTYzOTYwZWNiNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Z0dmdpcmJjeXdqdGlhd2N5cnR4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjM2IwMDk0MC0xYjNjLTRkOTMtYTczOS03MDliZTcxMjZmNmUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg3MzE1Mzc1LCJpYXQiOjE3ODczMTE3NzUsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzg3MzExNzc1fV0sInNlc3Npb25faWQiOiI2Y2Q1NGU0Yy0xODUxLTQxYTItYjI0OC1hYWFjM2I3YmRkNjYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.40M8pPxPRCCfD4Zxo-j8bg1gGj5J4yGS05zEHjjv80drL-BA7dTvyr2uIU53H0ME37zzTjBAM9NvLmnxkCNhMQ"
headers = {"Authorization": f"Bearer {token}"}

# Raw stats endpoint
r1 = requests.get("http://127.0.0.1:8000/api/v1/progress", headers=headers)
print("Progress stats:", r1.status_code)
print(r1.json())

print()

# AI explanation endpoint
r2 = requests.post("http://127.0.0.1:8000/api/v1/ai/analyze", headers=headers, json={})
print("AI analysis:", r2.status_code)
print(r2.json())