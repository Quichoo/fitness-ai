# Session Update — AI Coach (V2), Goal Redesign, Activities App & Security Fix (Aug 18-19, 2026)

Covers a major session: V2's AI coach built with real TDD from the start,
a full redesign of the goal system, a new `activities` app closing a gap
identified earlier in the project, and a critical Supabase security fix.
Builds on all prior documentation (backend doc, frontend doc, UI overhaul
doc).

---

## 1. Methodology note: real TDD, for the first time

Every backend feature this session was built RED → GREEN, test written
before implementation, confirmed failing for the right reason before any
code was written to satisfy it. This was a deliberate shift after
researching the Superpowers methodology in an earlier session. Every RED
step in this log was verified against real pytest output, not assumed.

---

## 2. AI Coach (V2)

### Provider decision
Chose **Gemini** (via Google AI Studio) over Groq - bigger free tier,
accepted the tradeoff that free-tier prompts may be used for model
training. Explicitly declined a suggestion to use Vercel's "Eve" agent
framework - wrong fit (Node.js vs our Python/Django stack, built for a
much heavier problem than a single-request Q&A feature, and would violate
the project's own $0-cost/simplest-architecture principle plus the
original spec's "AI must go through the backend, not a separate service"
rule).

### Model note
`gemini-2.5-flash` (originally planned) is no longer available to new API
keys - Google's own error message pointed to the replacement,
`gemini-3.6-flash`, confirmed current via search and now what the app
uses.

### What was built (`coach` app), each piece TDD'd separately

- **`AIService`** (`coach/services.py`) - thin interface, takes any
  injectable client. Tests use a `FakeGeminiClient` so no real API calls
  happen in the test suite.
- **`GeminiClient`** (`coach/clients.py`) - the only place `google.genai`
  is imported directly. Tested via `unittest.mock.patch` on
  `coach.clients.genai.Client`, confirming the correct model name
  (`gemini-3.6-flash`) is used and `.text` is extracted correctly.
- **Rate limiting** (`coach/models.py` `AIUsage`, `coach/rate_limit.py`) -
  `check_and_increment_usage()` wrapped in `transaction.atomic()` with
  `select_for_update()` to prevent a race condition where two
  simultaneous requests could both pass the limit check before either
  increments. `UniqueConstraint` on `(user_id, request_date)` at the
  database level. 4 tests including independent-limits-per-user.
- **Context retrieval** (`coach/context.py`) - `build_user_context()`
  pulls profile, active goals, recent workouts (later: recent activities
  too, see Section 4) for one user only. Explicitly tested for the
  ownership boundary (another user's workout never appears in the
  context), matching architecture.md section 16's "never send the whole
  database" requirement.
- **The endpoint** (`coach/views.py`, `POST /api/v1/ai/coach`) - ties it
  all together: auth required, empty message → `422`, rate limit hit →
  `429`, Gemini exception of any kind → `503` with a safe message (never
  a `500`, per architecture.md section 22's "AI can fail, never crash the
  app" rule). The system prompt bakes in the AI-safety requirement from
  section 19 directly ("not a doctor, don't diagnose, encourage
  professional evaluation").

**16 tests, all passing, all written before their implementation.**

### Real end-to-end verification
After the mocked test suite passed, a real request was sent through the
live stack (`scripts/test_ai_coach.py`) - genuine Supabase auth, real
profile/goal data pulled by `build_user_context`, sent to the real Gemini
API, and a real, correctly personalized response came back referencing
the user's actual goals by name, with the safety disclaimer appearing
naturally.

### Frontend
`src/pages/Coach.tsx` - a chat-style UI (message bubbles, auto-scroll,
Enter-to-send, Shift+Enter for newline), added to the sidebar nav. Errors
from the backend (`429` rate-limited vs `503` Gemini-down) are now
surfaced with their real, distinct messages rather than a generic
failure - this required improving `src/lib/api.ts` first (see below).

### `api.ts` improvement
The existing API client's error handling only threw a generic "Request
failed with status X." Rewritten to parse the backend's actual
`{"detail": "..."}` message into a proper `ApiError` class carrying both
the real message and the HTTP status - necessary so the Coach page can
distinguish a rate-limit message from a provider-down message, which are
very different situations for the user.

---

## 3. Goal system redesign

### The problem
The original `Goal` model had one flat `target_value` + `target_unit`
pair for every goal type. This doesn't represent reality: a running goal
needs distance/current-time/target-time, a strength goal needs a specific
exercise and current/target 1RM, a weight-loss goal needs current/target
weight. The AI coach could only ever say "your target is X kg/km" with no
sense of current capability or actual training progress.

### New schema
`goals/models.py` - `Goal` now has:
- `category` (renamed from `goal_type`) - the 6 existing choices, unchanged
- `objective` - a curated string identifying *what kind* of goal within
  that category (e.g. `"one_rep_max"`, `"race_time"`, `"endurance_base"`)
- `metrics` (new, `JSONField`) - category/objective-specific current and
  target numbers, deliberately flexible rather than a sparse table of
  20 mostly-null columns
- `training_preferences` (new, `JSONField`) - days/week, session
  duration; explicitly separate from `metrics` so "what the user wants"
  and "what they can realistically train" stay conceptually distinct, per
  the original refactor spec's three-way split (goal / capability /
  constraints)
- `deadline` (renamed from `target_date`)
- `status` - unchanged

Explicit non-goal: no per-category hardcoded Django models or
serializers. One `Goal` model, one serializer, flexible JSON underneath -
matching the refactor spec's "do NOT create six completely separate
hardcoded goal systems" requirement.

### Migration: preserving real data
The first `makemigrations` Django generated put all four `RemoveField`
operations *before* the `AddField` operations, which would have deleted
the old `target_value`/`target_unit`/`goal_type`/`target_date` data
before there was anywhere to copy it to. **Caught and fixed before
running it** - the migration file
(`goals/migrations/0002_remove_goal_goal_type_remove_goal_target_date_and_more.py`)
was hand-restructured into three ordered steps:
1. `AddField` for all five new fields (old fields still present)
2. `RunPython` data migration - copies `goal_type` → `category`,
   `target_value`/`target_unit` → `metrics = {"target_value": ..., "unit": ...}`,
   `target_date` → `deadline`, with a reverse function for
   migration reversibility
3. `RemoveField` for the four old fields, now safe since data was already
   copied out

Verified directly in Supabase's Table Editor after running: both existing
goals retained their real data in the new structure (e.g. the "strength"
goal correctly shows `metrics: {"unit":"kg","target_value":100.0}`), not
overwritten with placeholder defaults.

### `GoalSerializer` update
Simple field-list update to match the new model shape. Caught by the test
suite (not manually) - `ImproperlyConfigured: Field name 'goal_type' is
not valid` - a good example of tests catching a real regression from a
model change immediately rather than silently.

### `coach/context.py` update
Also broken by the goal model change (`AttributeError: 'Goal' object has
no attribute 'target_value'`) - caught by the same test-first process.
Rewritten with a `_format_metrics()` helper that renders whatever keys
exist in a goal's `metrics`/`training_preferences` dict generically,
without assuming a fixed shape per category - this is what makes the
context builder scale to new goal objectives later without needing code
changes, directly satisfying the refactor spec's scalability requirement.

### Frontend: progressive goal form
`src/constants/goalOptions.ts` (new) - single source of truth defining,
per category, the list of objectives and each objective's exact form
fields (label, type, optional). `src/pages/Goals.tsx` rebuilt to read
entirely from this config: picking a category repopulates the objective
dropdown (hidden entirely when a category has only one implicit
objective, e.g. general fitness, to avoid unnecessary UI per the spec's
"don't overwhelm users" requirement); picking an objective swaps in
exactly the right fields. Goal cards render whatever `metrics` keys exist
rather than assuming a fixed shape, matching the backend's rendering
philosophy.

**Expanded objectives added after direct feedback** that the initial set
didn't cover real training methodologies:
- Running: added endurance base (Zone 2), interval training, tempo runs -
  alongside the original distance/pace/race-completion/race-time options
- Cycling: added endurance base, climbing improvement - alongside
  distance/speed/event-completion/event-time

Because the form reads entirely from the config file, adding these was a
**config-only change** - no changes needed to `Goals.tsx` itself,
demonstrating the scalability the architecture was built for.

---

## 4. New `activities` app

### Why
Identified mid-session: goals now support running/cycling training
objectives (Zone 2 endurance, interval training, climbing, etc.), but
there was no way to actually log a run or ride - `workouts` is entirely
shaped around resistance training (pick an exercise from a barbell/
dumbbell library, log sets/reps/weight), which doesn't fit cardio
training at all. Traced back to the *original* engineering spec (section
6.7, "activities" table for running/cycling/walking) which was in scope
from day one but fell through the cracks when V1 was actually built.

### What was built, same TDD pattern as every other app
`Activity` model - `activity_type` (running/cycling/walking),
`activity_date`, `distance_km`, `duration_minutes`,
`avg_pace_min_per_km`, `avg_speed_kmh`, `elevation_gain_m`,
`avg_heart_rate`, `notes`. Standard `user_id`-filtered ownership pattern,
identical shape to `goals`. List/create + retrieve/delete endpoints.

**9 tests** - auth required, model creation for both running (pace-based)
and cycling (with elevation) shapes, and full ownership boundary coverage
(list only returns own activities, other user gets 404 on view/delete,
delete leaves the record untouched for non-owners).

One early failure caught and explained: all 5 ownership/auth-required
tests initially returned `404` instead of the expected status - traced to
`config/urls.py` missing the `include('activities.urls')` line, not a
code bug.

### `coach/context.py` updated again
Added a "Recent activities" section, same TDD process - two new tests
(`test_context_includes_recent_activities`,
`test_context_activities_are_ownership_scoped`), confirmed RED (missing
from context), then GREEN after adding the section. This is what actually
closes the loop: a running goal's context now includes real logged runs
with pace/distance, not just the target number floating alone.

### Frontend
`src/pages/Activities.tsx` (new) - mirrors the Workouts page's shape
(month-grouped cards, modal-based create form, overflow menu for delete).
Progressive fields within the form itself: pace field shown only for
running/walking, speed + elevation shown only for cycling - a smaller,
inline version of the same "don't show irrelevant fields" principle used
in the goal form.

**Full suite after this app: 50 tests, all passing.**

---

## 5. Critical security fix: Supabase RLS

### The issue
A Supabase automated security email flagged two critical issues:
`rls_disabled_in_public` and `sensitive_columns_exposed`, both on the
`fitness-ai` project.

### Why it was real, despite the app going through Django
Supabase automatically exposes every `public` schema table via a REST API
(PostgREST), independent of whether the app's own code uses it. The
frontend's Supabase client (used for login/signup) already ships the
project's anon/publishable key inside the browser bundle, which is by
design public. With Row-Level Security disabled, anyone with the project
URL and that already-public key could read, write, or delete every row in
every table - completely bypassing Django's authentication and ownership
logic, since that logic only applies to requests that go through Django,
not requests that hit Supabase's API directly. This was visible the
entire project as the orange "RLS disabled" badge on every table in
Supabase's Table Editor, never previously addressed.

### The fix
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
-- plus Django's own internal tables (auth_user, django_session, etc.)
```
Enabling RLS with **zero policies** was sufficient and correct here - it
locks the `anon`/`authenticated` PostgREST roles out entirely, while
Django's own database connection (the `postgres.xxx` pooler role) owns
these tables and bypasses RLS by default, so the app itself needed no
changes.

### Verification, two independent checks
1. **App unaffected**: a real authenticated request through
   `scripts/test_ai_coach.py` still returned `200` with a correct
   response after the fix.
2. **Vulnerability closed**: a direct request to Supabase's REST API
   (`GET {SUPABASE_URL}/rest/v1/profiles?select=*` with just the public
   anon key, bypassing Django entirely) - which would have returned every
   user's real profile data before the fix - now returns `200` with an
   empty list `[]`.

Both confirmed via real test scripts (`scripts/test_rls.py`, new), not
just the Supabase dashboard clearing the warning.

---

## 6. Housekeeping

- `pytest.ini` updated with `addopts = --ignore=scripts` - the manual
  one-off test scripts in `scripts/` were being incorrectly collected by
  pytest (matching the `test_*.py` naming pattern) and attempting real
  network calls at import time, causing collection errors unrelated to
  actual test failures.
- Noted: `scripts/test_request.py` now fails with `400` since it predates
  the goal redesign and sends the old flat shape - functioning correctly
  as a validation check, but worth updating or retiring later since it no
  longer reflects the current API.

---

## 7. Current state

- ✅ AI Coach (V2) fully built and working, real Gemini responses
  referencing real user data
- ✅ Goal system redesigned to a flexible, scalable category/objective/
  metrics structure - real data preserved through migration
- ✅ `activities` app closes the running/cycling training-data gap
  identified this session
- ✅ AI coach context now includes profile, goals (with full structured
  metrics), workouts, and activities - all ownership-scoped
- ✅ 50 backend tests, all passing, all written test-first
- ✅ Critical Supabase RLS vulnerability found and fixed, verified two ways
- ✅ Frontend: Coach chat page, redesigned progressive Goals form,
  Activities page - all added to the sidebar

**Still open:**
- No automated frontend tests (unchanged from prior sessions)
- `scripts/test_request.py` (and possibly other old manual scripts)
  reference outdated API shapes and should be updated or removed
- Chat history in the Coach page is not persisted (`ai_conversations`/
  `ai_messages` models from the original spec were not built - the
  current coach is stateless per-request, no memory between messages)
- V1's originally-noted gaps (no automated frontend tests, fixed weekly
  ring target) remain open

**Next up:** likely V3 (AI progress analysis) or persistent chat history
for the coach, per the original roadmap - or further frontend polish on
the new Goals/Activities pages if that's preferred first.
