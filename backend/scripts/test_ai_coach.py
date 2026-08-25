import requests

token = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjBhN2Y5NmFkLTNlZGEtNGVjNS1hNDU5LTljMTYzOTYwZWNiNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Z0dmdpcmJjeXdqdGlhd2N5cnR4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjM2IwMDk0MC0xYjNjLTRkOTMtYTczOS03MDliZTcxMjZmNmUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg3Mzg4ODg2LCJpYXQiOjE3ODczODUyODYsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzg3Mzg1Mjg2fV0sInNlc3Npb25faWQiOiJlN2RkMjRiZi05Y2Q2LTQxZjItYmUxNC01OWUwNmQ0MDYzMDkiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.HnCzW_JZkOUSj4F0oAkk8VIoYnZhICokvuS5QH5wNPtMj8F1ruguB0chJ78ESSYJvHoXHcf7NawSLfZ6Wc2wrA"
headers = {"Authorization": f"Bearer {token}"}

# First message - no conversation_id, starts a new one
r1 = requests.post(
    "http://127.0.0.1:8000/api/v1/ai/coach",
    headers=headers,
    json={"message": "What should I focus on in my next workout?"},
)
print("First message:", r1.status_code)
data1 = r1.json()
print(data1)

conversation_id = data1["conversation_id"]

# Second message - reuses the same conversation
r2 = requests.post(
    "http://127.0.0.1:8000/api/v1/ai/coach",
    headers=headers,
    json={"message": "Can you remind me what you just told me?", "conversation_id": conversation_id},
)
print("\nSecond message:", r2.status_code)
print(r2.json())

response = requests.post(
    "http://127.0.0.1:8000/api/v1/ai/coach",
    headers=headers,
    json={"message": "What workouts have I logged recently, and what did I do in the most recent one?"},
)
print(response.status_code)
print(response.json())