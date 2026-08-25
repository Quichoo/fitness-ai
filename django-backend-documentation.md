# AI Fitness Companion — Django Backend Documentation

Complete reference for the Django + Django REST Framework (DRF) backend,
covering everything built from the Aug 14 restart through the completed
V1 backend on Aug 16, 2026. This replaces the original FastAPI plan for
the backend layer; the overall project roadmap (V1–V5) and Supabase's role
stay the same.

---

## 1. Stack

- **Django 6.1** — web framework
- **Django REST Framework (DRF)** — turns Django into a JSON API
- **PyJWT** (`pyjwt[crypto]`) — verifies Supabase-issued JWTs
- **psycopg[binary]** — PostgreSQL driver
- **python-dotenv** — loads `.env` into environment variables
- **Supabase** — Postgres database + user authentication (Auth), same as before
- **Python 3.12** — required. Python 3.14 causes wheel-build failures on Windows for `psycopg`/`pydantic-core`-style packages; 3.12 has full prebuilt-wheel support.

## 2. Why Django instead of FastAPI

The original backend was built in FastAPI and worked end-to-end (see
`setup-log-2026-08-13.md`), but the pace of building the frontend afterward
became hard to follow. Restarted the backend on Django for a more
"batteries included" structure, going step by step this time. The overall
architecture and security principles are unchanged — verified JWT auth,
server-derived user identity, ownership checks on every resource, database
as source of truth.

---

## 3. Project structure

```
fitness-ai/
└── backend/
    ├── venv/                  (Python 3.12 virtual environment)
    ├── manage.py              (Django's command-line entry point)
    ├── .env                   (secrets - never committed)
    ├── config/                (project-wide settings, created by startproject)
    │   ├── settings.py
    │   └── urls.py            (top-level URL router)
    ├── profiles/               (Django app - one per user)
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── authentication.py  (Supabase JWT verification - shared by all apps)
    ├── goals/                 (Django app - many per user)
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py
    ├── exercises/              (Django app - shared reference library)
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py
    └── workouts/               (Django app - nested: workout > exercises > sets)
        ├── models.py
        ├── serializers.py
        ├── views.py
        └── urls.py
```

Every app was created with `python manage.py startapp <name>`, which
scaffolds `models.py`, `views.py`, `admin.py`, `apps.py`, `tests.py`, and a
`migrations/` folder automatically. `serializers.py` and `urls.py` are not
auto-generated — those are created by hand in each app, following the
pattern established with `profiles`.

---

## 4. Supabase setup (current project)

- Project ref: `ftvgirbcywjtiawcyrtx`
- Project URL: `https://ftvgirbcywjtiawcyrtx.supabase.co`
- Publishable key: `sb_publishable_LWRhD6mfx9EsU8qkKyJbBA_jpFVNSvu` (safe to share/commit to frontend code - it's meant to be public)
- Database password: stored locally only, never shared in chat or committed
- Connection: via **Connect → Session pooler** in the Supabase dashboard
- Auth model: asymmetric JWT signing (ES256), verified via JWKS - this is the default for all Supabase projects created since Oct 2025

### `.env` file (backend/.env)

```
DB_NAME=postgres
DB_USER=postgres.ftvgirbcywjtiawcyrtx
DB_PASSWORD=<your real password - never commit this>
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DJANGO_SECRET_KEY=change-me-later
SUPABASE_URL=https://ftvgirbcywjtiawcyrtx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_LWRhD6mfx9EsU8qkKyJbBA_jpFVNSvu
```

### Relevant `config/settings.py` additions

```python
import os
from dotenv import load_dotenv
load_dotenv()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'profiles.authentication.SupabaseJWTAuthentication',
    ],
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'profiles',
    'goals',
    'exercises',
    'workouts',
]
```

---

## 5. Authentication

Lives in `profiles/authentication.py`, shared by every app via the
`DEFAULT_AUTHENTICATION_CLASSES` setting above (so it only had to be
written once).

**How it works:**
1. Reads the `Authorization: Bearer <token>` header from the request.
2. Fetches Supabase's public signing keys from
   `https://ftvgirbcywjtiawcyrtx.supabase.co/auth/v1/.well-known/jwks.json`
   (cached in memory, not re-fetched every request).
3. Verifies the token's signature against the matching key (matched by
   `kid` in the token header) using PyJWT.
4. Extracts the `sub` claim (the Supabase user's ID) and constructs a
   `SupabaseUser` object with it.
5. DRF then exposes this as `request.user` in every view - `request.user.id`
   is the verified, server-derived user ID. **Never trust a user_id sent by
   the client in a request body.**

**Why PyJWT and not `python-jose`:** `python-jose` was tried first (same
choice made initially on the FastAPI backend) and has a known, reproducible
bug verifying ES256 signatures from a JWKS key set. PyJWT's `PyJWKClient`
handles this reliably.

**Status codes:** `authenticate_header()` is implemented on the
authentication class specifically so that missing/invalid credentials
return `401 Unauthorized` rather than DRF's default `403 Forbidden` -
`403` means "we know who you are, you're just not allowed"; `401` means
"you haven't proven who you are," which is the correct case here.

**Verified test cases:**
- No token → `401`
- Garbage/invalid token → `401`
- Valid token → `200` with correct, user-scoped data

---

## 6. App-by-app reference

### 6.1 `profiles`

One profile per Supabase user, auto-created on first access.

**Model** (`profiles/models.py`): `id` (UUID, matches Supabase user ID
directly - not auto-generated), `display_name`, `date_of_birth`, `sex`,
`height_cm`, `weight_kg`, `fitness_level`, `created_at`, `updated_at`.

**Endpoint:**

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/v1/profile` | Returns the authenticated user's profile, auto-creating an empty one if none exists |
| PUT/PATCH | `/api/v1/profile` | Updates it |

**View pattern:** `RetrieveUpdateAPIView` with a custom `get_object()`:
```python
def get_object(self):
    profile, _created = Profile.objects.get_or_create(id=self.request.user.id)
    return profile
```

### 6.2 `goals`

Many goals per user. First app with a full ownership-filtered queryset.

**Model** (`goals/models.py`): `id` (auto UUID), `user_id` (plain UUID
field, not a Django ForeignKey - Supabase users aren't Django `User`
records), `goal_type` (choices), `target_value`, `target_unit`,
`target_date`, `status` (choices), timestamps.

**Endpoints:**

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/v1/goals` | List the authenticated user's goals only |
| POST | `/api/v1/goals` | Create a goal, `user_id` set server-side from the token |
| GET/PUT/PATCH/DELETE | `/api/v1/goals/<id>` | Only works if the goal belongs to the requester |

**Ownership pattern**, reused in every subsequent app:
```python
def get_queryset(self):
    return Goal.objects.filter(user_id=self.request.user.id)
```
Because the queryset itself is pre-filtered to the current user, requesting
another user's goal ID returns `404` (not `403`) - Django simply can't find
it in the filtered set. This avoids confirming "that resource exists, you
just can't see it," matching the same not-found-vs-not-yours principle
used throughout.

**Verified:** creating a goal returns `201` with real data (no `user_id`
in the response body, by design); a second test user requesting the first
user's goal ID correctly gets `404`.

### 6.3 `exercises`

Shared, global reference library - no `user_id`, read-only through the API.

**Model** (`exercises/models.py`): `id`, `name`, `description`,
`muscle_group` (indexed), `equipment`, `difficulty`, `instructions`,
timestamps. `Meta.ordering = ["name"]` for automatic alphabetical sorting.

**Endpoints:**

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/v1/exercises` | List all, optional `?muscle_group=` filter |
| GET | `/api/v1/exercises/<id>` | One exercise |

**Read-only enforcement:** achieved simply by using `ListAPIView` /
`RetrieveAPIView` (DRF base classes that only implement `GET`) rather than
classes that also support `POST`/`PUT`. No manual blocking code needed -
confirmed a `POST` request correctly returns `405 Method Not Allowed`.

**Seed data:** 10 starter exercises inserted via `python manage.py shell`
using `Exercise.objects.get_or_create(...)` (safe to re-run without
duplicating).

### 6.4 `workouts`

The most complex app: nested writes across three related tables in a
single request.

**Models** (`workouts/models.py`), three separate classes:
- `Workout` - `id`, `user_id`, `name`, `workout_date`, `duration_minutes`,
  `notes`, `source` (choices, default `"manual"`), timestamps.
- `WorkoutExercise` - `id`, `workout` (real Django `ForeignKey`, `CASCADE`
  delete, `related_name="exercises"`), `exercise` (`ForeignKey` to the
  `exercises` app, `PROTECT` delete - prevents deleting a shared exercise
  that's still referenced by someone's logged workout), `exercise_order`,
  `notes`.
- `WorkoutSet` - `id`, `workout_exercise` (`ForeignKey`, `CASCADE`,
  `related_name="sets"`), `set_number`, `reps`, `weight_kg`,
  `duration_seconds`, `distance_meters`, `rpe`, `completed`.

**Endpoints:**

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/v1/workouts` | List the user's workouts - **slim** payload (`id`, `name`, `workout_date`, `duration_minutes`, `source` only, no nested data) |
| POST | `/api/v1/workouts` | Create a workout with nested `exercises` (each with nested `sets`) in one request |
| GET | `/api/v1/workouts/<id>` | One workout, **full nested detail** (all exercises and sets) |
| DELETE | `/api/v1/workouts/<id>` | Delete (cascades to its exercises/sets automatically) |

Editing an existing workout's nested exercises/sets is intentionally **not
implemented in V1** - deciding whether to replace vs. merge existing
nested rows on update is a meaningfully harder problem, deferred until the
simpler CRUD is proven solid.

**Two serializers, one per use case** (`workouts/serializers.py`):
- `WorkoutSerializer` - full nested read/write, used for create and
  detail views. Overrides `create()` manually, since DRF can't
  automatically save three nested levels:
  ```python
  def create(self, validated_data):
      exercises_data = validated_data.pop("exercises", [])
      workout = Workout.objects.create(**validated_data)
      for exercise_data in exercises_data:
          sets_data = exercise_data.pop("sets", [])
          workout_exercise = WorkoutExercise.objects.create(workout=workout, **exercise_data)
          for set_data in sets_data:
              WorkoutSet.objects.create(workout_exercise=workout_exercise, **set_data)
      return workout
  ```
- `WorkoutListSerializer` - flat, no nested data, used only for the list
  endpoint. This mirrors the architecture doc's explicit warning against
  fetching a user's entire workout history with full detail every time -
  `get_serializer_class()` on the view switches between the two based on
  HTTP method (`GET` list → slim, `POST` → full).

**Verified end-to-end:** a real nested request (one workout, one exercise,
three sets) returned `201` with every level correctly saved and given its
own real UUID; the list endpoint correctly returned only the slim fields;
a second test user requesting the first user's workout ID correctly got
`404`.

---

## 7. Testing approach used throughout

No formal test suite was written yet (that's still on the list - see
Section 9). Instead, each endpoint was manually verified using small,
disposable Python scripts run directly against the live local server and
real Supabase database:

- `get_token.py` - signs in as a given test user via Supabase's
  `/auth/v1/token?grant_type=password` endpoint, prints a fresh access
  token (tokens expire roughly every hour, so this gets re-run often).
- `test_request.py`, `test_ownership.py`, `test_exercises.py`,
  `test_exercises_readonly.py`, `test_workout.py`,
  `test_workout_ownership.py` - one-off scripts, each proving a specific
  behavior (happy path, cross-user rejection, read-only enforcement).

Two Supabase test users were created via **Authentication → Users → Add
user** in the dashboard, used throughout to prove ownership boundaries
actually block cross-user access rather than just trusting the "happy
path" works.

This approach was deliberate for a learning project - real HTTP requests
against a real database catch issues (like the DRF 403-vs-401 default)
that might be missed with mocked tests. A proper `pytest`-based suite is
still worth adding later (see Section 9).

---

## 8. Daily startup guide

**1. Open a terminal in the backend folder:**
```
cd C:\fitness-ai\backend
```

**2. Activate the virtual environment (every new terminal window needs this again):**
```
venv\Scripts\activate
```
Confirm `(venv)` appears at the start of the prompt before doing anything else.

**3. Start the server:**
```
python manage.py runserver
```
Visit `http://127.0.0.1:8000/api/v1/profile` (with a valid token) to confirm it's responding.

**4. If you changed any `models.py` since last time:**
```
python manage.py makemigrations
python manage.py migrate
```

**5. To get a fresh test token (they expire hourly):**
```
python get_token.py
```

**6. Stopping for the day:** `Ctrl+C` in the server terminal. Nothing else needs manual saving.

---

## 9. What's left for V1, and what's next

**Still open from the original V1 scope:**
- No formal automated test suite yet (`pytest` + DRF's `APITestCase`) -
  worth adding before moving much further, covering the same cases
  already manually verified (401 without token, 404 for cross-user
  access, 405 on read-only endpoints).
- No workout editing (PUT/PATCH) yet - deferred as noted above.
- CORS isn't configured yet - will be needed once the frontend is built,
  to allow the browser to actually call this API.
- No rate limiting yet.

**Next planned step:** the React/Vite frontend, rebuilt slowly and
step-by-step this time (same lesson learned from the earlier attempt) -
wiring up Supabase Auth directly for login/signup, and a centralized API
client hitting these now-working endpoints.

**After that (V2+):** AI coach, AI workout generation, AI progress
analysis, AI tool calling - per the original roadmap, unchanged in
concept, just sitting on top of this Django backend instead of FastAPI.
