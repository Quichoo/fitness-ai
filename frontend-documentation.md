# AI Fitness Companion — Frontend Documentation

Complete reference for the React + Vite + TypeScript frontend, covering
everything built on Aug 16, 2026, on top of the completed Django backend
(see `django-backend-documentation.md`). Together these two documents
cover the full V1 stack.

---

## 1. Stack

- **React 18** + **TypeScript**
- **Vite** — dev server and build tool
- **React Router** (`react-router-dom`) — client-side routing, protected routes
- **@supabase/supabase-js** — talks to Supabase Auth directly for login/signup/session management
- Plain CSS (`src/index.css`) — no component library, hand-written design tokens

No state-management library (Redux, Zustand, etc.) and no server-state
library (TanStack Query, etc.) were introduced — deliberately kept simple
for V1, matching the "don't add complexity before it's needed" principle
from the original architecture doc. Each page manages its own data with
plain `useState`/`useEffect`.

---

## 2. Project structure

```
fitness-ai/
└── frontend/
    ├── .env                      (Vite env vars - VITE_ prefix required)
    ├── src/
    │   ├── main.tsx              (Vite/React entry point - untouched from scaffold)
    │   ├── App.tsx               (routing + navbar wiring)
    │   ├── index.css             (design tokens + all page styling)
    │   ├── lib/
    │   │   ├── supabase.ts       (Supabase client singleton)
    │   │   ├── AuthContext.tsx   (tracks logged-in session app-wide)
    │   │   └── api.ts            (Django API client - GET/POST/PUT/PATCH/DELETE)
    │   ├── components/
    │   │   └── Navbar.tsx        (top nav, shown only when logged in)
    │   └── pages/
    │       ├── Login.tsx
    │       ├── Dashboard.tsx     (shows the user's profile)
    │       ├── Goals.tsx         (list, create, toggle status, delete)
    │       ├── Exercises.tsx     (read-only list)
    │       └── Workouts.tsx      (list, create with one nested exercise, delete)
    └── (rest is standard Vite scaffold: package.json, vite.config.ts, etc.)
```

Created via `npm create vite@latest frontend -- --template react-ts`, the
official Vite scaffolding tool - equivalent in spirit to `startproject`/
`startapp` on the Django side, though Vite doesn't have Django's concept
of "apps"; it's just one flat `src/` tree with folders we organized by
convention (`lib`, `components`, `pages`).

---

## 3. Environment variables (`frontend/.env`)

```
VITE_SUPABASE_URL=https://ftvgirbcywjtiawcyrtx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_LWRhD6mfx9EsU8qkKyJbBA_jpFVNSvu
VITE_API_URL=http://127.0.0.1:8000
```

Vite only exposes environment variables to the browser if they're
prefixed with `VITE_` - anything without that prefix is ignored, as a
safety measure against accidentally shipping backend secrets to the
client. Both Supabase values here are meant to be public (the anon/
publishable key is safe by design), so there's no secret-handling concern
on this side, unlike the backend's `.env`.

---

## 4. Authentication flow

### `src/lib/supabase.ts`
One shared Supabase client, created once and imported everywhere:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### `src/lib/AuthContext.tsx`
Wraps the whole app (in `App.tsx`) and exposes `session`/`loading` via
`useAuth()` to any component. On mount, checks for an existing session
(so refreshing the page doesn't log you out) and subscribes to future
auth state changes (login, logout, token refresh) so `session` always
reflects the current state without manual polling.

### Login/logout
`Login.tsx` calls `supabase.auth.signInWithPassword({ email, password })`
directly - the frontend never talks to Django for authentication itself,
only for fetching/writing app data afterward. Logout is
`supabase.auth.signOut()`, wired into the navbar.

### Protected routing
Handled in `App.tsx`'s `AppRoutes` component: every route except `/login`
checks `session` and redirects to `/login` if absent, mirroring the same
protected-route pattern used earlier in this project's history (and the
one abandoned in the first frontend attempt - this is the same concept,
just introduced gradually this time instead of all at once).

---

## 5. Talking to the Django backend (`src/lib/api.ts`)

A small set of functions, one per HTTP verb, all sharing one private
helper that attaches the current Supabase session's access token as a
`Bearer` header:

```typescript
async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
```

Exposed functions: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`
- each takes a path (e.g. `/api/v1/goals`) and, for writes, a body object.

**Important distinction learned while building this:** DRF's `PUT`
requires the *entire* resource to be sent, and returns `400 Bad Request`
if given a partial body. `PATCH` allows partial updates. The goal
status-toggle feature initially used `PUT` with just `{ status: ... }`
and failed for exactly this reason - switched to `apiPatch` and it
works correctly. Use `PATCH` for any partial-field update going forward.

No token is never silently dropped - if there's no session, the
`Authorization` header is simply omitted, and Django's
`SupabaseJWTAuthentication` correctly returns `401` in that case (already
verified working during backend testing).

---

## 6. Styling system (`src/index.css`)

Hand-written CSS with a small set of design tokens as CSS custom
properties, dark theme:

```css
--bg: #14161a        /* page background */
--surface: #1c1f24    /* cards, forms */
--border: #2c3038
--text: #eceef0
--muted: #9aa1ab
--accent: #ff5a1f     /* primary actions */
--danger: #e5484d     /* delete buttons, errors */
```

Reusable classes rather than a component library: `.page` (max-width
content wrapper), `.card` (list item container), `.tag` /`.tag.active`
(status pills), `.danger` (delete buttons), `.secondary` (muted buttons),
`.error` / `.muted` (text helpers). No CSS framework (Tailwind, etc.)
was introduced - plain CSS was enough for this scope.

---

## 7. Pages, one by one

### `Login.tsx`
Email/password form → `supabase.auth.signInWithPassword`. Errors from
Supabase (wrong password, etc.) are displayed inline.

### `Dashboard.tsx`
Fetches `/api/v1/profile` on mount via `apiGet`, displays `display_name`
and `fitness_level` in a card. No edit form built yet for the profile
itself (see Section 9).

### `Goals.tsx`
- Form at the top: select goal type, optional target value/unit → `apiPost`
- List below: each goal in a card, showing type/value/unit
- **Status tag is clickable** - toggles `active`↔`completed` via `apiPatch`
  (this is the "edit" functionality for goals; goals don't have enough
  editable fields to justify a full edit form)
- **Delete button** per goal → `apiDelete`, with a `confirm()` prompt first

### `Exercises.tsx`
Read-only list from `/api/v1/exercises`, no form - matches the backend's
own read-only enforcement (a `POST` here would get `405` from Django
regardless, so there's no create UI to build).

### `Workouts.tsx`
- Form: name, date, duration, and **one optional exercise** (dropdown of
  all seeded exercises) with reps/weight for a single set → `apiPost`
  with the nested `exercises: [{ exercise_id, exercise_order, sets: [...] }]`
  structure the backend expects
- List below: each workout in a card with date/duration/source tag
- **Delete button** per workout → `apiDelete` (cascades to the workout's
  exercises/sets automatically on the backend, already verified via
  Supabase Table Editor after a test delete)

**Known limitation, deliberate for V1:** the create form only supports
one exercise per workout, with one set. Multi-exercise, multi-set workout
creation is a real UI complexity step up (needs a repeatable sub-form)
and was intentionally deferred - the backend already supports arbitrarily
many nested exercises/sets in one request (proven via `test_workout.py`),
so this is purely a frontend enhancement to add later, not a backend
limitation.

---

## 8. CORS (backend-side change made to support the frontend)

Required since the browser and Django run on different origins
(`localhost:5173` vs `127.0.0.1:8000`). Added to the Django backend:

```
pip install django-cors-headers
```

In `config/settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be first
    # ...rest unchanged
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

---

## 9. Daily startup guide (both servers)

Both the Django backend and the Vite frontend need to be running
simultaneously, in two separate terminals.

**Terminal 1 — backend:**
```
cd C:\fitness-ai\backend
venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 — frontend:**
```
cd C:\fitness-ai\frontend
npm run dev
```

Then open `http://localhost:5173/` in a browser. If you get CORS errors
in the browser console, double check the backend is actually running -
Vite's dev server alone can't reach Django if it's not up.

**If Django model changes were made since last time**, run migrations in
Terminal 1 before starting the server (see the backend documentation,
Section 8).

---

## 10. What's left, and what's next

**Frontend gaps to revisit:**
- No profile edit form yet (Dashboard is read-only display)
- Workout creation only supports one exercise/one set (see Section 7)
- No loading states/spinners - pages briefly show empty before data arrives
- No automated frontend tests

**Backend gaps** (carried over from `django-backend-documentation.md`,
Section 9): no formal test suite, no workout editing endpoint, no rate
limiting.

**This closes out V1** of the original project roadmap ("core tracker, no
AI") - every planned resource (profile, goals, exercises, workouts) has a
working, ownership-tested backend endpoint and a working, styled frontend
page, wired together through real Supabase authentication.

**Next up (V2):** the AI coach - a read-only chat feature where the AI
answers questions using the user's real data (profile, goals, recent
workouts), retrieved by the backend and passed as context, with usage
rate-limiting and graceful fallback if the AI provider is unavailable -
per the original roadmap's V2 definition, now sitting on top of this
Django + React stack instead of the originally planned FastAPI backend.
