import requests

token = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjBhN2Y5NmFkLTNlZGEtNGVjNS1hNDU5LTljMTYzOTYwZWNiNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Z0dmdpcmJjeXdqdGlhd2N5cnR4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlODJkNTExNC1kNzVhLTQ1NWEtODVhMy01OTBkNjA2MGJkM2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg2ODQzMDA5LCJpYXQiOjE3ODY4Mzk0MDksImVtYWlsIjoidGVzdHVzZXIyQHRlc3QuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODY4Mzk0MDl9XSwic2Vzc2lvbl9pZCI6ImJhNDU0NTYyLWMxMDMtNGExYS1iMWU2LTBkZWRlNjkxNDk1MSIsImlzX2Fub255bW91cyI6ZmFsc2V9.DEAiASXYK9ZcEWN0p1Vgdkw_nPza8Isp1RmXfxZyi4s7a8HoYj8SigPneFfXOOGhQFrCjai7atU2XDuMXrvuhw"
r = requests.get("http://127.0.0.1:8000/api/v1/workouts", headers={"Authorization": f"Bearer {token}"})
headers = {"Authorization": f"Bearer {token}"}

# Step 1: grab a real exercise ID to use in the workout
exercises = requests.get("http://127.0.0.1:8000/api/v1/exercises", headers=headers).json()
bench_press = next(e for e in exercises if e["name"] == "Bench Press")
print("Using exercise:", bench_press["id"], bench_press["name"])
print(r.status_code)
print(r.json())

# Step 2: create a workout with a nested exercise and sets
payload = {
    "name": "Push Day",
    "workout_date": "2026-08-16",
    "duration_minutes": 45,
    "exercises": [
        {
            "exercise_id": bench_press["id"],
            "exercise_order": 1,
            "sets": [
                {"set_number": 1, "reps": 8, "weight_kg": 60},
                {"set_number": 2, "reps": 8, "weight_kg": 60},
                {"set_number": 3, "reps": 6, "weight_kg": 65},
            ],
        }
    ],
}

r = requests.post("http://127.0.0.1:8000/api/v1/workouts", headers=headers, json=payload)
print(r.status_code)
print(r.json())