import uuid
from datetime import date, timedelta
from django.test import TestCase
from exercises.models import Exercise
from workouts.models import Workout, WorkoutExercise, WorkoutSet
from activities.models import Activity
from progress.stats import estimate_one_rep_max, calculate_weekly_workout_frequency, calculate_activity_trends
from rest_framework.test import APIClient
from profiles.test_helpers import make_authenticated_client

class EstimateOneRepMaxTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.bench = Exercise.objects.create(name="Bench Press", muscle_group="chest")

    def test_estimates_1rm_using_epley_formula(self):
        workout = Workout.objects.create(user_id=self.user_id, name="Push", workout_date=date.today())
        we = WorkoutExercise.objects.create(workout=workout, exercise=self.bench, exercise_order=1)
        WorkoutSet.objects.create(workout_exercise=we, set_number=1, reps=8, weight_kg=60)

        # Epley: weight * (1 + reps/30) = 60 * (1 + 8/30) = 76.0
        result = estimate_one_rep_max(self.user_id, self.bench.id)
        self.assertAlmostEqual(result, 76.0, places=1)

    def test_returns_none_when_no_sets_logged(self):
        result = estimate_one_rep_max(self.user_id, self.bench.id)
        self.assertIsNone(result)

    def test_uses_the_heaviest_estimated_set_not_just_the_latest(self):
        workout = Workout.objects.create(user_id=self.user_id, name="Push", workout_date=date.today())
        we = WorkoutExercise.objects.create(workout=workout, exercise=self.bench, exercise_order=1)
        WorkoutSet.objects.create(workout_exercise=we, set_number=1, reps=10, weight_kg=50)  # est 66.7
        WorkoutSet.objects.create(workout_exercise=we, set_number=2, reps=5, weight_kg=70)   # est 81.7

        result = estimate_one_rep_max(self.user_id, self.bench.id)
        self.assertAlmostEqual(result, 81.67, places=1)

    def test_only_considers_own_data(self):
        other_user = uuid.uuid4()
        workout = Workout.objects.create(user_id=other_user, name="Push", workout_date=date.today())
        we = WorkoutExercise.objects.create(workout=workout, exercise=self.bench, exercise_order=1)
        WorkoutSet.objects.create(workout_exercise=we, set_number=1, reps=5, weight_kg=100)

        result = estimate_one_rep_max(self.user_id, self.bench.id)
        self.assertIsNone(result)
        
    def test_template_workout_sets_are_excluded_from_1rm(self):
        workout = Workout.objects.create(
            user_id=self.user_id, name="Template", workout_date=date.today(), is_template=True
        )
        we = WorkoutExercise.objects.create(workout=workout, exercise=self.bench, exercise_order=1)
        WorkoutSet.objects.create(workout_exercise=we, set_number=1, reps=5, weight_kg=200)  # would estimate huge 1RM

        result = estimate_one_rep_max(self.user_id, self.bench.id)
        self.assertIsNone(result)  # template numbers are suggestions, not real lifts


class WeeklyWorkoutFrequencyTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()

    def test_counts_workouts_in_the_last_7_days(self):
        Workout.objects.create(user_id=self.user_id, name="A", workout_date=date.today())
        Workout.objects.create(user_id=self.user_id, name="B", workout_date=date.today() - timedelta(days=3))
        Workout.objects.create(user_id=self.user_id, name="C", workout_date=date.today() - timedelta(days=10))

        result = calculate_weekly_workout_frequency(self.user_id)
        self.assertEqual(result, 2)

    def test_template_workouts_do_not_count_toward_frequency(self):
        Workout.objects.create(user_id=self.user_id, name="Real", workout_date=date.today())
        Workout.objects.create(user_id=self.user_id, name="Template", workout_date=date.today(), is_template=True)

        result = calculate_weekly_workout_frequency(self.user_id)
        self.assertEqual(result, 1)


class ActivityTrendsTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()

    def test_calculates_average_pace_over_recent_runs(self):
        Activity.objects.create(
            user_id=self.user_id, activity_type="running", activity_date=date.today(),
            distance_km=5, avg_pace_min_per_km=6.0,
        )
        Activity.objects.create(
            user_id=self.user_id, activity_type="running", activity_date=date.today() - timedelta(days=2),
            distance_km=5, avg_pace_min_per_km=6.4,
        )

        result = calculate_activity_trends(self.user_id, activity_type="running")
        self.assertAlmostEqual(result["avg_pace_min_per_km"], 6.2, places=1)
        self.assertEqual(result["total_distance_km"], 10)

    def test_returns_none_values_when_no_activities_logged(self):
        result = calculate_activity_trends(self.user_id, activity_type="cycling")
        self.assertIsNone(result["avg_pace_min_per_km"])
        self.assertEqual(result["total_distance_km"], 0)

class ProgressEndpointTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.bench = Exercise.objects.create(name="Bench Press", muscle_group="chest")

    def test_requires_authentication(self):
        client = APIClient()
        response = client.get("/api/v1/progress")
        self.assertEqual(response.status_code, 401)

    def test_returns_stats_for_authenticated_user(self):
        workout = Workout.objects.create(user_id=self.user_id, name="Push", workout_date=date.today())
        we = WorkoutExercise.objects.create(workout=workout, exercise=self.bench, exercise_order=1)
        WorkoutSet.objects.create(workout_exercise=we, set_number=1, reps=8, weight_kg=60)

        client = make_authenticated_client(APIClient(), self.user_id)
        response = client.get("/api/v1/progress")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["weekly_workout_frequency"], 1)
        self.assertIn("one_rep_maxes", response.data)

    def test_one_rep_maxes_only_include_exercises_user_has_logged(self):
        # Squat exists in the library but this user never logged it
        Exercise.objects.create(name="Squat", muscle_group="legs")
        workout = Workout.objects.create(user_id=self.user_id, name="Push", workout_date=date.today())
        we = WorkoutExercise.objects.create(workout=workout, exercise=self.bench, exercise_order=1)
        WorkoutSet.objects.create(workout_exercise=we, set_number=1, reps=5, weight_kg=70)

        client = make_authenticated_client(APIClient(), self.user_id)
        response = client.get("/api/v1/progress")

        exercise_names = [e["exercise_name"] for e in response.data["one_rep_maxes"]]
        self.assertIn("Bench Press", exercise_names)
        self.assertNotIn("Squat", exercise_names)